import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuthStore } from '../stores/authStore'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItemProps {
  notification: any
  onPress: () => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'event_invite':
        return 'calendar'
      case 'user_follow':
        return 'person-add'
      case 'shop_update':
        return 'storefront'
      case 'spot_update':
        return 'location'
      case 'success':
        return 'checkmark-circle'
      case 'warning':
        return 'warning'
      case 'error':
        return 'close-circle'
      case 'message':
        return 'chatbubble'
      default:
        return 'notifications'
    }
  }

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return '#22c55e'
      case 'warning':
        return '#f59e0b'
      case 'error':
        return '#ef4444'
      case 'event_invite':
        return '#8b5cf6'
      case 'user_follow':
        return '#3b82f6'
      case 'shop_update':
        return '#f97316'
      case 'spot_update':
        return '#10b981'
      default:
        return '#64748b'
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadItem
      ]} 
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon()} 
          size={24} 
          color={getIconColor()} 
        />
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>
          {timeAgo}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color="#64748b" />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const NotificationsScreen = () => {
  const { 
    notifications, 
    unreadCount, 
    isConnected,
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    connect,
    disconnect
  } = useNotificationStore()
  
  const { user, token } = useAuthStore()
  const [refreshing, setRefreshing] = React.useState(false)

  useEffect(() => {
    // Connect to WebSocket when screen loads
    if (user && token && !isConnected) {
      connect(user.id, token)
    }
    
    return () => {
      // Don't disconnect when leaving screen - keep connection alive
    }
  }, [user, token, isConnected, connect])

  const handleRefresh = async () => {
    setRefreshing(true)
    
    // Reconnect WebSocket
    if (user && token) {
      disconnect()
      setTimeout(() => {
        connect(user.id, token)
      }, 1000)
    }
    
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Handle notification action based on type
    if (notification.data?.action) {
      switch (notification.data.action) {
        case 'event_updated':
          // Navigate to event details
          console.log('Navigate to event:', notification.data.event_id)
          break
        case 'user_followed':
          // Navigate to user profile
          console.log('Navigate to user:', notification.data.follower_id)
          break
        case 'spot_created':
          // Navigate to spot details
          console.log('Navigate to spot:', notification.data.spot_id)
          break
        case 'shop_updated':
          // Navigate to shop details
          console.log('Navigate to shop:', notification.data.shop_id)
          break
      }
    }
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return
    
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: markAllAsRead }
      ]
    )
  }

  const handleClearAll = () => {
    if (notifications.length === 0) return
    
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all notifications. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearNotifications }
      ]
    )
  }

  const renderNotification = ({ item }: { item: any }) => (
    <NotificationItem 
      notification={item} 
      onPress={() => handleNotificationPress(item)} 
    />
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={[styles.actionButton, unreadCount === 0 && styles.disabledButton]}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.actionText, unreadCount === 0 && styles.disabledText]}>
            Mark All Read
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderConnectionStatus = () => (
    <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
      <Ionicons 
        name={isConnected ? 'wifi' : 'wifi-off'} 
        size={16} 
        color={isConnected ? '#22c55e' : '#ef4444'} 
      />
      <Text style={styles.connectionText}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Text>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        You'll see notifications about events, follows, and updates here
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderConnectionStatus()}
      
      {notifications.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#22c55e"
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {notifications.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  disabledText: {
    color: '#9ca3af',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  connected: {
    backgroundColor: '#f0fdf4',
  },
  disconnected: {
    backgroundColor: '#fef2f2',
  },
  connectionText: {
    fontSize: 12,
    marginLeft: 6,
    color: '#64748b',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  unreadItem: {
    backgroundColor: '#fafbfc',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chevron: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  clearButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
})

export default NotificationsScreen