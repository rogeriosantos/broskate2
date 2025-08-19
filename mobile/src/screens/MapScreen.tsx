import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native'
import MapView, { Marker, Callout, Region } from 'react-native-maps'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { spotsApi, shopsApi } from '../services/api'
import { useLocationStore } from '../stores/locationStore'
import { Spot, Shop } from '../types'

type MapType = 'standard' | 'satellite' | 'hybrid'
type FilterType = 'all' | 'spots' | 'shops'

const MapScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [mapType, setMapType] = useState<MapType>('standard')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showControls, setShowControls] = useState(false)
  const [region, setRegion] = useState<Region | null>(null)
  const { currentLocation, getCurrentLocation, requestLocationPermission } = useLocationStore()

  useEffect(() => {
    initializeLocation()
  }, [])

  const initializeLocation = async () => {
    try {
      await requestLocationPermission()
      await getCurrentLocation()
    } catch (error) {
      Alert.alert(
        'Location Access',
        'Please enable location services to see spots and shops on the map.',
        [
          { text: 'Settings', onPress: () => {} },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
    }
  }

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }, [currentLocation])

  // Fetch spots for map
  const { data: spotsData } = useQuery({
    queryKey: ['mapSpots', region],
    queryFn: () => spotsApi.getSpots({
      latitude: region?.latitude,
      longitude: region?.longitude,
      radius_km: 25,
      limit: 100
    }),
    enabled: !!region && (filterType === 'all' || filterType === 'spots'),
  })

  // Fetch shops for map
  const { data: shopsData } = useQuery({
    queryKey: ['mapShops', region],
    queryFn: () => shopsApi.getShops({
      latitude: region?.latitude,
      longitude: region?.longitude,
      radius_km: 25,
      limit: 100
    }),
    enabled: !!region && (filterType === 'all' || filterType === 'shops'),
  })

  const spots = spotsData?.data?.data?.spots || []
  const shops = shopsData?.data?.data?.shops || []

  const filteredSpots = spots.filter(spot =>
    !searchQuery || spot.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredShops = shops.filter(shop =>
    !searchQuery || shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSpotMarkerColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e'
      case 'intermediate': return '#f59e0b'
      case 'advanced': return '#ef4444'
      case 'expert': return '#8b5cf6'
      default: return '#64748b'
    }
  }

  const SpotMarker = ({ spot }: { spot: Spot }) => (
    <Marker
      coordinate={{
        latitude: spot.latitude,
        longitude: spot.longitude,
      }}
      pinColor={getSpotMarkerColor(spot.difficulty_level)}
      title={spot.name}
      description={spot.spot_type.replace('_', ' ')}
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{spot.name}</Text>
          <Text style={styles.calloutSubtitle}>
            {spot.spot_type.replace('_', ' ')} • {spot.difficulty_level}
          </Text>
          {spot.description && (
            <Text style={styles.calloutDescription} numberOfLines={2}>
              {spot.description}
            </Text>
          )}
          <View style={styles.calloutActions}>
            <TouchableOpacity style={styles.calloutButton}>
              <Text style={styles.calloutButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Callout>
    </Marker>
  )

  const ShopMarker = ({ shop }: { shop: Shop }) => (
    <Marker
      coordinate={{
        latitude: shop.latitude,
        longitude: shop.longitude,
      }}
      pinColor="#f97316"
      title={shop.name}
      description="Skate Shop"
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{shop.name}</Text>
          <Text style={styles.calloutSubtitle}>Skate Shop</Text>
          {shop.description && (
            <Text style={styles.calloutDescription} numberOfLines={2}>
              {shop.description}
            </Text>
          )}
          {shop.is_open !== undefined && (
            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                { backgroundColor: shop.is_open ? '#22c55e' : '#ef4444' }
              ]} />
              <Text style={styles.statusText}>
                {shop.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
          <View style={styles.calloutActions}>
            <TouchableOpacity style={styles.calloutButton}>
              <Text style={styles.calloutButtonText}>View Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Callout>
    </Marker>
  )

  const ControlsModal = () => (
    <Modal
      visible={showControls}
      transparent
      animationType="slide"
      onRequestClose={() => setShowControls(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.controlsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Map Controls</Text>
            <TouchableOpacity onPress={() => setShowControls(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>Map Type</Text>
            <View style={styles.controlOptions}>
              {(['standard', 'satellite', 'hybrid'] as MapType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.controlOption,
                    mapType === type && styles.controlOptionActive
                  ]}
                  onPress={() => setMapType(type)}
                >
                  <Text style={[
                    styles.controlOptionText,
                    mapType === type && styles.controlOptionTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>Show</Text>
            <View style={styles.controlOptions}>
              {([
                { key: 'all', label: 'All', icon: '🌎' },
                { key: 'spots', label: 'Spots Only', icon: '🛹' },
                { key: 'shops', label: 'Shops Only', icon: '🏪' }
              ] as const).map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.controlOption,
                    filterType === filter.key && styles.controlOptionActive
                  ]}
                  onPress={() => setFilterType(filter.key)}
                >
                  <Text style={styles.controlOptionIcon}>{filter.icon}</Text>
                  <Text style={[
                    styles.controlOptionText,
                    filterType === filter.key && styles.controlOptionTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots and shops..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.controlsButton}
          onPress={() => setShowControls(true)}
        >
          <Ionicons name="options" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {/* Spot Markers */}
        {(filterType === 'all' || filterType === 'spots') &&
          filteredSpots.map((spot) => (
            <SpotMarker key={`spot-${spot.id}`} spot={spot} />
          ))
        }

        {/* Shop Markers */}
        {(filterType === 'all' || filterType === 'shops') &&
          filteredShops.map((shop) => (
            <ShopMarker key={`shop-${shop.id}`} shop={shop} />
          ))
        }
      </MapView>

      {/* Map Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredSpots.length}</Text>
            <Text style={styles.statLabel}>Spots</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredShops.length}</Text>
            <Text style={styles.statLabel}>Shops</Text>
          </View>
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          if (currentLocation) {
            setRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            })
          }
        }}
      >
        <Ionicons name="locate" size={24} color="#22c55e" />
      </TouchableOpacity>

      <ControlsModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  controlsButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  calloutDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  calloutActions: {
    alignItems: 'center',
  },
  calloutButton: {
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  calloutButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  controlsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  controlSection: {
    marginBottom: 24,
  },
  controlSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  controlOptions: {
    gap: 8,
  },
  controlOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  controlOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  controlOptionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  controlOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  controlOptionTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
})

export default MapScreen
