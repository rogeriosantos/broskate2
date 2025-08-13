import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSearch, useSearchSuggestions } from '../hooks/useSearch'
import { Spot, Shop, ShopEvent } from '../types'

const { width } = Dimensions.get('window')

type SearchCategory = 'all' | 'spots' | 'shops' | 'events'
type SortOption = 'relevance' | 'distance' | 'rating' | 'newest'

interface FilterState {
  category: SearchCategory
  sortBy: SortOption
  radius: number
  spotTypes: string[]
  difficultyLevels: string[]
  eventTypes: string[]
  priceRange: { min: number; max: number }
  dateRange: { start: string | null; end: string | null }
}

const SPOT_TYPES = [
  { key: 'street', label: 'Street', icon: '🏙️' },
  { key: 'park', label: 'Skate Park', icon: '🏞️' },
  { key: 'bowl', label: 'Bowl', icon: '🥣' },
  { key: 'vert', label: 'Vert Ramp', icon: '📐' },
  { key: 'mini_ramp', label: 'Mini Ramp', icon: '🛣️' },
  { key: 'ledge', label: 'Ledge', icon: '📏' },
  { key: 'rail', label: 'Rail', icon: '🚃' },
  { key: 'stairs', label: 'Stairs', icon: '📶' },
]

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
const EVENT_TYPES = ['competition', 'jam_session', 'lesson', 'demo', 'meetup', 'sale']

