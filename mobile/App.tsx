import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './src/stores/authStore'
import AppNavigator from './src/navigation/AppNavigator'

// Import native services
import { offlineStorage } from './src/services/offlineStorage'
import { locationService } from './src/services/locationService'
import { cameraService } from './src/services/cameraService'
import { notificationService } from './src/services/notificationService'
import { syncService } from './src/services/syncService'
import { deviceService } from './src/services/deviceService'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

export default function App() {
  const { loadStoredAuth } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing BroSkate app...')
      
      // Initialize core services in parallel
      const initPromises = [
        // Load stored auth first
        loadStoredAuth(),
        
        // Initialize device service (must be first for capabilities detection)
        deviceService.initialize(),
        
        // Initialize offline storage
        offlineStorage.initialize(),
        
        // Initialize notification service
        notificationService.initialize(),
        
        // Initialize sync service (depends on offline storage)
        syncService.initialize(),
      ]

      await Promise.all(initPromises)

      // Request location permissions after device service is ready
      try {
        const locationPermissions = await locationService.requestLocationPermissions()
        console.log('📍 Location permissions:', locationPermissions.granted ? 'granted' : 'denied')
      } catch (error) {
        console.warn('⚠️ Location service initialization failed:', error)
      }

      // Request camera permissions after device service is ready
      try {
        const cameraPermissions = await cameraService.requestPermissions()
        console.log('📷 Camera permissions:', cameraPermissions.camera ? 'granted' : 'denied')
      } catch (error) {
        console.warn('⚠️ Camera service initialization failed:', error)
      }

      // Log device information for debugging
      deviceService.logDeviceInfo()
      
      console.log('✅ App initialization completed')
      setIsInitializing(false)
      
    } catch (error) {
      console.error('❌ App initialization failed:', error)
      setInitError(`Failed to initialize app: ${error}`)
      setIsInitializing(false)
    }
  }

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#1a1a1a' 
      }}>
        <ActivityIndicator size="large" color="#00D4FF" />
        <Text style={{ 
          color: 'white', 
          marginTop: 16, 
          fontSize: 16,
          fontWeight: '500'
        }}>
          Initializing BroSkate...
        </Text>
      </View>
    )
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 20
      }}>
        <Text style={{ 
          color: '#FF6B6B', 
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 10
        }}>
          Initialization Error
        </Text>
        <Text style={{ 
          color: 'white', 
          fontSize: 14,
          textAlign: 'center',
          opacity: 0.8
        }}>
          {initError}
        </Text>
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AppNavigator />
    </QueryClientProvider>
  )
}
