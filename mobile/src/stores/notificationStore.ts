import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import websocketService from '../services/websocketService'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  timestamp: string
  read: boolean
  sender_id?: number
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  isConnecting: boolean
  
  // Actions
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  setConnectionStatus: (connected: boolean) => void
  setConnecting: (connecting: boolean) => void
  connect: (userId: number, token: string) => Promise<void>
  disconnect: () => void
  loadStoredNotifications: () => Promise<void>
  saveNotifications: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isConnecting: false,

  addNotification: (notification) => {
    const state = get()
    const existingIndex = state.notifications.findIndex(n => n.id === notification.id)
    
    if (existingIndex >= 0) {
      // Update existing notification
      const updated = [...state.notifications]
      updated[existingIndex] = notification
      set({ notifications: updated })
    } else {
      // Add new notification at the beginning
      const updated = [notification, ...state.notifications].slice(0, 100) // Keep only last 100
      set({ 
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length
      })
    }
    
    // Save to storage
    get().saveNotifications()
  },

  markAsRead: (notificationId) => {
    const state = get()
    const updated = state.notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    
    set({ 
      notifications: updated,
      unreadCount: updated.filter(n => !n.read).length
    })
    
    // Mark as read on server
    websocketService.markNotificationAsRead(notificationId)
    
    // Save to storage
    get().saveNotifications()
  },

  markAllAsRead: () => {
    const state = get()
    const updated = state.notifications.map(n => ({ ...n, read: true }))
    
    set({ 
      notifications: updated,
      unreadCount: 0
    })
    
    // Mark all as read on server
    state.notifications.forEach(n => {
      if (!n.read) {
        websocketService.markNotificationAsRead(n.id)
      }
    })
    
    // Save to storage
    get().saveNotifications()
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 })
    AsyncStorage.removeItem('notifications')
  },

  setConnectionStatus: (connected) => {
    set({ isConnected: connected, isConnecting: false })
  },

  setConnecting: (connecting) => {
    set({ isConnecting: connecting })
  },

  connect: async (userId, token) => {
    const state = get()
    
    if (state.isConnected || state.isConnecting) {
      console.log('🔌 Already connected or connecting to WebSocket')
      return
    }
    
    set({ isConnecting: true })
    
    try {
      // Set up notification handler
      const unsubscribeNotification = websocketService.onNotification((notification) => {
        console.log('🔔 Received notification via WebSocket:', notification.title)
        state.addNotification({
          id: notification.id || `notif_${Date.now()}`,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: notification.timestamp || new Date().toISOString(),
          read: false,
          sender_id: notification.sender_id
        })
      })
      
      // Set up connection handler
      const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
        console.log('🔌 WebSocket connection status:', connected)
        state.setConnectionStatus(connected)
        
        if (connected) {
          // Request unread count when connected
          setTimeout(() => {
            websocketService.requestUnreadCount()
          }, 1000)
        }
      })
      
      // Connect to WebSocket
      await websocketService.connect(userId, token)
      
      // Store cleanup functions (in real app, you'd want to store these properly)
      console.log('✅ WebSocket connection initiated')
      
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error)
      set({ isConnecting: false })
    }
  },

  disconnect: () => {
    websocketService.disconnect()
    set({ isConnected: false, isConnecting: false })
  },

  loadStoredNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications')
      if (stored) {
        const notifications: Notification[] = JSON.parse(stored)
        const unreadCount = notifications.filter(n => !n.read).length
        set({ notifications, unreadCount })
        console.log(`📱 Loaded ${notifications.length} stored notifications`)
      }
    } catch (error) {
      console.error('❌ Failed to load stored notifications:', error)
    }
  },

  saveNotifications: async () => {
    try {
      const state = get()
      await AsyncStorage.setItem('notifications', JSON.stringify(state.notifications))
    } catch (error) {
      console.error('❌ Failed to save notifications:', error)
    }
  },
}))

// Auto-load stored notifications on app start
useNotificationStore.getState().loadStoredNotifications()