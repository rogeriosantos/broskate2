import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { spotsApi, shopsApi, eventsApi } from '../services/api'
import { useLocationStore } from '../stores/locationStore'
import { Spot, Shop, ShopEvent } from '../types'

export interface SearchFilters {
  category: 'all' | 'spots' | 'shops' | 'events'
  sortBy: 'relevance' | 'distance' | 'rating' | 'newest'
  radius: number
  spotTypes: string[]
  difficultyLevels: string[]
  eventTypes: string[]
  priceRange: { min: number; max: number }
  dateRange: { start: string | null; end: string | null }
}

export interface SearchResult {
  spots: Spot[]
  shops: Shop[]
  events: ShopEvent[]
  total: number
}

export interface UseSearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  searchResults: SearchResult | null
  isLoading: boolean
  error: Error | null
  clearSearch: () => void
  clearFilters: () => void
  recentSearches: string[]
  addToRecentSearches: (query: string) => void
}

const defaultFilters: SearchFilters = {
  category: 'all',
  sortBy: 'relevance',
  radius: 25,
  spotTypes: [],
  difficultyLevels: [],
  eventTypes: [],
  priceRange: { min: 0, max: 100 },
  dateRange: { start: null, end: null }
}

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export const useSearch = (): UseSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { currentLocation } = useLocationStore()

  // Load recent searches from storage
  useEffect(() => {
    // In a real app, you'd load from AsyncStorage
    // For now, keep in memory
  }, [])

  // Global search query
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['globalSearch', searchQuery, filters, currentLocation],
    queryFn: async (): Promise<SearchResult> => {
      if (!searchQuery.trim()) {
        return { spots: [], shops: [], events: [], total: 0 }
      }

      const searchParams = {
        search: searchQuery,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        radius_km: filters.radius,
        limit: 50
      }

      const promises: [
        Promise<any> | null,
        Promise<any> | null, 
        Promise<any> | null
      ] = [null, null, null]

      // Spots search
      if (filters.category === 'all' || filters.category === 'spots') {
        promises[0] = spotsApi.getSpots({
          ...searchParams,
          spot_type: filters.spotTypes.length > 0 ? filters.spotTypes[0] : undefined,
          difficulty_level: filters.difficultyLevels.length > 0 ? 
            DIFFICULTY_LEVELS.indexOf(filters.difficultyLevels[0]) + 1 : undefined
        }).catch(() => ({ data: { data: { spots: [] } } }))
      }

      // Shops search
      if (filters.category === 'all' || filters.category === 'shops') {
        promises[1] = shopsApi.getShops(searchParams)
          .catch(() => ({ data: { data: { shops: [] } } }))
      }

      // Events search
      if (filters.category === 'all' || filters.category === 'events') {
        promises[2] = eventsApi.getEvents({
          ...searchParams,
          event_type: filters.eventTypes.length > 0 ? filters.eventTypes[0] : undefined,
          start_date: filters.dateRange.start || undefined,
          end_date: filters.dateRange.end || undefined
        }).catch(() => ({ data: { data: { events: [] } } }))
      }

      const [spotsResult, shopsResult, eventsResult] = await Promise.all([
        promises[0] || Promise.resolve({ data: { data: { spots: [] } } }),
        promises[1] || Promise.resolve({ data: { data: { shops: [] } } }),
        promises[2] || Promise.resolve({ data: { data: { events: [] } } })
      ])

      const spots = spotsResult?.data?.data?.spots || []
      const shops = shopsResult?.data?.data?.shops || []
      const events = eventsResult?.data?.data?.events || []

      // Apply client-side sorting
      const sortResults = (items: any[], type: 'spot' | 'shop' | 'event') => {
        if (filters.sortBy === 'distance') {
          return items.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        }
        if (filters.sortBy === 'rating') {
          return items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        }
        if (filters.sortBy === 'newest') {
          return items.sort((a, b) => {
            const aDate = new Date(a.created_at || a.start_time || 0).getTime()
            const bDate = new Date(b.created_at || b.start_time || 0).getTime()
            return bDate - aDate
          })
        }
        return items // relevance (default API order)
      }

      const sortedSpots = sortResults(spots, 'spot')
      const sortedShops = sortResults(shops, 'shop')  
      const sortedEvents = sortResults(events, 'event')

      return {
        spots: sortedSpots,
        shops: sortedShops,
        events: sortedEvents,
        total: sortedSpots.length + sortedShops.length + sortedEvents.length
      }
    },
    enabled: !!searchQuery.trim(),
    staleTime: 30000, // 30 seconds
  })

  const updateFilter = <K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return
    
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== query)
      return [query, ...filtered].slice(0, 10) // Keep last 10 searches
    })
    
    // In a real app, save to AsyncStorage here
  }

  // Auto-add successful searches to recent
  useEffect(() => {
    if (searchQuery.trim() && searchResults && searchResults.total > 0) {
      addToRecentSearches(searchQuery)
    }
  }, [searchQuery, searchResults?.total])

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    updateFilter,
    searchResults: searchResults || null,
    isLoading,
    error: error as Error | null,
    clearSearch,
    clearFilters,
    recentSearches,
    addToRecentSearches
  }
}

// Helper hook for quick search suggestions
export const useSearchSuggestions = (query: string) => {
  const { currentLocation } = useLocationStore()

  return useQuery({
    queryKey: ['searchSuggestions', query, currentLocation],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return []

      // Get quick results for suggestions
      const searchParams = {
        search: query,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        radius_km: 50,
        limit: 5
      }

      try {
        const [spotsResult, shopsResult] = await Promise.all([
          spotsApi.getSpots(searchParams).catch(() => null),
          shopsApi.getShops(searchParams).catch(() => null)
        ])

        const suggestions = [
          ...(spotsResult?.data?.data?.spots || []).map((spot: Spot) => ({
            id: `spot-${spot.id}`,
            title: spot.name,
            subtitle: `${spot.spot_type?.replace('_', ' ')} • ${spot.difficulty_level}`,
            type: 'spot' as const,
            icon: '🛹'
          })),
          ...(shopsResult?.data?.data?.shops || []).map((shop: Shop) => ({
            id: `shop-${shop.id}`,
            title: shop.name,
            subtitle: 'Skate Shop',
            type: 'shop' as const,
            icon: '🏪'
          }))
        ]

        return suggestions.slice(0, 8) // Limit to 8 suggestions
      } catch {
        return []
      }
    },
    enabled: query.length >= 2,
    staleTime: 60000 // 1 minute
  })
}