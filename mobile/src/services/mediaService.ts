import { api } from './api'

export interface MediaUploadResponse {
  id: string
  url: string
  thumbnail_url?: string
  file_type: string
  file_size: number
  upload_date: string
  file_name: string
  entity_type: string
  entity_id?: number
  category: string
  uploaded_by: number
}

export interface MediaUploadOptions {
  entityType: 'user' | 'spot' | 'shop' | 'event'
  entityId?: number
  category?: string // 'profile', 'gallery', 'cover', etc.
}

class MediaService {
  private async createFormData(uri: string, fileName?: string, type?: string): Promise<FormData> {
    const formData = new FormData()
    
    // Get file info
    const fileExtension = uri.split('.').pop()
    const mimeType = type || (fileExtension === 'mp4' ? 'video/mp4' : 'image/jpeg')
    const name = fileName || `upload_${Date.now()}.${fileExtension}`
    
    // Append file
    formData.append('file', {
      uri,
      type: mimeType,
      name,
    } as any)
    
    return formData
  }

  async uploadMedia(
    uri: string,
    options: MediaUploadOptions,
    fileName?: string,
    type?: string
  ): Promise<MediaUploadResponse> {
    try {
      const formData = await this.createFormData(uri, fileName, type)
      
      // Add metadata
      formData.append('entity_type', options.entityType)
      if (options.entityId) {
        formData.append('entity_id', options.entityId.toString())
      }
      if (options.category) {
        formData.append('category', options.category)
      }
      
      const response = await api.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for file uploads
      })
      
      return response.data.data
    } catch (error) {
      console.error('Media upload error:', error)
      throw new Error('Failed to upload media')
    }
  }

  async uploadMultipleMedia(
    mediaItems: { uri: string; fileName?: string; type?: string }[],
    options: MediaUploadOptions
  ): Promise<MediaUploadResponse[]> {
    try {
      const uploads = mediaItems.map(item => 
        this.uploadMedia(item.uri, options, item.fileName, item.type)
      )
      
      return await Promise.all(uploads)
    } catch (error) {
      console.error('Multiple media upload error:', error)
      throw new Error('Failed to upload media files')
    }
  }

  async deleteMedia(mediaId: string): Promise<void> {
    try {
      await api.delete(`/api/media/${mediaId}`)
    } catch (error) {
      console.error('Media delete error:', error)
      throw new Error('Failed to delete media')
    }
  }

  async getMediaByEntity(
    entityType: string,
    entityId: number,
    category?: string
  ): Promise<MediaUploadResponse[]> {
    try {
      const params: any = {
        entity_type: entityType,
        entity_id: entityId,
      }
      
      if (category) {
        params.category = category
      }
      
      const response = await api.get('/api/media', { params })
      return response.data.data || []
    } catch (error) {
      console.error('Get media error:', error)
      return []
    }
  }

  // Helper method to get optimized image URL
  getOptimizedImageUrl(url: string, width?: number, height?: number): string {
    if (!width && !height) return url
    
    const params = new URLSearchParams()
    if (width) params.append('w', width.toString())
    if (height) params.append('h', height.toString())
    
    return `${url}?${params.toString()}`
  }

  // Helper method to check if file is supported
  isSupportedFileType(fileName: string): boolean {
    const supportedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      // Videos
      'mp4', 'mov', 'avi', 'mkv'
    ]
    
    const extension = fileName.toLowerCase().split('.').pop()
    return extension ? supportedExtensions.includes(extension) : false
  }

  // Helper method to get file size estimate
  async getFileSize(uri: string): Promise<number> {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      return blob.size
    } catch (error) {
      console.error('Get file size error:', error)
      return 0
    }
  }
}

export const mediaService = new MediaService()
export default mediaService