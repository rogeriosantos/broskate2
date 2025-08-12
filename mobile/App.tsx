import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './src/stores/authStore'
import AppNavigator from './src/navigation/AppNavigator'

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

  useEffect(() => {
    // Load stored authentication on app start
    loadStoredAuth()
  }, [loadStoredAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AppNavigator />
    </QueryClientProvider>
  )
}
