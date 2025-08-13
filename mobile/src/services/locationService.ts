import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface LocationPermissionStatus {
  granted: boolean
  canAskAgain: boolean
  status: string
}

// Background location task name
const BACKGROUND_LOCATION_TASK = 'background-location'

class LocationService {
  private currentLocation: LocationData | null = null
  private watchSubscription: Location.LocationSubscription | null = null
  private backgroundLocationEnabled = false

  // REQUEST PERMISSIONS
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      }
    } catch (error) {
      console.error('❌ Failed to request location permissions:', error)
      throw new Error('Location permission request failed')
    }
  }

  async requestBackgroundLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync()
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      }
    } catch (error) {
      console.error('❌ Failed to request background location permissions:', error)
      throw new Error('Background location permission request failed')
    }
  }

  // GET CURRENT LOCATION
  async getCurrentLocation(highAccuracy = true): Promise<LocationData> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        throw new Error('Location permission not granted')
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        maximumAge: 30000, // 30 seconds
        timeout: 15000, // 15 seconds
      })

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp
      }

      this.currentLocation = locationData
      console.log('📍 Current location updated:', locationData)
      
      return locationData
    } catch (error) {
      console.error('❌ Failed to get current location:', error)
      throw new Error('Failed to get current location')
    }
  }

  // WATCH LOCATION CHANGES
  async startLocationWatcher(
    callback: (location: LocationData) => void,
    highAccuracy = false
  ): Promise<void> {
    try {
      if (this.watchSubscription) {
        await this.stopLocationWatcher()
      }

      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission not granted')
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: location.timestamp
          }

          this.currentLocation = locationData
          callback(locationData)
        }
      )

      console.log('👀 Location watcher started')
    } catch (error) {
      console.error('❌ Failed to start location watcher:', error)
      throw new Error('Failed to start location tracking')
    }
  }

  async stopLocationWatcher(): Promise<void> {
    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove()
        this.watchSubscription = null
        console.log('🛑 Location watcher stopped')
      }
    } catch (error) {
      console.error('❌ Failed to stop location watcher:', error)
    }
  }

  // BACKGROUND LOCATION TRACKING
  async startBackgroundLocationTracking(): Promise<void> {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Background location permission not granted')
      }

      // Define background task if not already defined
      if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
        TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
          if (error) {
            console.error('❌ Background location error:', error)
            return
          }
          
          if (data) {
            const { locations } = data as { locations: Location.LocationObject[] }
            console.log('📍 Background location received:', locations)
            
            // Process background locations here
            // You could store them in offline storage or send to server
            locations.forEach(location => {
              const locationData: LocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || undefined,
                altitude: location.coords.altitude || undefined,
                heading: location.coords.heading || undefined,
                speed: location.coords.speed || undefined,
                timestamp: location.timestamp
              }
              
              // Store in offline storage for sync later
              this.currentLocation = locationData
            })
          }
        })
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Update every minute in background
        distanceInterval: 100, // Or when moved 100 meters
        deferredUpdatesInterval: 300000, // Batch updates every 5 minutes
        foregroundService: {
          notificationTitle: 'BroSkate Location',
          notificationBody: 'Tracking location for nearby skate spots',
        },
      })

      this.backgroundLocationEnabled = true
      console.log('🌙 Background location tracking started')
    } catch (error) {
      console.error('❌ Failed to start background location tracking:', error)
      throw new Error('Failed to start background location tracking')
    }
  }

  async stopBackgroundLocationTracking(): Promise<void> {
    try {
      if (this.backgroundLocationEnabled) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        this.backgroundLocationEnabled = false
        console.log('🌙 Background location tracking stopped')
      }
    } catch (error) {
      console.error('❌ Failed to stop background location tracking:', error)
    }
  }

  // LOCATION UTILITIES
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`
    } else {
      return `${Math.round(distanceKm)}km`
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<Location.LocationGeocodedAddress[]> {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude })
      return addresses
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error)
      return []
    }
  }

  async geocode(address: string): Promise<Location.LocationGeocodedLocation[]> {
    try {
      const locations = await Location.geocodeAsync(address)
      return locations
    } catch (error) {
      console.error('❌ Geocoding failed:', error)
      return []
    }
  }

  // GETTERS
  getLastKnownLocation(): LocationData | null {
    return this.currentLocation
  }

  isWatchingLocation(): boolean {
    return this.watchSubscription !== null
  }

  isBackgroundTrackingEnabled(): boolean {
    return this.backgroundLocationEnabled
  }

  // LOCATION-BASED FEATURES
  async findNearbySpots(
    spots: any[],
    maxDistance: number = 10, // kilometers
    currentLocation?: LocationData
  ): Promise<Array<any & { distance: number; formattedDistance: string }>> {
    try {
      const location = currentLocation || await this.getCurrentLocation()
      
      const nearbySpots = spots
        .map(spot => {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            spot.latitude,
            spot.longitude
          )
          
          return {
            ...spot,
            distance,
            formattedDistance: this.formatDistance(distance)
          }
        })
        .filter(spot => spot.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)

      console.log(`📍 Found ${nearbySpots.length} spots within ${maxDistance}km`)
      return nearbySpots
    } catch (error) {
      console.error('❌ Failed to find nearby spots:', error)
      return []
    }
  }

  async getLocationBasedRecommendations(
    currentLocation?: LocationData
  ): Promise<{
    weather?: string
    timeOfDay: string
    recommendations: string[]
  }> {
    try {
      const location = currentLocation || await this.getCurrentLocation()
      const now = new Date()
      const hour = now.getHours()
      
      let timeOfDay = 'morning'
      if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
      else if (hour >= 21 || hour < 6) timeOfDay = 'night'

      const recommendations = []
      
      // Time-based recommendations
      if (timeOfDay === 'morning') {
        recommendations.push('Great time for practice sessions!')
        recommendations.push('Check out parks with good lighting')
      } else if (timeOfDay === 'evening') {
        recommendations.push('Perfect for street skating')
        recommendations.push('Join evening skating groups')
      } else if (timeOfDay === 'night') {
        recommendations.push('Look for well-lit indoor spots')
        recommendations.push('Night skating can be epic!')
      }

      // Could add weather API integration here
      recommendations.push('Stay hydrated and wear protection')

      return {
        timeOfDay,
        recommendations
      }
    } catch (error) {
      console.error('❌ Failed to get location recommendations:', error)
      return {
        timeOfDay: 'unknown',
        recommendations: ['Check out local skate spots!']
      }
    }
  }
}

export const locationService = new LocationService()
export default locationService