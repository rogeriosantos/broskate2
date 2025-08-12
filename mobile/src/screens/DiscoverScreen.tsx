import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { spotsApi, shopsApi, eventsApi, handleApiError } from '../services/api'
import { useLocationStore } from '../stores/locationStore'
import { Spot, Shop, ShopEvent } from '../types'

const DiscoverScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { currentLocation, getCurrentLocation } = useLocationStore()

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  // Fetch nearby spots
  const { data: nearbySpots, refetch: refetchSpots } = useQuery({
    queryKey: ['nearbySpots', currentLocation],
    queryFn: () => spotsApi.getNearbySpots({
      latitude: currentLocation!.latitude,
      longitude: currentLocation!.longitude,
      radius_km: 25,
      limit: 6
    }),
    enabled: !!currentLocation,
  })

  // Fetch nearby shops
  const { data: nearbyShops, refetch: refetchShops } = useQuery({
    queryKey: ['nearbyShops', currentLocation],
    queryFn: () => shopsApi.getShops({
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 50,
      limit: 4
    }),
    enabled: !!currentLocation,
  })

  // Fetch upcoming events
  const { data: upcomingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['upcomingEvents', currentLocation],
    queryFn: () => eventsApi.getEvents({
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 50,
      limit: 4
    }),
    enabled: !!currentLocation,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await getCurrentLocation()
      await Promise.all([refetchSpots(), refetchShops(), refetchEvents()])
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results screen
      Alert.alert('Search', `Searching for: ${searchQuery}`)
    }
  }

  const SpotCard = ({ spot }: { spot: Spot }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{spot.name}</Text>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{spot.difficulty_level}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{spot.spot_type.replace('_', ' ')}</Text>
      {spot.distance && (
        <Text style={styles.distanceText}>{spot.distance.toFixed(1)} km away</Text>
      )}
      {spot.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {spot.description}
        </Text>
      )}
    </TouchableOpacity>
  )

  const ShopCard = ({ shop }: { shop: Shop }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>{shop.name}</Text>
      {shop.distance && (
        <Text style={styles.distanceText}>{shop.distance.toFixed(1)} km away</Text>
      )}
      {shop.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {shop.description}
        </Text>
      )}
    </TouchableOpacity>
  )

  const EventCard = ({ event }: { event: ShopEvent }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>{event.name}</Text>
      <Text style={styles.cardSubtitle}>{event.event_type}</Text>
      <Text style={styles.eventTime}>
        {new Date(event.start_time).toLocaleDateString()}
      </Text>
      {event.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {event.description}
        </Text>
      )}
    </TouchableOpacity>
  )

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots, shops, events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>
          {currentLocation 
            ? 'Epic spots and events near you' 
            : 'Enable location to see nearby spots'
          }
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle" size={24} color="#22c55e" />
          <Text style={styles.actionText}>Add Spot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="camera" size={24} color="#22c55e" />
          <Text style={styles.actionText}>Share Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="people" size={24} color="#22c55e" />
          <Text style={styles.actionText}>Find Skaters</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Spots */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🛹 Nearby Spots</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearbySpots?.data.data.spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </ScrollView>
      </View>

      {/* Local Shops */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏪 Local Shops</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearbyShops?.data.data.shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </ScrollView>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎉 Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {upcomingEvents?.data.data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginLeft: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  difficultyBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  eventTime: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '600',
    marginBottom: 4,
  },
})

export default DiscoverScreen