const SearchScreen = () => {
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    searchResults,
    isLoading: searchLoading,
    clearFilters,
    recentSearches
  } = useSearch()

  const { data: suggestions = [] } = useSearchSuggestions(searchQuery)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowSuggestions(false)
  }

  const toggleArrayFilter = (key: 'spotTypes' | 'difficultyLevels' | 'eventTypes', value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value) 
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  const ResultCard = ({ item, type }: { item: Spot | Shop | ShopEvent; type: 'spot' | 'shop' | 'event' }) => {
    const getCardTitle = () => {
      return item.name || 'Unnamed'
    }

    const getCardSubtitle = () => {
      switch (type) {
        case 'spot':
          const spot = item as Spot
          return `${spot.spot_type?.replace('_', ' ')} • ${spot.difficulty_level}`
        case 'shop':
          const shop = item as Shop
          return shop.is_open !== undefined ? (shop.is_open ? 'Open' : 'Closed') : 'Shop'
        case 'event':
          const event = item as ShopEvent
          return `${event.event_type} • ${new Date(event.start_time).toLocaleDateString()}`
        default:
          return ''
      }
    }

    const getCardIcon = () => {
      switch (type) {
        case 'spot': return '🛹'
        case 'shop': return '🏪'
        case 'event': return '🎉'
        default: return '📍'
      }
    }

    return (
      <TouchableOpacity style={styles.resultCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{getCardIcon()}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{getCardTitle()}</Text>
            <Text style={styles.cardSubtitle}>{getCardSubtitle()}</Text>
            {item.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          {item.distance && (
            <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </View>
      </TouchableOpacity>
    )
  }

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModal}>
        {/* Header */}
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.filterCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.filterResetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Category */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterOptions}>
              {(['all', 'spots', 'shops', 'events'] as SearchCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    filters.category === category && styles.filterOptionActive
                  ]}
                  onPress={() => updateFilter('category', category)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.category === category && styles.filterOptionTextActive
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              {(['relevance', 'distance', 'rating', 'newest'] as SortOption[]).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterOption,
                    filters.sortBy === sort && styles.filterOptionActive
                  ]}
                  onPress={() => updateFilter('sortBy', sort)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.sortBy === sort && styles.filterOptionTextActive
                  ]}>
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Radius */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Search Radius: {filters.radius}km</Text>
            <View style={styles.radiusOptions}>
              {[5, 10, 25, 50, 100].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    filters.radius === radius && styles.radiusOptionActive
                  ]}
                  onPress={() => updateFilter('radius', radius)}
                >
                  <Text style={[
                    styles.radiusOptionText,
                    filters.radius === radius && styles.radiusOptionTextActive
                  ]}>
                    {radius}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spot Types */}
          {(filters.category === 'all' || filters.category === 'spots') && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Spot Types</Text>
              <View style={styles.filterGrid}>
                {SPOT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.filterGridItem,
                      filters.spotTypes.includes(type.key) && styles.filterGridItemActive
                    ]}
                    onPress={() => toggleArrayFilter('spotTypes', type.key)}
                  >
                    <Text style={styles.filterGridIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.filterGridText,
                      filters.spotTypes.includes(type.key) && styles.filterGridTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Difficulty */}
          {(filters.category === 'all' || filters.category === 'spots') && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Difficulty Level</Text>
              <View style={styles.filterOptions}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterOption,
                      filters.difficultyLevels.includes(level) && styles.filterOptionActive
                    ]}
                    onPress={() => toggleArrayFilter('difficultyLevels', level)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.difficultyLevels.includes(level) && styles.filterOptionTextActive
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Event Types */}
          {(filters.category === 'all' || filters.category === 'events') && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Event Types</Text>
              <View style={styles.filterOptions}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.eventTypes.includes(type) && styles.filterOptionActive
                    ]}
                    onPress={() => toggleArrayFilter('eventTypes', type)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.eventTypes.includes(type) && styles.filterOptionTextActive
                    ]}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const renderSearchResults = () => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>Search for spots, shops & events</Text>
          <Text style={styles.emptyStateText}>
            Find the best skating locations, shops, and events near you
          </Text>
          
          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => handleSearch(search)}
                >
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )
    }

    if (searchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )
    }

    if (!searchResults || searchResults.total === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No results found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search terms or filters
          </Text>
        </View>
      )
    }

    const allResults = [
      ...searchResults.spots.map(spot => ({ item: spot, type: 'spot' as const })),
      ...searchResults.shops.map(shop => ({ item: shop, type: 'shop' as const })),
      ...searchResults.events.map(event => ({ item: event, type: 'event' as const }))
    ]

    return (
      <FlatList
        data={allResults}
        keyExtractor={(item, index) => `${item.type}-${item.item.id}-${index}`}
        renderItem={({ item }) => (
          <ResultCard item={item.item} type={item.type} />
        )}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    )
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots, shops, events..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text)
              setShowSuggestions(text.length > 1)
            }}
            onFocus={() => setShowSuggestions(searchQuery.length > 1)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => setShowSuggestions(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => handleSearch(suggestion.title)}
            >
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
              </View>
              <Ionicons name="arrow-up-outline" size={16} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Filters */}
      {(filters.category !== 'all' || filters.spotTypes.length > 0 || filters.difficultyLevels.length > 0) && (
        <ScrollView 
          horizontal 
          style={styles.activeFilters}
          showsHorizontalScrollIndicator={false}
        >
          {filters.category !== 'all' && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
              </Text>
            </View>
          )}
          {filters.spotTypes.map(type => (
            <View key={type} style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {SPOT_TYPES.find(t => t.key === type)?.label || type}
              </Text>
            </View>
          ))}
          {filters.difficultyLevels.map(level => (
            <View key={level} style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {searchResults && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {searchResults.total} results found
            </Text>
            <Text style={styles.resultsBreakdown}>
              {searchResults.spots.length > 0 && `${searchResults.spots.length} spots`}
              {searchResults.shops.length > 0 && `${searchResults.spots.length > 0 ? ', ' : ''}${searchResults.shops.length} shops`}
              {searchResults.events.length > 0 && `${(searchResults.spots.length > 0 || searchResults.shops.length > 0) ? ', ' : ''}${searchResults.events.length} events`}
            </Text>
          </View>
        )}
        
        {renderSearchResults()}
      </View>

      <FilterModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
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
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  activeFilters: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activeFilter: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginVertical: 8,
  },
  activeFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resultsBreakdown: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  cardFooter: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentSearches: {
    marginTop: 32,
    width: '100%',
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  filterModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  filterResetText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  radiusOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  radiusOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  radiusOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGridItem: {
    width: (width - 48) / 2 - 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterGridItemActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  filterGridIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  filterGridText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterGridTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  filterFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  applyFiltersButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
})

export default SearchScreen