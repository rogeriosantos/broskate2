import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { eventsApi, shopsApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useLocationStore } from '../stores/locationStore'
import { ShopEvent, Shop } from '../types'

type EventFormData = {
  name: string
  description: string
  event_type: 'competition' | 'jam_session' | 'lesson' | 'demo' | 'meetup' | 'sale'
  start_time: Date
  end_time: Date | null
  location: string
  price: number
  max_participants: number | null
  is_free: boolean
  requires_registration: boolean
  contact_info: string
  shop_id: number | null
}

const EVENT_TYPES = [
  { key: 'competition', label: 'Competition', icon: '🏆', color: '#f59e0b' },
  { key: 'jam_session', label: 'Jam Session', icon: '🎵', color: '#8b5cf6' },
  { key: 'lesson', label: 'Lesson', icon: '📚', color: '#22c55e' },
  { key: 'demo', label: 'Demo', icon: '🎬', color: '#ef4444' },
  { key: 'meetup', label: 'Meetup', icon: '👥', color: '#3b82f6' },
  { key: 'sale', label: 'Sale', icon: '🏷️', color: '#f97316' },
] as const

const EventManagementScreen = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { currentLocation } = useLocationStore()
  const queryClient = useQueryClient()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ShopEvent | null>(null)
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'my_events' | 'attending' | 'nearby'>('my_events')

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    event_type: 'meetup',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    end_time: null,
    location: '',
    price: 0,
    max_participants: null,
    is_free: true,
    requires_registration: false,
    contact_info: '',
    shop_id: null
  })

  // Fetch user's events (if they're a shop owner)
  const { data: myEvents, isLoading: myEventsLoading } = useQuery({
    queryKey: ['myEvents', user?.id],
    queryFn: () => eventsApi.getEvents({ organizer_id: user?.id, limit: 50 }),
    enabled: isAuthenticated && !!user?.id,
  })

  // Fetch events user is attending
  const { data: attendingEvents, isLoading: attendingLoading } = useQuery({
    queryKey: ['attendingEvents', user?.id],
    queryFn: () => eventsApi.getEvents({ attending_user_id: user?.id, limit: 50 }),
    enabled: isAuthenticated && !!user?.id,
  })

  // Fetch nearby events
  const { data: nearbyEvents, isLoading: nearbyLoading } = useQuery({
    queryKey: ['nearbyEvents', currentLocation],
    queryFn: () => eventsApi.getEvents({
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius_km: 25,
      limit: 50,
      start_date: new Date().toISOString()
    }),
    enabled: !!currentLocation,
  })

  // Fetch user's shops (for event creation)
  const { data: userShops } = useQuery({
    queryKey: ['userShops', user?.id],
    queryFn: () => shopsApi.getShops({ owner_id: user?.id }),
    enabled: isAuthenticated && !!user?.id,
  })

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: Partial<ShopEvent>) => {
      if (formData.shop_id) {
        return shopsApi.createShopEvent(formData.shop_id, eventData)
      } else {
        return eventsApi.createEvent(eventData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] })
      setShowCreateModal(false)
      resetForm()
      Alert.alert('Success', 'Event created successfully!')
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create event')
    }
  })

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: number; eventData: Partial<ShopEvent> }) =>
      eventsApi.updateEvent(eventId, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] })
      setEditingEvent(null)
      setShowCreateModal(false)
      resetForm()
      Alert.alert('Success', 'Event updated successfully!')
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update event')
    }
  })

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] })
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] })
      Alert.alert('Success', 'Event deleted successfully!')
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to delete event')
    }
  })

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: number; status: 'going' | 'maybe' | 'not_going' }) =>
      eventsApi.rsvpToEvent(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendingEvents'] })
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] })
      Alert.alert('Success', 'RSVP updated!')
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to RSVP')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      event_type: 'meetup',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end_time: null,
      location: '',
      price: 0,
      max_participants: null,
      is_free: true,
      requires_registration: false,
      contact_info: '',
      shop_id: null
    })
  }

  const openEditModal = (event: ShopEvent) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description || '',
      event_type: event.event_type,
      start_time: new Date(event.start_time),
      end_time: event.end_time ? new Date(event.end_time) : null,
      location: event.location || '',
      price: event.price || 0,
      max_participants: event.max_participants,
      is_free: (event.price || 0) === 0,
      requires_registration: event.requires_registration || false,
      contact_info: event.contact_info || '',
      shop_id: event.shop_id
    })
    setShowCreateModal(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    const eventData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      event_type: formData.event_type,
      start_time: formData.start_time.toISOString(),
      end_time: formData.end_time?.toISOString() || null,
      location: formData.location.trim(),
      price: formData.is_free ? 0 : formData.price,
      max_participants: formData.max_participants,
      requires_registration: formData.requires_registration,
      contact_info: formData.contact_info.trim()
    }

    if (editingEvent) {
      updateEventMutation.mutate({ eventId: editingEvent.id, eventData })
    } else {
      createEventMutation.mutate(eventData)
    }
  }

  const handleDelete = (eventId: number) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEventMutation.mutate(eventId) }
      ]
    )
  }

  const handleRSVP = (eventId: number, status: 'going' | 'maybe' | 'not_going') => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to RSVP to events')
      return
    }
    rsvpMutation.mutate({ eventId, status })
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myEvents'] }),
      queryClient.invalidateQueries({ queryKey: ['attendingEvents'] }),
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] })
    ])
    setRefreshing(false)
  }

  const EventCard = ({ event, showActions = false }: { event: ShopEvent; showActions?: boolean }) => {
    const eventType = EVENT_TYPES.find(type => type.key === event.event_type)
    const isUpcoming = new Date(event.start_time) > new Date()
    const isPast = new Date(event.end_time || event.start_time) < new Date()

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={styles.eventTypeIcon}>{eventType?.icon}</Text>
            <View style={[styles.eventTypeBadge, { backgroundColor: eventType?.color || '#64748b' }]}>
              <Text style={styles.eventTypeText}>{eventType?.label}</Text>
            </View>
          </View>
          
          {isPast && (
            <View style={styles.pastEventBadge}>
              <Text style={styles.pastEventText}>Past</Text>
            </View>
          )}
        </View>

        <Text style={styles.eventName}>{event.name}</Text>
        
        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.eventDetailText}>
              {new Date(event.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {event.location && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.eventDetailText}>{event.location}</Text>
            </View>
          )}

          <View style={styles.eventDetailRow}>
            <Ionicons name="card-outline" size={16} color="#64748b" />
            <Text style={styles.eventDetailText}>
              {event.price === 0 ? 'Free' : `$${event.price}`}
            </Text>
          </View>

          {event.max_participants && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.eventDetailText}>
                Max {event.max_participants} participants
              </Text>
            </View>
          )}
        </View>

        <View style={styles.eventActions}>
          {showActions ? (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(event)}
              >
                <Ionicons name="pencil" size={16} color="#22c55e" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(event.id)}
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            isUpcoming && (
              <View style={styles.rsvpActions}>
                <TouchableOpacity
                  style={styles.rsvpButton}
                  onPress={() => handleRSVP(event.id, 'going')}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.rsvpButtonText}>Going</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.rsvpButton, styles.maybeButton]}
                  onPress={() => handleRSVP(event.id, 'maybe')}
                >
                  <Ionicons name="help-circle" size={16} color="#f59e0b" />
                  <Text style={styles.maybeButtonText}>Maybe</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </View>
    )
  }

  const CreateEventModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowCreateModal(false)
        setEditingEvent(null)
        resetForm()
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false)
              setEditingEvent(null)
              resetForm()
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            {editingEvent ? 'Edit Event' : 'Create Event'}
          </Text>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createEventMutation.isPending || updateEventMutation.isPending}
          >
            {(createEventMutation.isPending || updateEventMutation.isPending) ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <Text style={styles.modalSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Event Name */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Event Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter event name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          {/* Event Type */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.eventTypeSelector}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.eventTypeOption,
                      formData.event_type === type.key && styles.eventTypeOptionActive,
                      { borderColor: type.color }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, event_type: type.key }))}
                  >
                    <Text style={styles.eventTypeOptionIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.eventTypeOptionText,
                      formData.event_type === type.key && { color: type.color }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Describe your event..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Location */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Location *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter event location"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Start Date & Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker('start')}
            >
              <Ionicons name="calendar" size={20} color="#22c55e" />
              <Text style={styles.dateTimeText}>
                {formData.start_time.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>End Date & Time (Optional)</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker('end')}
            >
              <Ionicons name="calendar" size={20} color="#22c55e" />
              <Text style={styles.dateTimeText}>
                {formData.end_time 
                  ? formData.end_time.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Set end time'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pricing */}
          <View style={styles.formSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.formLabel}>Free Event</Text>
              <Switch
                value={formData.is_free}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  is_free: value,
                  price: value ? 0 : prev.price
                }))}
                thumbColor="#22c55e"
                trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              />
            </View>
            
            {!formData.is_free && (
              <TextInput
                style={styles.formInput}
                placeholder="Price ($)"
                value={formData.price.toString()}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  price: parseFloat(text) || 0 
                }))}
                keyboardType="numeric"
              />
            )}
          </View>

          {/* Max Participants */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Max Participants (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Leave blank for unlimited"
              value={formData.max_participants?.toString() || ''}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                max_participants: text ? parseInt(text) || null : null
              }))}
              keyboardType="numeric"
            />
          </View>

          {/* Registration Required */}
          <View style={styles.formSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.formLabel}>Requires Registration</Text>
              <Switch
                value={formData.requires_registration}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  requires_registration: value
                }))}
                thumbColor="#22c55e"
                trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              />
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Contact Information</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Email or phone number"
              value={formData.contact_info}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contact_info: text }))}
            />
          </View>

          {/* Shop Selection (if user owns shops) */}
          {userShops && userShops.data.data.shops.length > 0 && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Associate with Shop (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.shopSelector}>
                  <TouchableOpacity
                    style={[
                      styles.shopOption,
                      !formData.shop_id && styles.shopOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, shop_id: null }))}
                  >
                    <Text style={styles.shopOptionText}>Personal Event</Text>
                  </TouchableOpacity>
                  
                  {userShops.data.data.shops.map((shop: Shop) => (
                    <TouchableOpacity
                      key={shop.id}
                      style={[
                        styles.shopOption,
                        formData.shop_id === shop.id && styles.shopOptionActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, shop_id: shop.id }))}
                    >
                      <Text style={styles.shopOptionText}>{shop.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Date Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={showDatePicker === 'start' ? formData.start_time : (formData.end_time || new Date())}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(null)
              if (selectedDate) {
                if (showDatePicker === 'start') {
                  setFormData(prev => ({ ...prev, start_time: selectedDate }))
                } else {
                  setFormData(prev => ({ ...prev, end_time: selectedDate }))
                }
              }
            }}
          />
        )}
      </View>
    </Modal>
  )

  const renderTabContent = () => {
    const getEventsForTab = () => {
      switch (activeTab) {
        case 'my_events':
          return myEvents?.data.data.events || []
        case 'attending':
          return attendingEvents?.data.data.events || []
        case 'nearby':
          return nearbyEvents?.data.data.events || []
        default:
          return []
      }
    }

    const getLoadingState = () => {
      switch (activeTab) {
        case 'my_events':
          return myEventsLoading
        case 'attending':
          return attendingLoading
        case 'nearby':
          return nearbyLoading
        default:
          return false
      }
    }

    const events = getEventsForTab()
    const loading = getLoadingState()

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No events found</Text>
          <Text style={styles.emptyStateText}>
            {activeTab === 'my_events'
              ? 'Create your first event to get started'
              : activeTab === 'attending'
              ? 'RSVP to events to see them here'
              : 'No upcoming events in your area'
            }
          </Text>
        </View>
      )
    }

    return (
      <ScrollView
        style={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {events.map((event: ShopEvent) => (
          <EventCard
            key={event.id}
            event={event}
            showActions={activeTab === 'my_events'}
          />
        ))}
      </ScrollView>
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authRequiredContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#cbd5e1" />
        <Text style={styles.authRequiredTitle}>Authentication Required</Text>
        <Text style={styles.authRequiredText}>
          Please log in to manage events and RSVP to upcoming activities
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_events' && styles.activeTab]}
          onPress={() => setActiveTab('my_events')}
        >
          <Text style={[styles.tabText, activeTab === 'my_events' && styles.activeTabText]}>
            My Events
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attending' && styles.activeTab]}
          onPress={() => setActiveTab('attending')}
        >
          <Text style={[styles.tabText, activeTab === 'attending' && styles.activeTabText]}>
            Attending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
            Nearby
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderTabContent()}

      {/* Create Event Modal */}
      <CreateEventModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  createButton: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#22c55e',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  eventTypeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  pastEventBadge: {
    backgroundColor: '#94a3b8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pastEventText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  eventActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  rsvpActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rsvpButtonText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  maybeButton: {
    backgroundColor: '#fefbf2',
  },
  maybeButtonText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 4,
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
  authRequiredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  authRequiredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  eventTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  eventTypeOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    minWidth: 80,
  },
  eventTypeOptionActive: {
    backgroundColor: 'white',
  },
  eventTypeOptionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  eventTypeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  shopOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  shopOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  shopOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
})

export default EventManagementScreen