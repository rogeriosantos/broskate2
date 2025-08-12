import { create } from 'zustand'
import * as Location from 'expo-location'
import { LocationCoords } from '../types'

interface LocationState {
  currentLocation: LocationCoords | null
  isLocationEnabled: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  requestLocationPermission: () => Promise<boolean>
  getCurrentLocation: () => Promise<LocationCoords | null>
  watchLocation: () => Promise<void>
  stopWatchingLocation: () => void
  clearError: () => void
}

let locationSubscription: Location.LocationSubscription | null = null

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isLocationEnabled: false,
  isLoading: false,
  error: null,

  requestLocationPermission: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync()
      if (!enabled) {
        set({
          isLoading: false,
          error: 'Location services are disabled',
          isLocationEnabled: false
        })
        return false
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        set({
          isLoading: false,
          error: 'Location permission denied',
          isLocationEnabled: false
        })
        return false
      }

      set({
        isLoading: false,
        isLocationEnabled: true,
        error: null
      })
      
      return true
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to request location permission',
        isLocationEnabled: false
      })
      return false
    }
  },

  getCurrentLocation: async () => {
    const { isLocationEnabled } = get()
    
    if (!isLocationEnabled) {
      const hasPermission = await get().requestLocationPermission()
      if (!hasPermission) return null
    }

    set({ isLoading: true, error: null })
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 60000, // Use cached location if less than 1 minute old
      })
      
      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
      
      set({
        currentLocation: coords,
        isLoading: false,
        error: null
      })
      
      return coords
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to get current location'
      })
      return null
    }
  },

  watchLocation: async () => {
    const { isLocationEnabled } = get()
    
    if (!isLocationEnabled) {
      const hasPermission = await get().requestLocationPermission()
      if (!hasPermission) return
    }

    try {
      // Stop any existing subscription
      if (locationSubscription) {
        locationSubscription.remove()
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update when moved 50 meters
        },
        (location) => {
          const coords: LocationCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
          
          set({ currentLocation: coords })
        }
      )
    } catch (error: any) {
      set({
        error: error.message || 'Failed to watch location'
      })
    }
  },

  stopWatchingLocation: () => {
    if (locationSubscription) {
      locationSubscription.remove()
      locationSubscription = null
    }
  },

  clearError: () => set({ error: null })
}))

// Helper function to calculate distance between two coordinates
export const calculateDistance = (
  coord1: LocationCoords,
  coord2: LocationCoords
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}