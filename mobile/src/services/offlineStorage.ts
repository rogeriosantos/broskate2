import * as SQLite from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OfflineSpot {
  id: number
  name: string
  description: string
  latitude: number
  longitude: number
  difficulty_level: number
  spot_type: string
  created_at: string
  sync_status: 'synced' | 'pending' | 'failed'
}

interface OfflineEvent {
  id: number
  title: string
  description: string
  date: string
  latitude?: number
  longitude?: number
  created_at: string
  sync_status: 'synced' | 'pending' | 'failed'
}

class OfflineStorageService {
  private db: SQLite.SQLiteDatabase | null = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      this.db = await SQLite.openDatabaseAsync('broskate_offline.db')
      
      // Create tables
      await this.createTables()
      this.isInitialized = true
      console.log('✅ Offline database initialized')
    } catch (error) {
      console.error('❌ Failed to initialize offline database:', error)
      throw error
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized')

    // Spots table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_spots (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        difficulty_level INTEGER,
        spot_type TEXT,
        created_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_offline_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Events table  
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_events (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_offline_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Cached spots for offline viewing
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_spots (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        difficulty_level INTEGER,
        spot_type TEXT,
        created_at TEXT,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // User preferences and settings
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Database tables created successfully')
  }

  // OFFLINE SPOTS
  async saveOfflineSpot(spot: Omit<OfflineSpot, 'id' | 'sync_status'>): Promise<number> {
    if (!this.db) await this.initialize()

    const result = await this.db.runAsync(`
      INSERT INTO offline_spots (name, description, latitude, longitude, difficulty_level, spot_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      spot.name,
      spot.description,
      spot.latitude,
      spot.longitude,
      spot.difficulty_level,
      spot.spot_type,
      spot.created_at
    ])

    console.log('💾 Saved offline spot:', spot.name)
    return result.lastInsertRowId
  }

  async getOfflineSpots(): Promise<OfflineSpot[]> {
    if (!this.db) await this.initialize()

    const result = await this.db.getAllAsync(`
      SELECT * FROM offline_spots 
      ORDER BY created_offline_at DESC
    `)

    return result as OfflineSpot[]
  }

  async getPendingSpots(): Promise<OfflineSpot[]> {
    if (!this.db) await this.initialize()

    const result = await this.db.getAllAsync(`
      SELECT * FROM offline_spots 
      WHERE sync_status = 'pending'
      ORDER BY created_offline_at ASC
    `)

    return result as OfflineSpot[]
  }

  async updateSpotSyncStatus(id: number, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.initialize()

    await this.db.runAsync(`
      UPDATE offline_spots 
      SET sync_status = ? 
      WHERE id = ?
    `, [status, id])
  }

  // OFFLINE EVENTS
  async saveOfflineEvent(event: Omit<OfflineEvent, 'id' | 'sync_status'>): Promise<number> {
    if (!this.db) await this.initialize()

    const result = await this.db.runAsync(`
      INSERT INTO offline_events (title, description, date, latitude, longitude, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      event.title,
      event.description,
      event.date,
      event.latitude,
      event.longitude,
      event.created_at
    ])

    console.log('💾 Saved offline event:', event.title)
    return result.lastInsertRowId
  }

  async getOfflineEvents(): Promise<OfflineEvent[]> {
    if (!this.db) await this.initialize()

    const result = await this.db.getAllAsync(`
      SELECT * FROM offline_events 
      ORDER BY created_offline_at DESC
    `)

    return result as OfflineEvent[]
  }

  async getPendingEvents(): Promise<OfflineEvent[]> {
    if (!this.db) await this.initialize()

    const result = await this.db.getAllAsync(`
      SELECT * FROM offline_events 
      WHERE sync_status = 'pending'
      ORDER BY created_offline_at ASC
    `)

    return result as OfflineEvent[]
  }

  async updateEventSyncStatus(id: number, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.initialize()

    await this.db.runAsync(`
      UPDATE offline_events 
      SET sync_status = ? 
      WHERE id = ?
    `, [status, id])
  }

  // CACHED DATA (for offline viewing)
  async cacheSpots(spots: any[]): Promise<void> {
    if (!this.db) await this.initialize()

    // Clear old cache
    await this.db.runAsync('DELETE FROM cached_spots')

    // Insert new data
    for (const spot of spots) {
      await this.db.runAsync(`
        INSERT INTO cached_spots (id, name, description, latitude, longitude, difficulty_level, spot_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        spot.id,
        spot.name,
        spot.description,
        spot.latitude,
        spot.longitude,
        spot.difficulty_level,
        spot.spot_type,
        spot.created_at
      ])
    }

    console.log(`💾 Cached ${spots.length} spots for offline access`)
  }

  async getCachedSpots(): Promise<any[]> {
    if (!this.db) await this.initialize()

    const result = await this.db.getAllAsync(`
      SELECT * FROM cached_spots 
      ORDER BY last_accessed DESC
    `)

    return result
  }

  async updateSpotLastAccessed(id: number): Promise<void> {
    if (!this.db) await this.initialize()

    await this.db.runAsync(`
      UPDATE cached_spots 
      SET last_accessed = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id])
  }

  // USER SETTINGS
  async saveSetting(key: string, value: string): Promise<void> {
    if (!this.db) await this.initialize()

    await this.db.runAsync(`
      INSERT OR REPLACE INTO user_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [key, value])
  }

  async getSetting(key: string, defaultValue?: string): Promise<string | null> {
    if (!this.db) await this.initialize()

    const result = await this.db.getFirstAsync(`
      SELECT value FROM user_settings WHERE key = ?
    `, [key])

    return (result as any)?.value || defaultValue || null
  }

  // UTILITY METHODS
  async clearAllOfflineData(): Promise<void> {
    if (!this.db) await this.initialize()

    await this.db.runAsync('DELETE FROM offline_spots')
    await this.db.runAsync('DELETE FROM offline_events')
    await this.db.runAsync('DELETE FROM cached_spots')
    
    console.log('🗑️ Cleared all offline data')
  }

  async getStorageStats(): Promise<{
    offlineSpots: number
    offlineEvents: number
    cachedSpots: number
    pendingSync: number
  }> {
    if (!this.db) await this.initialize()

    const [spotsResult, eventsResult, cachedResult, pendingResult] = await Promise.all([
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM offline_spots'),
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM offline_events'),
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM cached_spots'),
      this.db.getFirstAsync(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM offline_spots WHERE sync_status = 'pending'
          UNION ALL
          SELECT id FROM offline_events WHERE sync_status = 'pending'
        )
      `)
    ])

    return {
      offlineSpots: (spotsResult as any)?.count || 0,
      offlineEvents: (eventsResult as any)?.count || 0,
      cachedSpots: (cachedResult as any)?.count || 0,
      pendingSync: (pendingResult as any)?.count || 0
    }
  }
}

export const offlineStorage = new OfflineStorageService()
export default offlineStorage