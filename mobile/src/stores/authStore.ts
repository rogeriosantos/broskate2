import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { authApi, handleApiError } from '../services/api'

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
    set({ isLoading: true, error: null })
    
    try {
      const response = await authApi.login({ username, password })
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
    set({ isLoading: true })
    
    try {
      const [token, userData, isGuest] = await AsyncStorage.multiGet(['auth_token', 'user_data', 'is_guest'])
      
      // Check if user was in guest mode
      if (isGuest[1] === 'true') {
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
        
        // Verify token is still valid - but don't fail if API is unreachable
        try {
          await authApi.getMe()
          set({
            user,
            token: token[1],
            isAuthenticated: true,
            isGuest: false,
            isLoading: false
          })
        } catch {
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.log('Error loading stored auth:', error)
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