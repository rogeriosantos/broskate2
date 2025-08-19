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
  Modal,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { spotsApi } from '../services/api'
import { useLocationStore } from '../stores/locationStore'
import { Spot } from '../types'

const SpotsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { currentLocation, getCurrentLocation } = useLocationStore()

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  const { data: spotsData, isLoading, refetch } = useQuery({
    queryKey: ['spots', selectedFilter, searchQuery, currentLocation],
    queryFn: () => spotsApi.getSpots({
      search: searchQuery || undefined,
      spot_type: selectedFilter !== 'all' ? selectedFilter : undefined,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 100,
      limit: 50
    }),
  })

  const spots = spotsData?.data?.data?.spots || []

  const filters = [
    { key: 'all', label: 'All Spots', icon: '🛹' },
    { key: 'street', label: 'Street', icon: '🏙️' },
    { key: 'park', label: 'Skate Park', icon: '🏞️' },
    { key: 'bowl', label: 'Bowl', icon: '🥣' },
    { key: 'vert', label: 'Vert Ramp', icon: '📐' },
    { key: 'mini_ramp', label: 'Mini Ramp', icon: '🛣️' },
    { key: 'ledge', label: 'Ledge', icon: '📏' },
    { key: 'rail', label: 'Rail', icon: '🚃' },
    { key: 'stairs', label: 'Stairs', icon: '📶' },
  ]

  const difficultyColors = {
    beginner: '#22c55e',
    intermediate: '#f59e0b',
    advanced: '#ef4444',
    expert: '#8b5cf6',
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const SpotCard = ({ item: spot }: { item: Spot }) => (
    <TouchableOpacity style={styles.spotCard}>
      <View style={styles.spotHeader}>
        <View style={styles.spotInfo}>
          <Text style={styles.spotName}>{spot.name}</Text>
          <Text style={styles.spotType}>
            {filters.find(f => f.key === spot.spot_type)?.icon} {spot.spot_type.replace('_', ' ')}
          </Text>
        </View>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: difficultyColors[spot.difficulty_level as keyof typeof difficultyColors] }
        ]}>
          <Text style={styles.difficultyText}>{spot.difficulty_level}</Text>
        </View>
      </View>

      {spot.description && (
        <Text style={styles.spotDescription} numberOfLines={2}>
          {spot.description}
        </Text>
      )}

      <View style={styles.spotDetails}>
        {spot.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.addressText} numberOfLines={1}>
              {spot.address}
            </Text>
          </View>
        )}
        
        {spot.distance && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color="#64748b" />
            <Text style={styles.distanceText}>
              {spot.distance.toFixed(1)} km away
            </Text>
          </View>
        )}
      </View>

      {spot.features && spot.features.length > 0 && (
        <View style={styles.featuresContainer}>
          {spot.features.slice(0, 4).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {spot.features.length > 4 && (
            <Text style={styles.moreFeatures}>+{spot.features.length - 4} more</Text>
          )}
        </View>
      )}

      <View style={styles.spotFooter}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>
            {spot.rating ? spot.rating.toFixed(1) : 'No ratings'}
          </Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Spots</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filters}
            numColumns={2}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedFilter === item.key && styles.filterOptionActive
                ]}
                onPress={() => {
                  setSelectedFilter(item.key)
                  setShowFilters(false)
                }}
              >
                <Text style={styles.filterIcon}>{item.icon}</Text>
                <Text style={[
                  styles.filterLabel,
                  selectedFilter === item.key && styles.filterLabelActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Current Filter */}
      {selectedFilter !== 'all' && (
        <View style={styles.currentFilter}>
          <Text style={styles.currentFilterText}>
            {filters.find(f => f.key === selectedFilter)?.icon} {filters.find(f => f.key === selectedFilter)?.label}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFilter('all')}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {spots.length} spots {currentLocation ? 'near you' : 'found'}
        </Text>
      </View>

      {/* Spots List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Finding awesome spots...</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={SpotCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
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
  filterButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
  },
  currentFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22c55e',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
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
  spotCard: {
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
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  spotType: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'capitalize',
  },
  spotDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  spotDetails: {
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
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  spotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  filterOption: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  filterIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterLabelActive: {
    color: 'white',
    fontWeight: 'bold',
  },
})

export default SpotsScreen