import AsyncStorage from '@react-native-async-storage/async-storage'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

type NotificationHandler = (notification: any) => void
type ConnectionHandler = (connected: boolean) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private maxReconnectDelay = 30000 // Max 30 seconds
  private pingInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  
  private notificationHandlers: NotificationHandler[] = []
  private connectionHandlers: ConnectionHandler[] = []
  private unreadCount = 0
  
  private baseUrl: string
  private userId: number | null = null
  private token: string | null = null

  constructor(baseUrl: string) {
    // Convert http to ws protocol
    this.baseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
  }

  async connect(userId: number, token: string): Promise<void> {
    this.userId = userId
    this.token = token
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected')
      return
    }

    const wsUrl = `${this.baseUrl}/api/ws/ws/${userId}?token=${encodeURIComponent(token)}`
    console.log('🔌 Connecting to WebSocket:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('❌ WebSocket connection error:', error)
      this.scheduleReconnect()
    }
  }

  private setupEventListeners() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected successfully')
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
      this.notifyConnectionHandlers(true)
      this.startPingInterval()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`)
      this.notifyConnectionHandlers(false)
      this.stopPingInterval()
      
      if (event.code !== 1000) { // Not a normal closure
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message received:', message.type)

    switch (message.type) {
      case 'connection_established':
        console.log('🎉 Connection established:', message.message)
        break

      case 'notification':
        console.log('🔔 New notification:', message.title)
        this.notifyNotificationHandlers(message)
        break

      case 'unread_count':
      case 'unread_count_updated':
        console.log('📊 Unread count updated:', message.count)
        this.unreadCount = message.count
        break

      case 'recent_notifications':
        console.log('📜 Received recent notifications:', message.notifications?.length)
        if (message.notifications) {
          message.notifications.forEach((notif: any) => {
            this.notifyNotificationHandlers(notif)
          })
        }
        break

      case 'pong':
        // Pong response to ping
        break

      case 'subscription_confirmed':
        console.log('✅ Subscribed to channel:', message.channel)
        break

      case 'broadcast':
        console.log('📢 Broadcast message:', message.data)
        this.notifyNotificationHandlers({
          type: 'broadcast',
          title: 'Broadcast',
          message: message.data?.message || 'Broadcast message',
          data: message.data
        })
        break

      default:
        console.log('🤷 Unknown message type:', message.type)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay)
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.userId && this.token) {
        this.connect(this.userId, this.token)
      }
    }, delay)
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        })
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message')
    }
  }

  subscribeToChannel(channel: string) {
    this.send({
      type: 'subscribe',
      channel
    })
  }

  unsubscribeFromChannel(channel: string) {
    this.send({
      type: 'unsubscribe',
      channel
    })
  }

  markNotificationAsRead(notificationId: string) {
    this.send({
      type: 'mark_notification_read',
      notification_id: notificationId
    })
  }

  requestUnreadCount() {
    this.send({
      type: 'get_unread_count'
    })
  }

  // Notification management
  onNotification(handler: NotificationHandler) {
    this.notificationHandlers.push(handler)
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler)
    }
  }

  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler)
    }
  }

  private notifyNotificationHandlers(notification: any) {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification)
      } catch (error) {
        console.error('❌ Error in notification handler:', error)
      }
    })
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected)
      } catch (error) {
        console.error('❌ Error in connection handler:', error)
      }
    })
  }

  getUnreadCount(): number {
    return this.unreadCount
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.stopPingInterval()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.reconnectAttempts = 0
    this.notifyConnectionHandlers(false)
  }
}

// Create singleton instance
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000' // Use localhost for iOS simulator
  : 'https://your-production-api.com'

export const websocketService = new WebSocketService(API_BASE_URL)
export default websocketService