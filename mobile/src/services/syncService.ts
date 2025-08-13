import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { offlineStorage } from './offlineStorage'
import { api } from './api'
import { authStore } from '../stores/authStore'

export interface SyncStatus {
  isOnline: boolean
  lastSyncTime: Date | null
  pendingSync: number
  syncInProgress: boolean
  syncErrors: string[]
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

class SyncService {
  private syncInProgress = false
  private lastSyncTime: Date | null = null
  private syncErrors: string[] = []
  private netInfoUnsubscribe: (() => void) | null = null
  private autoSyncEnabled = true
  private syncInterval: NodeJS.Timeout | null = null

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      // Load last sync time from storage
      const lastSync = await AsyncStorage.getItem('@last_sync_time')
      if (lastSync) {
        this.lastSyncTime = new Date(lastSync)
      }

      // Set up network monitoring
      this.setupNetworkListener()
      
      // Set up auto-sync interval (every 5 minutes when online)
      this.startAutoSync()

      console.log('🔄 Sync service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize sync service:', error)
    }
  }

  // NETWORK MONITORING
  private setupNetworkListener(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      console.log('📶 Network state changed:', state.isConnected)
      
      if (state.isConnected && this.autoSyncEnabled) {
        // Auto-sync when coming back online
        setTimeout(() => {
          this.syncAll()
        }, 2000) // Wait 2 seconds for connection to stabilize
      }
    })
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      const netState = await NetInfo.fetch()
      if (netState.isConnected && this.autoSyncEnabled && !this.syncInProgress) {
        await this.syncAll()
      }
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  // MAIN SYNC METHODS
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping')
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Sync already in progress']
      }
    }

    const netState = await NetInfo.fetch()
    if (!netState.isConnected) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['No internet connection']
      }
    }

    this.syncInProgress = true
    this.syncErrors = []
    let totalSynced = 0
    let totalFailed = 0

    try {
      console.log('🔄 Starting full sync...')

      // Sync spots
      const spotsResult = await this.syncSpots()
      totalSynced += spotsResult.synced
      totalFailed += spotsResult.failed

      // Sync events
      const eventsResult = await this.syncEvents()
      totalSynced += eventsResult.synced
      totalFailed += eventsResult.failed

      // Download fresh data for offline use
      await this.downloadDataForOffline()

      // Update last sync time
      this.lastSyncTime = new Date()
      await AsyncStorage.setItem('@last_sync_time', this.lastSyncTime.toISOString())

      const success = totalFailed === 0
      console.log(`✅ Sync completed: ${totalSynced} synced, ${totalFailed} failed`)

      return {
        success,
        synced: totalSynced,
        failed: totalFailed,
        errors: this.syncErrors
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
      this.syncErrors.push(`General sync error: ${error}`)
      
      return {
        success: false,
        synced: totalSynced,
        failed: totalFailed + 1,
        errors: this.syncErrors
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // SYNC SPECIFIC DATA TYPES
  async syncSpots(): Promise<SyncResult> {
    let synced = 0
    let failed = 0
    const errors: string[] = []

    try {
      const pendingSpots = await offlineStorage.getPendingSpots()
      console.log(`🔄 Syncing ${pendingSpots.length} pending spots...`)

      for (const spot of pendingSpots) {
        try {
          // Upload to server
          const response = await api.post('/api/spots', {
            name: spot.name,
            description: spot.description,
            latitude: spot.latitude,
            longitude: spot.longitude,
            difficulty_level: spot.difficulty_level,
            spot_type: spot.spot_type
          })

          if (response.data.success) {
            // Mark as synced in offline storage
            await offlineStorage.updateSpotSyncStatus(spot.id, 'synced')
            synced++
            console.log(`✅ Synced spot: ${spot.name}`)
          } else {
            await offlineStorage.updateSpotSyncStatus(spot.id, 'failed')
            failed++
            errors.push(`Failed to sync spot: ${spot.name}`)
          }
        } catch (error) {
          await offlineStorage.updateSpotSyncStatus(spot.id, 'failed')
          failed++
          errors.push(`Error syncing spot ${spot.name}: ${error}`)
          console.error(`❌ Failed to sync spot ${spot.name}:`, error)
        }
      }
    } catch (error) {
      errors.push(`Failed to get pending spots: ${error}`)
      console.error('❌ Failed to get pending spots:', error)
    }

    this.syncErrors.push(...errors)
    return { success: failed === 0, synced, failed, errors }
  }

  async syncEvents(): Promise<SyncResult> {
    let synced = 0
    let failed = 0
    const errors: string[] = []

    try {
      const pendingEvents = await offlineStorage.getPendingEvents()
      console.log(`🔄 Syncing ${pendingEvents.length} pending events...`)

      for (const event of pendingEvents) {
        try {
          // Upload to server
          const response = await api.post('/api/events', {
            title: event.title,
            description: event.description,
            date: event.date,
            latitude: event.latitude,
            longitude: event.longitude
          })

          if (response.data.success) {
            // Mark as synced in offline storage
            await offlineStorage.updateEventSyncStatus(event.id, 'synced')
            synced++
            console.log(`✅ Synced event: ${event.title}`)
          } else {
            await offlineStorage.updateEventSyncStatus(event.id, 'failed')
            failed++
            errors.push(`Failed to sync event: ${event.title}`)
          }
        } catch (error) {
          await offlineStorage.updateEventSyncStatus(event.id, 'failed')
          failed++
          errors.push(`Error syncing event ${event.title}: ${error}`)
          console.error(`❌ Failed to sync event ${event.title}:`, error)
        }
      }
    } catch (error) {
      errors.push(`Failed to get pending events: ${error}`)
      console.error('❌ Failed to get pending events:', error)
    }

    this.syncErrors.push(...errors)
    return { success: failed === 0, synced, failed, errors }
  }

  // DOWNLOAD DATA FOR OFFLINE
  async downloadDataForOffline(): Promise<void> {
    try {
      console.log('📥 Downloading data for offline use...')

      // Download spots for caching
      const spotsResponse = await api.get('/api/spots?limit=100')
      if (spotsResponse.data.success) {
        await offlineStorage.cacheSpots(spotsResponse.data.data)
        console.log(`📥 Cached ${spotsResponse.data.data.length} spots for offline use`)
      }

      // Could add more data types here (events, user data, etc.)
    } catch (error) {
      console.error('❌ Failed to download offline data:', error)
      this.syncErrors.push(`Failed to download offline data: ${error}`)
    }
  }

  // CONFLICT RESOLUTION
  private async resolveSpotConflict(localSpot: any, serverSpot: any): Promise<any> {
    // Simple resolution: server wins for now
    // In a real app, you might want to show user options or merge intelligently
    console.log(`🔀 Resolving spot conflict for: ${localSpot.name}`)
    
    // Update local storage with server data
    await offlineStorage.updateSpotSyncStatus(localSpot.id, 'synced')
    
    return serverSpot
  }

  // SYNC STATUS
  async getSyncStatus(): Promise<SyncStatus> {
    const netState = await NetInfo.fetch()
    const stats = await offlineStorage.getStorageStats()

    return {
      isOnline: netState.isConnected || false,
      lastSyncTime: this.lastSyncTime,
      pendingSync: stats.pendingSync,
      syncInProgress: this.syncInProgress,
      syncErrors: [...this.syncErrors]
    }
  }

  // MANUAL SYNC CONTROLS
  async forceSyncSpots(): Promise<SyncResult> {
    return await this.syncSpots()
  }

  async forceSyncEvents(): Promise<SyncResult> {
    return await this.syncEvents()
  }

  async forceFullSync(): Promise<SyncResult> {
    return await this.syncAll()
  }

  // SYNC SETTINGS
  setAutoSyncEnabled(enabled: boolean): void {
    this.autoSyncEnabled = enabled
    
    if (enabled) {
      this.startAutoSync()
    } else if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    console.log(`🔄 Auto-sync ${enabled ? 'enabled' : 'disabled'}`)
  }

  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled
  }

  // RETRY FAILED SYNCS
  async retryFailedSyncs(): Promise<SyncResult> {
    console.log('🔄 Retrying failed syncs...')
    
    let totalSynced = 0
    let totalFailed = 0
    const allErrors: string[] = []

    try {
      // Reset failed items to pending and try again
      const pendingSpots = await offlineStorage.getPendingSpots()
      const pendingEvents = await offlineStorage.getPendingEvents()

      if (pendingSpots.length > 0) {
        const spotsResult = await this.syncSpots()
        totalSynced += spotsResult.synced
        totalFailed += spotsResult.failed
        allErrors.push(...spotsResult.errors)
      }

      if (pendingEvents.length > 0) {
        const eventsResult = await this.syncEvents()
        totalSynced += eventsResult.synced
        totalFailed += eventsResult.failed
        allErrors.push(...eventsResult.errors)
      }

      return {
        success: totalFailed === 0,
        synced: totalSynced,
        failed: totalFailed,
        errors: allErrors
      }
    } catch (error) {
      return {
        success: false,
        synced: totalSynced,
        failed: totalFailed + 1,
        errors: [...allErrors, `Retry failed: ${error}`]
      }
    }
  }

  // CLEANUP
  cleanup(): void {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval)
        this.syncInterval = null
      }

      if (this.netInfoUnsubscribe) {
        this.netInfoUnsubscribe()
        this.netInfoUnsubscribe = null
      }

      console.log('🧹 Sync service cleaned up')
    } catch (error) {
      console.error('❌ Failed to cleanup sync service:', error)
    }
  }

  // DEBUGGING HELPERS
  async clearSyncHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@last_sync_time')
      this.lastSyncTime = null
      this.syncErrors = []
      console.log('🧹 Sync history cleared')
    } catch (error) {
      console.error('❌ Failed to clear sync history:', error)
    }
  }

  getSyncErrors(): string[] {
    return [...this.syncErrors]
  }

  clearSyncErrors(): void {
    this.syncErrors = []
  }

  // UTILITY METHODS
  private formatSyncTime(date: Date | null): string {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  getFormattedLastSyncTime(): string {
    return this.formatSyncTime(this.lastSyncTime)
  }
}

export const syncService = new SyncService()
export default syncService