import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../stores/authStore'
import { syncService } from '../services/syncService'
import { deviceService } from '../services/deviceService'
import { offlineStorage } from '../services/offlineStorage'
import { notificationService } from '../services/notificationService'
import { locationService } from '../services/locationService'

export default function SettingsScreen() {
  const { user, logout } = useAuthStore()
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load sync settings
      const status = await syncService.getSyncStatus()
      setSyncStatus(status)
      setAutoSyncEnabled(syncService.isAutoSyncEnabled())

      // Load storage stats
      const stats = await offlineStorage.getStorageStats()
      setStorageStats(stats)

      // Load device info
      const info = deviceService.getDeviceInfo()
      setDeviceInfo(info)

      // Check permissions
      const notifPerms = await notificationService.checkPermissions()
      setNotificationsEnabled(notifPerms.granted)

      const locationPerms = await locationService.requestLocationPermissions()
      setLocationEnabled(locationPerms.granted)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    )
  }

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSyncEnabled(enabled)
    syncService.setAutoSyncEnabled(enabled)
    deviceService.triggerHapticFeedback('light')
  }

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permissions = await notificationService.requestPermissions()
        setNotificationsEnabled(permissions.granted)
      } catch (error) {
        Alert.alert('Error', 'Failed to enable notifications')
      }
    } else {
      await notificationService.openNotificationSettings()
    }
    deviceService.triggerHapticFeedback('light')
  }

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permissions = await locationService.requestLocationPermissions()
        setLocationEnabled(permissions.granted)
      } catch (error) {
        Alert.alert('Error', 'Failed to enable location services')
      }
    }
    deviceService.triggerHapticFeedback('light')
  }

  const handleForceSync = async () => {
    try {
      deviceService.triggerHapticFeedback('medium')
      const result = await syncService.forceFullSync()
      
      if (result.success) {
        Alert.alert('Success', `Synced ${result.synced} items successfully`)
        deviceService.triggerHapticFeedback('success')
      } else {
        Alert.alert('Sync Issues', `Synced ${result.synced}, failed ${result.failed}`)
        deviceService.triggerHapticFeedback('warning')
      }
      
      loadSettings() // Refresh status
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data')
      deviceService.triggerHapticFeedback('error')
    }
  }

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will delete all cached spots and offline data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorage.clearAllOfflineData()
              Alert.alert('Success', 'Offline data cleared')
              loadSettings()
              deviceService.triggerHapticFeedback('success')
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data')
              deviceService.triggerHapticFeedback('error')
            }
          },
        },
      ]
    )
  }

  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification()
      deviceService.triggerHapticFeedback('success')
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification')
    }
  }

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out BroSkate - the ultimate skateboarding spot finder! 🛹',
        title: 'BroSkate App',
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const formatStorageSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.username || 'Guest'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync data when online
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={handleAutoSyncToggle}
              trackColor={{ false: '#333', true: '#00D4FF' }}
              thumbColor={autoSyncEnabled ? '#fff' : '#ccc'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#333', true: '#00D4FF' }}
              thumbColor={notificationsEnabled ? '#fff' : '#ccc'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location Services</Text>
              <Text style={styles.settingDescription}>
                Find nearby spots and get location-based features
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#333', true: '#00D4FF' }}
              thumbColor={locationEnabled ? '#fff' : '#ccc'}
            />
          </View>
        </View>

        {/* Data & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleForceSync}>
            <Text style={styles.actionButtonText}>Force Sync Now</Text>
            <Text style={styles.actionButtonSubtext}>
              {syncStatus?.lastSyncTime 
                ? `Last sync: ${syncService.getFormattedLastSyncTime()}`
                : 'Never synced'
              }
            </Text>
          </TouchableOpacity>

          {storageStats && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Offline Storage</Text>
              <Text style={styles.infoText}>Offline Spots: {storageStats.offlineSpots}</Text>
              <Text style={styles.infoText}>Offline Events: {storageStats.offlineEvents}</Text>
              <Text style={styles.infoText}>Cached Spots: {storageStats.cachedSpots}</Text>
              <Text style={styles.infoText}>Pending Sync: {storageStats.pendingSync}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.destructiveButton]} 
            onPress={handleClearOfflineData}
          >
            <Text style={[styles.actionButtonText, styles.destructiveText]}>
              Clear Offline Data
            </Text>
            <Text style={styles.actionButtonSubtext}>
              Remove all cached spots and offline content
            </Text>
          </TouchableOpacity>
        </View>

        {/* Device Info */}
        {deviceInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Device: {deviceService.formatDeviceInfo()}</Text>
              <Text style={styles.infoText}>Screen: {deviceInfo.screenWidth}×{deviceInfo.screenHeight}</Text>
              <Text style={styles.infoText}>App Version: {deviceInfo.appVersion}</Text>
              <Text style={styles.infoText}>Build: {deviceInfo.buildNumber}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Text style={styles.actionButtonText}>Test Notification</Text>
            <Text style={styles.actionButtonSubtext}>
              Send a test push notification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareApp}>
            <Text style={styles.actionButtonText}>Share BroSkate</Text>
            <Text style={styles.actionButtonSubtext}>
              Tell your friends about the app
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>BroSkate v{deviceInfo?.appVersion || '1.0.0'}</Text>
          <Text style={styles.versionText}>Build {deviceInfo?.buildNumber || '1'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  actionButton: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  destructiveButton: {
    borderColor: '#FF6B6B',
  },
  destructiveText: {
    color: '#FF6B6B',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  versionInfo: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
})