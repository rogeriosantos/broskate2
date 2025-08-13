import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'

interface MediaItem {
  id: string
  uri: string
  type: 'image' | 'video'
  name?: string
}

interface MediaUploadProps {
  onMediaSelected: (media: MediaItem[]) => void
  maxItems?: number
  allowImages?: boolean
  allowVideos?: boolean
  existingMedia?: MediaItem[]
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelected,
  maxItems = 5,
  allowImages = true,
  allowVideos = true,
  existingMedia = [],
}) => {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia)
  const [isUploading, setIsUploading] = useState(false)

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to upload photos and videos.'
      )
      return false
    }
    return true
  }

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: allowImages && allowVideos 
          ? ImagePicker.MediaTypeOptions.All 
          : allowImages 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 30,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const newMediaItem: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          name: asset.fileName,
        }
        
        const updatedMedia = [...media, newMediaItem]
        setMedia(updatedMedia)
        onMediaSelected(updatedMedia)
      }
    } catch (error) {
      console.error('Camera error:', error)
      Alert.alert('Error', 'Failed to capture media')
    }
  }

  const pickFromLibrary = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: allowImages && allowVideos 
          ? ImagePicker.MediaTypeOptions.All 
          : allowImages 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        videoMaxDuration: 30,
      })

      if (!result.canceled && result.assets) {
        const newMediaItems: MediaItem[] = result.assets.map((asset, index) => ({
          id: (Date.now() + index).toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          name: asset.fileName,
        }))
        
        const updatedMedia = [...media, ...newMediaItems].slice(0, maxItems)
        setMedia(updatedMedia)
        onMediaSelected(updatedMedia)
      }
    } catch (error) {
      console.error('Library error:', error)
      Alert.alert('Error', 'Failed to pick media')
    }
  }

  const removeMedia = (id: string) => {
    const updatedMedia = media.filter(item => item.id !== id)
    setMedia(updatedMedia)
    onMediaSelected(updatedMedia)
  }

  const showMediaPicker = () => {
    Alert.alert(
      'Select Media',
      'Choose how you want to add media',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: pickFromCamera },
        { text: 'Library', onPress: pickFromLibrary },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media</Text>
        <Text style={styles.subtitle}>{media.length}/{maxItems}</Text>
      </View>

      {media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
          {media.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
              {item.type === 'video' && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="play" size={16} color="white" />
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMedia(item.id)}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {media.length < maxItems && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={showMediaPicker}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#22c55e" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#22c55e" />
              <Text style={styles.uploadText}>Add Media</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.hint}>
        {allowImages && allowVideos
          ? 'Add photos or videos (max 30s)'
          : allowImages
          ? 'Add photos'
          : 'Add videos (max 30s)'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  mediaContainer: {
    marginBottom: 12,
  },
  mediaItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
})

export default MediaUpload