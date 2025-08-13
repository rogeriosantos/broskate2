import * as Device from 'expo-device'
import * as Application from 'expo-application'
import * as Network from 'expo-network'
import * as Battery from 'expo-battery'
import * as ScreenOrientation from 'expo-screen-orientation'
import * as Haptics from 'expo-haptics'
import * as SecureStore from 'expo-secure-store'
import { Platform, Dimensions, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface DeviceInfo {
  // Device basic info
  deviceId: string | null
  deviceName: string | null
  modelName: string | null
  deviceType: Device.DeviceType | null
  
  // OS info
  osName: string | null
  osVersion: string | null
  platformApiLevel: number | null
  
  // App info
  appName: string | null
  appVersion: string | null
  buildNumber: string | null
  bundleIdentifier: string | null
  
  // Hardware info
  brand: string | null
  manufacturer: string | null
  isDevice: boolean
  isRooted: boolean | null
  
  // Screen info
  screenWidth: number
  screenHeight: number
  screenScale: number
  screenDensity?: number
  statusBarHeight: number
}

export interface NetworkInfo {
  isConnected: boolean
  connectionType: string
  isInternetReachable: boolean | null
  ipAddress: string | null
  networkState: any
}

export interface BatteryInfo {
  batteryLevel: number | null
  batteryState: Battery.BatteryState | null
  isLowPowerMode: boolean | null
}

export interface DeviceCapabilities {
  hasCamera: boolean
  hasLocation: boolean
  hasNotifications: boolean
  hasBiometrics: boolean
  hasHaptics: boolean
  hasSecureStorage: boolean
}

class DeviceService {
  private deviceInfo: DeviceInfo | null = null
  private capabilities: DeviceCapabilities | null = null

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      await this.loadDeviceInfo()
      await this.detectCapabilities()
      console.log('📱 Device service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize device service:', error)
    }
  }

  // DEVICE INFO
  async loadDeviceInfo(): Promise<DeviceInfo> {
    try {
      const { width, height } = Dimensions.get('screen')
      const { scale } = Dimensions.get('window')
      
      this.deviceInfo = {
        // Device basic info
        deviceId: Application.getAndroidId(),
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        deviceType: Device.deviceType,
        
        // OS info
        osName: Device.osName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
        
        // App info
        appName: Application.applicationName,
        appVersion: Application.nativeApplicationVersion,
        buildNumber: Application.nativeBuildVersion,
        bundleIdentifier: Application.applicationId,
        
        // Hardware info
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        isDevice: Device.isDevice,
        isRooted: null, // We'll detect this separately
        
        // Screen info
        screenWidth: width,
        screenHeight: height,
        screenScale: scale,
        statusBarHeight: StatusBar.currentHeight || 0
      }

      // Detect if device is rooted/jailbroken
      this.deviceInfo.isRooted = await this.detectRootedDevice()

      console.log('📱 Device info loaded:', {
        model: this.deviceInfo.modelName,
        os: `${this.deviceInfo.osName} ${this.deviceInfo.osVersion}`,
        screen: `${width}x${height} @${scale}x`
      })

      return this.deviceInfo
    } catch (error) {
      console.error('❌ Failed to load device info:', error)
      throw new Error('Failed to load device information')
    }
  }

  private async detectRootedDevice(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Basic root detection for Android
        // In production, you might want more sophisticated detection
        const testPaths = [
          '/system/app/Superuser.apk',
          '/sbin/su',
          '/system/bin/su',
          '/system/xbin/su',
          '/data/local/xbin/su',
          '/data/local/bin/su',
          '/system/sd/xbin/su',
          '/system/bin/failsafe/su',
          '/data/local/su'
        ]
        
        // This is a simplified check - in production you'd use a proper root detection library
        return false // For now, assume not rooted
      }
      
      if (Platform.OS === 'ios') {
        // Basic jailbreak detection for iOS
        // Check for common jailbreak indicators
        return false // For now, assume not jailbroken
      }
      
      return false
    } catch (error) {
      console.error('❌ Failed to detect rooted device:', error)
      return false
    }
  }

  // CAPABILITIES DETECTION
  async detectCapabilities(): Promise<DeviceCapabilities> {
    try {
      this.capabilities = {
        hasCamera: Device.isDevice, // Assume physical devices have cameras
        hasLocation: Device.isDevice,
        hasNotifications: Device.isDevice,
        hasBiometrics: await this.checkBiometricsAvailable(),
        hasHaptics: Device.isDevice && (Platform.OS === 'ios' || Platform.OS === 'android'),
        hasSecureStorage: await SecureStore.isAvailableAsync()
      }

      console.log('🔍 Device capabilities detected:', this.capabilities)
      return this.capabilities
    } catch (error) {
      console.error('❌ Failed to detect capabilities:', error)
      return {
        hasCamera: false,
        hasLocation: false,
        hasNotifications: false,
        hasBiometrics: false,
        hasHaptics: false,
        hasSecureStorage: false
      }
    }
  }

  private async checkBiometricsAvailable(): Promise<boolean> {
    try {
      // This would require expo-local-authentication
      // For now, assume modern devices have biometrics
      return Device.isDevice && (
        Platform.OS === 'ios' || 
        (Platform.OS === 'android' && (Device.platformApiLevel || 0) >= 23)
      )
    } catch (error) {
      return false
    }
  }

  // NETWORK MONITORING
  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const networkState = await Network.getNetworkStateAsync()
      const ipAddress = await Network.getIpAddressAsync()

      return {
        isConnected: networkState.isConnected || false,
        connectionType: networkState.type || 'unknown',
        isInternetReachable: networkState.isInternetReachable,
        ipAddress,
        networkState
      }
    } catch (error) {
      console.error('❌ Failed to get network info:', error)
      return {
        isConnected: false,
        connectionType: 'unknown',
        isInternetReachable: null,
        ipAddress: null,
        networkState: null
      }
    }
  }

  // BATTERY MONITORING
  async getBatteryInfo(): Promise<BatteryInfo> {
    try {
      const [batteryLevel, batteryState, isLowPowerMode] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync()
      ])

      return {
        batteryLevel,
        batteryState,
        isLowPowerMode
      }
    } catch (error) {
      console.error('❌ Failed to get battery info:', error)
      return {
        batteryLevel: null,
        batteryState: null,
        isLowPowerMode: null
      }
    }
  }

  // SCREEN ORIENTATION
  async getCurrentOrientation(): Promise<ScreenOrientation.Orientation> {
    try {
      return await ScreenOrientation.getOrientationAsync()
    } catch (error) {
      console.error('❌ Failed to get orientation:', error)
      return ScreenOrientation.Orientation.UNKNOWN
    }
  }

  async lockOrientation(orientation: ScreenOrientation.OrientationLock): Promise<void> {
    try {
      await ScreenOrientation.lockAsync(orientation)
      console.log('📱 Screen orientation locked:', orientation)
    } catch (error) {
      console.error('❌ Failed to lock orientation:', error)
    }
  }

  async unlockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.unlockAsync()
      console.log('📱 Screen orientation unlocked')
    } catch (error) {
      console.error('❌ Failed to unlock orientation:', error)
    }
  }

  // HAPTIC FEEDBACK
  async triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'): Promise<void> {
    try {
      if (!this.capabilities?.hasHaptics) return

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          break
      }
    } catch (error) {
      console.error('❌ Failed to trigger haptic feedback:', error)
    }
  }

  async triggerSelectionHaptic(): Promise<void> {
    try {
      if (this.capabilities?.hasHaptics) {
        await Haptics.selectionAsync()
      }
    } catch (error) {
      console.error('❌ Failed to trigger selection haptic:', error)
    }
  }

  // SECURE STORAGE
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (!this.capabilities?.hasSecureStorage) {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(key, value)
        return
      }
      
      await SecureStore.setItemAsync(key, value)
      console.log('🔐 Secure item stored:', key)
    } catch (error) {
      console.error('❌ Failed to store secure item:', error)
      throw new Error('Failed to store secure data')
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (!this.capabilities?.hasSecureStorage) {
        // Fallback to AsyncStorage
        return await AsyncStorage.getItem(key)
      }
      
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      console.error('❌ Failed to get secure item:', error)
      return null
    }
  }

  async deleteSecureItem(key: string): Promise<void> {
    try {
      if (!this.capabilities?.hasSecureStorage) {
        // Fallback to AsyncStorage
        await AsyncStorage.removeItem(key)
        return
      }
      
      await SecureStore.deleteItemAsync(key)
      console.log('🔐 Secure item deleted:', key)
    } catch (error) {
      console.error('❌ Failed to delete secure item:', error)
    }
  }

  // DEVICE PERFORMANCE
  async getDevicePerformanceInfo(): Promise<{
    isLowEndDevice: boolean
    memoryWarning: boolean
    batteryOptimized: boolean
    performanceClass: 'low' | 'medium' | 'high'
  }> {
    try {
      const batteryInfo = await this.getBatteryInfo()
      const networkInfo = await this.getNetworkInfo()
      
      // Basic performance classification
      const isLowEndDevice = this.deviceInfo ? (
        this.deviceInfo.screenWidth < 1080 ||
        (Device.platformApiLevel && Device.platformApiLevel < 26) ||
        Device.totalMemory && Device.totalMemory < 2 * 1024 * 1024 * 1024 // < 2GB RAM
      ) : true

      const memoryWarning = Device.totalMemory ? 
        Device.totalMemory < 1 * 1024 * 1024 * 1024 : false // < 1GB RAM

      const batteryOptimized = batteryInfo.isLowPowerMode === true

      let performanceClass: 'low' | 'medium' | 'high' = 'medium'
      if (isLowEndDevice || memoryWarning) {
        performanceClass = 'low'
      } else if (this.deviceInfo && this.deviceInfo.screenWidth >= 1440) {
        performanceClass = 'high'
      }

      return {
        isLowEndDevice,
        memoryWarning,
        batteryOptimized,
        performanceClass
      }
    } catch (error) {
      console.error('❌ Failed to get performance info:', error)
      return {
        isLowEndDevice: true,
        memoryWarning: false,
        batteryOptimized: false,
        performanceClass: 'low'
      }
    }
  }

  // GETTERS
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo
  }

  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities
  }

  // UTILITY METHODS
  isTablet(): boolean {
    return this.deviceInfo?.deviceType === Device.DeviceType.TABLET
  }

  isPhone(): boolean {
    return this.deviceInfo?.deviceType === Device.DeviceType.PHONE
  }

  isAndroid(): boolean {
    return Platform.OS === 'android'
  }

  isIOS(): boolean {
    return Platform.OS === 'ios'
  }

  getScreenDimensions(): { width: number; height: number; scale: number } {
    const { width, height } = Dimensions.get('screen')
    const { scale } = Dimensions.get('window')
    
    return { width, height, scale }
  }

  formatDeviceInfo(): string {
    if (!this.deviceInfo) return 'Unknown device'
    
    return `${this.deviceInfo.brand} ${this.deviceInfo.modelName} (${this.deviceInfo.osName} ${this.deviceInfo.osVersion})`
  }

  // DEBUG HELPERS
  async getFullDeviceDiagnostics(): Promise<{
    device: DeviceInfo | null
    capabilities: DeviceCapabilities | null
    network: NetworkInfo
    battery: BatteryInfo
    performance: any
  }> {
    const [network, battery, performance] = await Promise.all([
      this.getNetworkInfo(),
      this.getBatteryInfo(),
      this.getDevicePerformanceInfo()
    ])

    return {
      device: this.deviceInfo,
      capabilities: this.capabilities,
      network,
      battery,
      performance
    }
  }

  logDeviceInfo(): void {
    if (this.deviceInfo && this.capabilities) {
      console.log('📱 Device Information:')
      console.log('  Model:', this.deviceInfo.modelName)
      console.log('  OS:', `${this.deviceInfo.osName} ${this.deviceInfo.osVersion}`)
      console.log('  Screen:', `${this.deviceInfo.screenWidth}x${this.deviceInfo.screenHeight}`)
      console.log('  Capabilities:', this.capabilities)
    }
  }
}

export const deviceService = new DeviceService()
export default deviceService