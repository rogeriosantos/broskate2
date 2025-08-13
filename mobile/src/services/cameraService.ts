import * as Camera from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

export interface CameraOptions {
  quality?: number // 0 to 1
  allowsEditing?: boolean
  aspect?: [number, number]
  base64?: boolean
}

export interface MediaPickerOptions {
  mediaTypes?: 'Images' | 'Videos' | 'All'
  allowsEditing?: boolean
  quality?: number
  allowsMultipleSelection?: boolean
  orderedSelection?: boolean
  selectionLimit?: number
}

export interface CameraPermissions {
  camera: boolean
  mediaLibrary: boolean
  canAskAgain: boolean
}

export interface MediaResult {
  uri: string
  width: number
  height: number
  type: 'image' | 'video'
  fileSize?: number
  duration?: number
  base64?: string
  exif?: any
}

class CameraService {
  private cameraRef: Camera.CameraView | null = null

  // PERMISSION MANAGEMENT
  async requestPermissions(): Promise<CameraPermissions> {
    try {
      const [cameraResult, mediaResult] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        MediaLibrary.requestPermissionsAsync()
      ])

      return {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaResult.status === 'granted',
        canAskAgain: cameraResult.canAskAgain && mediaResult.canAskAgain
      }
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error)
      return {
        camera: false,
        mediaLibrary: false,
        canAskAgain: false
      }
    }
  }

  async checkPermissions(): Promise<CameraPermissions> {
    try {
      const [cameraResult, mediaResult] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync()
      ])

      return {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaResult.status === 'granted',
        canAskAgain: cameraResult.canAskAgain && mediaResult.canAskAgain
      }
    } catch (error) {
      console.error('❌ Failed to check camera permissions:', error)
      return {
        camera: false,
        mediaLibrary: false,
        canAskAgain: false
      }
    }
  }

  // CAMERA CAPTURE
  async takePicture(options: CameraOptions = {}): Promise<MediaResult | null> {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not set')
      }

      const permissions = await this.checkPermissions()
      if (!permissions.camera) {
        throw new Error('Camera permission not granted')
      }

      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: true
      })

      if (!photo) return null

      const result: MediaResult = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        type: 'image',
        base64: photo.base64,
        exif: photo.exif
      }

      // Get file size
      try {
        const response = await fetch(photo.uri)
        const blob = await response.blob()
        result.fileSize = blob.size
      } catch (e) {
        console.warn('Could not get file size:', e)
      }

      console.log('📸 Picture taken successfully')
      return result
    } catch (error) {
      console.error('❌ Failed to take picture:', error)
      throw new Error('Failed to capture photo')
    }
  }

  async recordVideo(maxDuration: number = 60): Promise<MediaResult | null> {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not set')
      }

      const permissions = await this.checkPermissions()
      if (!permissions.camera) {
        throw new Error('Camera permission not granted')
      }

      const video = await this.cameraRef.recordAsync({
        maxDuration: maxDuration * 1000, // Convert to milliseconds
        quality: Camera.VideoQuality['720p'],
        mute: false
      })

      if (!video) return null

      const result: MediaResult = {
        uri: video.uri,
        width: 0, // Will be set after processing
        height: 0,
        type: 'video',
        duration: maxDuration
      }

      // Get file size
      try {
        const response = await fetch(video.uri)
        const blob = await response.blob()
        result.fileSize = blob.size
      } catch (e) {
        console.warn('Could not get file size:', e)
      }

      console.log('🎥 Video recorded successfully')
      return result
    } catch (error) {
      console.error('❌ Failed to record video:', error)
      throw new Error('Failed to record video')
    }
  }

  stopRecording(): void {
    try {
      if (this.cameraRef) {
        this.cameraRef.stopRecording()
        console.log('🛑 Video recording stopped')
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error)
    }
  }

  // MEDIA LIBRARY PICKER
  async pickImageFromLibrary(options: MediaPickerOptions = {}): Promise<MediaResult[]> {
    try {
      const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (permissions.status !== 'granted') {
        throw new Error('Media library permission not granted')
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: this.getImagePickerMediaType(options.mediaTypes || 'Images'),
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection || false,
        orderedSelection: options.orderedSelection || false,
        selectionLimit: options.selectionLimit || 10,
        exif: true,
        base64: false
      })

      if (result.canceled) {
        return []
      }

      const mediaResults = await Promise.all(
        result.assets.map(async (asset) => {
          const mediaResult: MediaResult = {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: asset.type === 'video' ? 'video' : 'image',
            exif: asset.exif,
            base64: asset.base64,
            duration: asset.duration
          }

          // Get file size
          try {
            const response = await fetch(asset.uri)
            const blob = await response.blob()
            mediaResult.fileSize = blob.size
          } catch (e) {
            console.warn('Could not get file size:', e)
          }

          return mediaResult
        })
      )

      console.log(`📚 Selected ${mediaResults.length} items from library`)
      return mediaResults
    } catch (error) {
      console.error('❌ Failed to pick from library:', error)
      throw new Error('Failed to pick media from library')
    }
  }

  async launchCamera(options: CameraOptions = {}): Promise<MediaResult | null> {
    try {
      const permissions = await ImagePicker.requestCameraPermissionsAsync()
      if (permissions.status !== 'granted') {
        throw new Error('Camera permission not granted')
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        aspect: options.aspect,
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: true
      })

      if (result.canceled) {
        return null
      }

      const asset = result.assets[0]
      const mediaResult: MediaResult = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image',
        exif: asset.exif,
        base64: asset.base64
      }

      // Get file size
      try {
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        mediaResult.fileSize = blob.size
      } catch (e) {
        console.warn('Could not get file size:', e)
      }

      console.log('📸 Image captured from camera launcher')
      return mediaResult
    } catch (error) {
      console.error('❌ Failed to launch camera:', error)
      throw new Error('Failed to capture with camera')
    }
  }

  // IMAGE PROCESSING
  async resizeImage(
    uri: string,
    width: number,
    height?: number,
    quality: number = 0.8
  ): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width, height } }],
        { 
          compress: quality,
          format: SaveFormat.JPEG
        }
      )
      
      console.log('🔄 Image resized successfully')
      return result.uri
    } catch (error) {
      console.error('❌ Failed to resize image:', error)
      throw new Error('Failed to resize image')
    }
  }

  async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [],
        { 
          compress: quality,
          format: SaveFormat.JPEG
        }
      )
      
      console.log('🗜️ Image compressed successfully')
      return result.uri
    } catch (error) {
      console.error('❌ Failed to compress image:', error)
      throw new Error('Failed to compress image')
    }
  }

  async cropImage(
    uri: string,
    cropData: {
      originX: number
      originY: number
      width: number
      height: number
    }
  ): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [{ crop: cropData }],
        { format: SaveFormat.JPEG }
      )
      
      console.log('✂️ Image cropped successfully')
      return result.uri
    } catch (error) {
      console.error('❌ Failed to crop image:', error)
      throw new Error('Failed to crop image')
    }
  }

  // SAVE TO DEVICE
  async saveToDevice(uri: string, albumName: string = 'BroSkate'): Promise<void> {
    try {
      const permissions = await this.checkPermissions()
      if (!permissions.mediaLibrary) {
        throw new Error('Media library permission not granted')
      }

      // Create album if it doesn't exist
      let album = await MediaLibrary.getAlbumAsync(albumName)
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName)
      }

      // Save asset
      const asset = await MediaLibrary.createAssetAsync(uri)
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)

      console.log(`💾 Media saved to ${albumName} album`)
    } catch (error) {
      console.error('❌ Failed to save to device:', error)
      throw new Error('Failed to save media to device')
    }
  }

  // UTILITY METHODS
  setCameraRef(ref: Camera.CameraView | null): void {
    this.cameraRef = ref
  }

  private getImagePickerMediaType(type: string): ImagePicker.MediaTypeOptions {
    switch (type) {
      case 'Images':
        return ImagePicker.MediaTypeOptions.Images
      case 'Videos':
        return ImagePicker.MediaTypeOptions.Videos
      case 'All':
        return ImagePicker.MediaTypeOptions.All
      default:
        return ImagePicker.MediaTypeOptions.Images
    }
  }

  // FORMAT UTILITIES
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // VALIDATION
  validateImageDimensions(width: number, height: number, maxWidth = 4096, maxHeight = 4096): boolean {
    return width <= maxWidth && height <= maxHeight
  }

  validateFileSize(size: number, maxSizeMB = 50): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return size <= maxSizeBytes
  }

  validateVideoLength(duration: number, maxDurationSeconds = 300): boolean {
    return duration <= maxDurationSeconds
  }
}

export const cameraService = new CameraService()
export default cameraService