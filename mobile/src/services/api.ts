import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ApiResponse, User, Spot, Shop, ShopEvent } from '../types'

// Use your local development server IP or production URL
const API_BASE_URL = __DEV__ 
  ? 'http://10.10.42.177:8000' // Your machine's IP for React Native development
  : 'https://your-production-api.com'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Create a second instance for guest/public endpoints
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.log('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401
      await AsyncStorage.multiRemove(['auth_token', 'user_data'])
      // Could trigger navigation to login screen here
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: (data: { username: string; email?: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/register', data),
    
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/login', data),
    
  getMe: () => api.get<ApiResponse<User>>('/api/auth/me'),
  
  refresh: () => api.post<ApiResponse<{ token: string }>>('/api/auth/refresh'),
}

// Users API
export const usersApi = {
  getUsers: (params?: {
    page?: number
    limit?: number
    skill_level?: string
    location?: string
    search?: string
  }) => api.get<ApiResponse<{ users: User[]; total: number }>>('/api/users/list', { params }),
  
  getProfile: () => api.get<ApiResponse<User>>('/api/users/profile'),
  
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/api/users/profile', data),
  
  getUser: (userId: number) => api.get<ApiResponse<User>>(`/api/users/${userId}`),
  
  followUser: (userId: number) => api.post<ApiResponse<any>>(`/api/users/${userId}/follow`),
  
  unfollowUser: (userId: number) => api.delete<ApiResponse<any>>(`/api/users/${userId}/follow`),
  
  getFollowers: (userId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ followers: User[]; total: number }>>(`/api/users/${userId}/followers`, { params }),
    
  getFollowing: (userId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ following: User[]; total: number }>>(`/api/users/${userId}/following`, { params }),
    
  getFollowStatus: (userId: number) => 
    api.get<ApiResponse<{ is_following: boolean; is_self: boolean }>>(`/api/users/${userId}/follow-status`),
}

// Spots API
export const spotsApi = {
  getSpots: (params?: {
    page?: number
    limit?: number
    latitude?: number
    longitude?: number
    radius_km?: number
    spot_type?: string
    difficulty_level?: number
    approved_only?: boolean
    search?: string
  }) => api.get<ApiResponse<{ spots: Spot[]; total: number }>>('/api/spots', { params }),
    
  createSpot: (data: Partial<Spot>) => api.post<ApiResponse<Spot>>('/api/spots', data),
  
  getSpot: (spotId: number) => api.get<ApiResponse<Spot>>(`/api/spots/${spotId}`),
  
  getNearbySpots: (params: {
    latitude: number
    longitude: number
    radius_km?: number
    limit?: number
  }) => api.get<ApiResponse<{ spots: Spot[]; total: number }>>('/api/spots/nearby', { params }),
  
  checkinAtSpot: (spotId: number, data?: { notes?: string }) =>
    api.post<ApiResponse<any>>(`/api/spots/${spotId}/checkin`, data),
    
  getSpotCheckins: (spotId: number, params?: { limit?: number }) =>
    api.get<ApiResponse<any>>(`/api/spots/${spotId}/checkins`, { params }),
    
  searchSpots: (query: string, params?: {
    latitude?: number
    longitude?: number
    radius_km?: number
    limit?: number
  }) => api.get<ApiResponse<{ spots: Spot[]; total: number }>>('/api/spots/search', { 
    params: { q: query, ...params } 
  }),
}

// Shops API
export const shopsApi = {
  getShops: (params?: {
    page?: number
    limit?: number
    latitude?: number
    longitude?: number
    radius_km?: number
    search?: string
  }) => api.get<ApiResponse<{ shops: Shop[]; total: number }>>('/api/shops', { params }),
    
  createShop: (data: Partial<Shop>) => api.post<ApiResponse<Shop>>('/api/shops', data),
  
  getShop: (shopId: number) => api.get<ApiResponse<Shop>>(`/api/shops/${shopId}`),
  
  updateShop: (shopId: number, data: Partial<Shop>) => 
    api.put<ApiResponse<Shop>>(`/api/shops/${shopId}`, data),
  
  joinShop: (shopId: number) => api.post<ApiResponse<any>>(`/api/shops/${shopId}/join`),
  
  leaveShop: (shopId: number) => api.delete<ApiResponse<any>>(`/api/shops/${shopId}/leave`),
  
  getShopEvents: (shopId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ events: ShopEvent[]; total: number }>>(`/api/shops/${shopId}/events`, { params }),
    
  createShopEvent: (shopId: number, data: Partial<ShopEvent>) =>
    api.post<ApiResponse<ShopEvent>>(`/api/shops/${shopId}/events`, data),
}

// Events API
export const eventsApi = {
  getEvents: (params?: {
    page?: number
    limit?: number
    latitude?: number
    longitude?: number
    radius_km?: number
    event_type?: string
    start_date?: string
    end_date?: string
  }) => api.get<ApiResponse<{ events: ShopEvent[]; total: number }>>('/api/events', { params }),
  
  getEvent: (eventId: number) => api.get<ApiResponse<ShopEvent>>(`/api/events/${eventId}`),
  
  rsvpToEvent: (eventId: number, status: 'going' | 'maybe' | 'not_going') =>
    api.post<ApiResponse<any>>(`/api/events/${eventId}/rsvp`, { status }),
    
  getEventRSVPs: (eventId: number) =>
    api.get<ApiResponse<any>>(`/api/events/${eventId}/rsvps`),
}

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.detail || error.response.data?.message || 'An error occurred'
  } else if (error.request) {
    // Request was made but no response
    return 'Network error - please check your connection'
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred'
  }
}

// Helper function to check network connectivity
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/health', { timeout: 5000 })
    return response.status === 200
  } catch {
    return false
  }
}