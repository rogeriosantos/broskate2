import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { authApi, handleApiError } from '../services/api'
import { useNotificationStore } from './notificationStore'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, email?: string) => Promise<boolean>
  logout: () => Promise<void>
  continueAsGuest: () => void
  loadStoredAuth: () => Promise<void>
  clearError: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    console.log('🔐 Attempting login for:', username)
    set({ isLoading: true, error: null })
    
    try {
      console.log('📡 Making login API call...')
      const response = await authApi.login({ username, password })
      console.log('✅ Login response received')
      
      // Handle both response formats - new format with data.user/token or old format with access_token
      let user, token
      
      if (response.data.data && response.data.data.user && response.data.data.token) {
        // New format: { data: { user: {...}, token: "..." } }
        user = response.data.data.user
        token = response.data.data.token
        console.log('📱 Using new response format')
      } else if (response.data.access_token) {
        // Old format: { access_token: "...", token_type: "bearer" }
        token = response.data.access_token
        console.log('📱 Using old response format, fetching user data...')
        
        // Store token temporarily for getMe call
        await AsyncStorage.setItem('auth_token', token)
        
        // Fetch user data separately
        try {
          const userResponse = await authApi.getMe()
          user = userResponse.data.data || userResponse.data
          console.log('👤 Fetched user data successfully')
        } catch (userError) {
          console.error('❌ Failed to fetch user data:', userError)
          console.error('❌ User fetch error details:', userError.response?.data)
          set({
            isLoading: false,
            error: 'Failed to fetch user information',
            isAuthenticated: false,
            isGuest: false
          })
          return false
        }
      } else {
        console.error('❌ Invalid login response format:', response.data)
        set({
          isLoading: false,
          error: 'Invalid server response',
          isAuthenticated: false,
          isGuest: false
        })
        return false
      }
      
      // Store credentials
      console.log('💾 Storing auth data...')
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(user)]
      ])
      
      console.log('✅ Setting authenticated state...')
      set({
        user,
        token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        error: null
      })
      
      // Connect to WebSocket for real-time notifications
      try {
        console.log('🔌 Connecting to WebSocket...')
        await useNotificationStore.getState().connect(user.id, token)
      } catch (wsError) {
        console.error('❌ WebSocket connection failed:', wsError)
        // Don't fail login if WebSocket fails
      }
      
      console.log('✅ Login successful!')
      return true
    } catch (error: any) {
      console.error('❌ Login error:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      const errorMessage = handleApiError(error)
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        isGuest: false
      })
      return false
    }
  },

  register: async (username: string, password: string, email?: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await authApi.register({ username, password, email })
      const { user, token } = response.data.data
      
      // Store credentials
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(user)]
      ])
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      return true
    } catch (error: any) {
      const errorMessage = handleApiError(error)
      set({
        isLoading: false,
        error: errorMessage
      })
      return false
    }
  },

  logout: async () => {
    try {
      // Disconnect from WebSocket
      useNotificationStore.getState().disconnect()
      
      // Clear stored credentials
      await AsyncStorage.multiRemove(['auth_token', 'user_data', 'is_guest'])
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: false,
        error: null
      })
    } catch (error) {
      console.log('Error during logout:', error)
    }
  },

  continueAsGuest: () => {
    AsyncStorage.setItem('is_guest', 'true')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: true,
      error: null,
      isLoading: false
    })
  },

  loadStoredAuth: async () => {
    console.log('🔄 Loading stored auth...')
    set({ isLoading: true })
    
    try {
      const [token, userData, isGuest] = await AsyncStorage.multiGet(['auth_token', 'user_data', 'is_guest'])
      console.log('📱 Stored auth data:', { 
        hasToken: !!token[1], 
        hasUser: !!userData[1], 
        isGuest: isGuest[1] 
      })
      
      // Check if user was in guest mode
      if (isGuest[1] === 'true') {
        console.log('👤 User was in guest mode')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: true,
          isLoading: false
        })
        return
      }
      
      if (token[1] && userData[1]) {
        const user = JSON.parse(userData[1])
        console.log('👤 Found stored user:', user.username)
        
        // Verify token is still valid - but don't fail if API is unreachable
        try {
          console.log('🔍 Validating token...')
          await authApi.getMe()
          console.log('✅ Token is valid')
          set({
            user,
            token: token[1],
            isAuthenticated: true,
            isGuest: false,
            isLoading: false
          })
        } catch (error) {
          console.log('❌ Token validation failed:', error.message)
          // Token is invalid, clear storage and continue as guest
          await AsyncStorage.multiRemove(['auth_token', 'user_data'])
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isGuest: false,
            isLoading: false
          })
        }
      } else {
        console.log('📱 No stored auth found')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: false
      })
    }
  },

  clearError: () => set({ error: null }),

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }
      set({ user: updatedUser })
      
      // Update stored user data
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser))
    }
  }
}))