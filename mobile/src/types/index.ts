// Shared types for BroSkate Mobile App

export interface User {
  id: number
  username: string
  email?: string
  profile_image_url?: string
  bio?: string
  location?: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'pro'
  favorite_tricks?: string[]
  created_at: string
  is_guest?: boolean
  is_active: boolean
}

export interface Spot {
  id: number
  name: string
  description?: string
  address?: string
  latitude: number
  longitude: number
  spot_type: 'street' | 'park' | 'bowl' | 'vert' | 'mini_ramp' | 'ledge' | 'stair' | 'rail' | 'gap' | 'other'
  difficulty_level: 1 | 2 | 3 | 4 | 5
  features?: string[]
  approved: boolean
  created_by: number
  created_at: string
  distance?: number
}

export interface Shop {
  id: number
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  contact_email?: string
  website_url?: string
  logo_url?: string
  owner_id: number
  created_at: string
  is_verified: boolean
  is_active: boolean
  distance?: number
}

export interface ShopEvent {
  id: number
  shop_id: number
  shop?: Shop
  name: string
  description?: string
  event_type: 'session' | 'competition' | 'sale' | 'demo' | 'other'
  start_time: string
  end_time?: string
  is_recurring: boolean
  recurrence_pattern?: string
  image_url?: string
  max_attendees?: number
  created_at: string
  is_active: boolean
}

export interface EventRSVP {
  id: number
  event_id: number
  user_id: number
  status: 'going' | 'maybe' | 'not_going'
  created_at: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  total?: number
}

export interface PaginatedResponse<T> {
  data: {
    items: T[]
    total: number
    page: number
    limit: number
  }
  message: string
}

export interface LocationCoords {
  latitude: number
  longitude: number
}

export interface SearchFilters {
  query?: string
  spot_type?: string
  difficulty_level?: number
  latitude?: number
  longitude?: number
  radius_km?: number
  approved_only?: boolean
}

export interface Notification {
  id: string
  title: string
  body: string
  type: 'event' | 'follow' | 'spot' | 'shop' | 'general'
  data?: Record<string, any>
  read: boolean
  created_at: string
}