import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { shopsApi, eventsApi } from '../services/api'
import { useLocationStore } from '../stores/locationStore'
import { Shop, ShopEvent } from '../types'

const ShopsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'shops' | 'events'>('shops')
  const [refreshing, setRefreshing] = useState(false)
  const { currentLocation, getCurrentLocation } = useLocationStore()

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  const { data: shopsData, isLoading: shopsLoading, refetch: refetchShops } = useQuery({
    queryKey: ['shops', searchQuery, currentLocation],
    queryFn: () => shopsApi.getShops({
      search: searchQuery || undefined,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 100,
      limit: 50
    }),
  })

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['shopEvents', searchQuery, currentLocation],
    queryFn: () => eventsApi.getEvents({
      search: searchQuery || undefined,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 100,
      limit: 50
    }),
  })

  const shops = shopsData?.data.data.shops || []
  const events = eventsData?.data.data.events || []

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchShops(), refetchEvents()])
    setRefreshing(false)
  }

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`)
    }
  }

  const handleWebsite = (website: string) => {
    if (website) {
      const url = website.startsWith('http') ? website : `https://${website}`
      Linking.openURL(url)
    }
  }

  const ShopCard = ({ item: shop }: { item: Shop }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shop.name}</Text>
          {shop.is_open !== undefined && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: shop.is_open ? '#22c55e' : '#ef4444' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: shop.is_open ? '#22c55e' : '#ef4444' }
              ]}>
                {shop.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {shop.description && (
        <Text style={styles.shopDescription} numberOfLines={2}>
          {shop.description}
        </Text>
      )}

      <View style={styles.shopDetails}>
        {shop.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.addressText} numberOfLines={1}>
              {shop.address}
            </Text>
          </View>
        )}
        
        {shop.distance && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color="#64748b" />
            <Text style={styles.distanceText}>
              {shop.distance.toFixed(1)} km away
            </Text>
          </View>
        )}

        {shop.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#64748b" />
            <Text style={styles.phoneText}>{shop.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.actionButtons}>
          {shop.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(shop.phone!)}
            >
              <Ionicons name="call" size={18} color="#22c55e" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {shop.website && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWebsite(shop.website!)}
            >
              <Ionicons name="globe" size={18} color="#22c55e" />
              <Text style={styles.actionButtonText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.cardFooterActions}>
          <TouchableOpacity
            style={styles.eventsButton}
            onPress={() => {
              // Navigate to shop events - for now show alert
              Alert.alert('Shop Events', `View events for ${shop.name}`)
            }}
          >
            <Ionicons name="calendar" size={16} color="#22c55e" />
            <Text style={styles.eventsButtonText}>Events</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  const EventCard = ({ item: event }: { item: ShopEvent }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{event.name}</Text>
        <View style={styles.eventTypeBadge}>
          <Text style={styles.eventTypeText}>{event.event_type}</Text>
        </View>
      </View>

      {event.description && (
        <Text style={styles.eventDescription} numberOfLines={3}>
          {event.description}
        </Text>
      )}

      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.eventTime}>
            {new Date(event.start_time).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {event.end_time && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.eventDuration}>
              Until {new Date(event.end_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        {event.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.eventLocation} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {event.price && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#64748b" />
            <Text style={styles.eventPrice}>
              {event.price === 0 ? 'Free' : `$${event.price}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventFooter}>
        <TouchableOpacity style={styles.interestedButton}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
          <Text style={styles.interestedText}>Interested</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderContent = () => {
    if (activeTab === 'shops') {
      if (shopsLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Finding local shops...</Text>
          </View>
        )
      }
      
      return (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id.toString()}
          renderItem={ShopCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )
    } else {
      if (eventsLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Finding events...</Text>
          </View>
        )
      }
      
      return (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={EventCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )
    }
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shops' && styles.activeTab]}
          onPress={() => setActiveTab('shops')}
        >
          <Text style={[styles.tabText, activeTab === 'shops' && styles.activeTabText]}>
            🏪 Shops ({shops.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            🎉 Events ({events.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#22c55e',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  shopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shopDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  shopDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  eventsButtonText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  eventTypeBadge: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'capitalize',
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventTime: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  eventDuration: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  eventPrice: {
    fontSize: 14,
    color: '#22c55e',
    marginLeft: 8,
    fontWeight: '600',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  interestedText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 6,
  },
  shareButton: {
    padding: 10,
  },
})

export default ShopsScreen