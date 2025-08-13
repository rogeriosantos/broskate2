import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './api'

export interface PushNotificationData {
  type: 'spot_nearby' | 'event_invite' | 'friend_request' | 'message' | 'achievement' | 'system'
  entityId?: number
  title: string
  body: string
  data?: any
}

export interface NotificationPermissions {
  granted: boolean
  canAskAgain: boolean
  providesAppNotificationSettings: boolean
  status: string
}

export interface LocalNotification {
  id: string
  title: string
  body: string
  trigger: 'immediate' | 'scheduled' | 'location'
  scheduledTime?: Date
  data?: any
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: data?.priority || Notifications.AndroidNotificationPriority.DEFAULT,
    }
  },
})

class NotificationService {
  private expoPushToken: string | null = null
  private notificationListener: any = null
  private responseListener: any = null

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      await this.registerForPushNotifications()
      this.setupNotificationListeners()
      console.log('📱 Notification service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error)
    }
  }

  // PERMISSION MANAGEMENT
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain, granted } = await Notifications.requestPermissionsAsync()
      
      const settings = await Notifications.getPermissionsAsync()
      
      return {
        granted: status === 'granted',
        canAskAgain,
        providesAppNotificationSettings: settings.providesAppNotificationSettings,
        status
      }
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error)
      return {
        granted: false,
        canAskAgain: false,
        providesAppNotificationSettings: false,
        status: 'error'
      }
    }
  }

  async checkPermissions(): Promise<NotificationPermissions> {
    try {
      const settings = await Notifications.getPermissionsAsync()
      
      return {
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
        providesAppNotificationSettings: settings.providesAppNotificationSettings,
        status: settings.status
      }
    } catch (error) {
      console.error('❌ Failed to check notification permissions:', error)
      return {
        granted: false,
        canAskAgain: false,
        providesAppNotificationSettings: false,
        status: 'error'
      }
    }
  }

  // PUSH TOKEN MANAGEMENT
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices')
        return null
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Push notification permissions denied')
        return null
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId
      if (!projectId) {
        console.warn('⚠️ Project ID not found for push notifications')
        return null
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId })
      this.expoPushToken = token.data

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        })

        // Create specific channels for different notification types
        await Notifications.setNotificationChannelAsync('events', {
          name: 'Events',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        })

        await Notifications.setNotificationChannelAsync('social', {
          name: 'Social',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 150],
        })

        await Notifications.setNotificationChannelAsync('location', {
          name: 'Location',
          importance: Notifications.AndroidImportance.LOW,
        })
      }

      console.log('📱 Push token registered:', token.data)
      
      // Save token to storage and send to backend
      await this.saveTokenToStorage(token.data)
      await this.sendTokenToBackend(token.data)

      return token.data
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error)
      return null
    }
  }

  private async saveTokenToStorage(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@push_token', token)
    } catch (error) {
      console.error('❌ Failed to save push token:', error)
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/api/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId || 'unknown'
      })
      console.log('📤 Push token sent to backend')
    } catch (error) {
      console.error('❌ Failed to send token to backend:', error)
    }
  }

  // NOTIFICATION LISTENERS
  private setupNotificationListeners(): void {
    // Listen for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification)
      this.handleNotificationReceived(notification)
    })

    // Listen for user tapping on notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response)
      this.handleNotificationResponse(response)
    })
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content
    
    // Handle different notification types
    switch (data?.type) {
      case 'spot_nearby':
        // Handle nearby spot notification
        break
      case 'event_invite':
        // Handle event invitation
        break
      case 'friend_request':
        // Handle friend request
        break
      default:
        console.log('📱 General notification received')
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'spot_nearby':
        // Navigate to spots screen
        break
      case 'event_invite':
        // Navigate to event details
        if (data.entityId) {
          // Navigation logic here
        }
        break
      case 'friend_request':
        // Navigate to friend requests
        break
      default:
        console.log('👆 General notification tapped')
    }
  }

  // LOCAL NOTIFICATIONS
  async scheduleLocalNotification(notification: LocalNotification): Promise<string> {
    try {
      const trigger = this.createNotificationTrigger(notification)
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger,
      })

      console.log('⏰ Local notification scheduled:', identifier)
      return identifier
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error)
      throw new Error('Failed to schedule notification')
    }
  }

  private createNotificationTrigger(notification: LocalNotification): Notifications.NotificationTriggerInput | null {
    switch (notification.trigger) {
      case 'immediate':
        return null // Immediate notification
        
      case 'scheduled':
        if (!notification.scheduledTime) {
          throw new Error('Scheduled time required for scheduled notifications')
        }
        return { date: notification.scheduledTime }
        
      case 'location':
        // Location-based triggers would require additional setup
        return { seconds: 1 } // Fallback to immediate
        
      default:
        return null
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier)
      console.log('🗑️ Notification cancelled:', identifier)
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error)
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      console.log('🗑️ All notifications cancelled')
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error)
    }
  }

  // NOTIFICATION MANAGEMENT
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync()
      return notifications
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error)
      return []
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync()
    } catch (error) {
      console.error('❌ Failed to get badge count:', error)
      return 0
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count)
    } catch (error) {
      console.error('❌ Failed to set badge count:', error)
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0)
  }

  // PREDEFINED NOTIFICATIONS
  async sendLocationBasedNotification(spotName: string, distance: string): Promise<void> {
    await this.scheduleLocalNotification({
      id: `location_${Date.now()}`,
      title: '🛹 Skate Spot Nearby!',
      body: `${spotName} is just ${distance} away. Time to shred!`,
      trigger: 'immediate',
      data: {
        type: 'spot_nearby',
        spotName,
        distance
      }
    })
  }

  async sendEventReminder(eventTitle: string, startTime: Date): Promise<void> {
    // Send 1 hour before event
    const reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000)
    
    await this.scheduleLocalNotification({
      id: `event_${Date.now()}`,
      title: '🏁 Event Starting Soon!',
      body: `${eventTitle} starts in 1 hour. Don't forget your gear!`,
      trigger: 'scheduled',
      scheduledTime: reminderTime,
      data: {
        type: 'event_reminder',
        eventTitle
      }
    })
  }

  async sendAchievementNotification(achievement: string): Promise<void> {
    await this.scheduleLocalNotification({
      id: `achievement_${Date.now()}`,
      title: '🏆 Achievement Unlocked!',
      body: achievement,
      trigger: 'immediate',
      data: {
        type: 'achievement'
      }
    })
  }

  async sendMaintenanceNotification(message: string): Promise<void> {
    await this.scheduleLocalNotification({
      id: `maintenance_${Date.now()}`,
      title: '🔧 App Update',
      body: message,
      trigger: 'immediate',
      data: {
        type: 'system'
      }
    })
  }

  // CLEANUP
  cleanup(): void {
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener)
      }
      
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener)
      }
      
      console.log('🧹 Notification listeners cleaned up')
    } catch (error) {
      console.error('❌ Failed to cleanup notification listeners:', error)
    }
  }

  // GETTERS
  getExpoPushToken(): string | null {
    return this.expoPushToken
  }

  // NOTIFICATION SETTINGS HELPERS
  async openNotificationSettings(): Promise<void> {
    try {
      await Notifications.openSettingsAsync()
    } catch (error) {
      console.error('❌ Failed to open notification settings:', error)
    }
  }

  // TESTING HELPERS (Development only)
  async sendTestNotification(): Promise<void> {
    if (__DEV__) {
      await this.scheduleLocalNotification({
        id: 'test',
        title: '🧪 Test Notification',
        body: 'This is a test notification from BroSkate!',
        trigger: 'immediate',
        data: { type: 'test' }
      })
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService