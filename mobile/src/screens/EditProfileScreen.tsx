import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/authStore'
import MediaUpload from '../components/MediaUpload'
import mediaService, { MediaUploadOptions } from '../services/mediaService'

interface MediaItem {
  id: string
  uri: string
  type: 'image' | 'video'
  name?: string
}

const EditProfileScreen = () => {
  const navigation = useNavigation()
  const { user, updateUser } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [profileMedia, setProfileMedia] = useState<MediaItem[]>([])
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    favorite_tricks: user?.favorite_tricks?.join(', ') || '',
  })

  const handleMediaSelected = (media: MediaItem[]) => {
    setProfileMedia(media)
    console.log('Media selected:', media)
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // Upload media files if any
      let profileImageUrl = user?.profile_image_url
      
      if (profileMedia.length > 0) {
        const uploadOptions: MediaUploadOptions = {
          entityType: 'user',
          entityId: user?.id,
          category: 'profile'
        }
        
        // Upload the first image as profile picture
        const firstMedia = profileMedia[0]
        if (firstMedia.type === 'image') {
          try {
            const uploadResult = await mediaService.uploadMedia(
              firstMedia.uri,
              uploadOptions,
              firstMedia.name,
              'image/jpeg'
            )
            profileImageUrl = uploadResult.url
            console.log('Profile image uploaded:', uploadResult.url)
          } catch (uploadError) {
            console.error('Media upload failed:', uploadError)
            Alert.alert('Upload Error', 'Failed to upload profile image')
          }
        }
      }
      
      // Update user profile
      const updatedData = {
        bio: formData.bio,
        location: formData.location,
        favorite_tricks: formData.favorite_tricks.split(',').map(trick => trick.trim()).filter(Boolean),
        profile_image_url: profileImageUrl,
      }
      
      // Update local user state
      updateUser(updatedData)
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
      
    } catch (error) {
      console.error('Profile update error:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Picture Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <MediaUpload
            onMediaSelected={handleMediaSelected}
            maxItems={1}
            allowImages={true}
            allowVideos={false}
            existingMedia={profileMedia}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell others about yourself..."
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, State"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
          />
        </View>

        {/* Favorite Tricks */}
        <View style={styles.section}>
          <Text style={styles.label}>Favorite Tricks</Text>
          <TextInput
            style={styles.input}
            placeholder="Ollie, Kickflip, Heelflip..."
            value={formData.favorite_tricks}
            onChangeText={(text) => setFormData({ ...formData, favorite_tricks: text })}
          />
          <Text style={styles.hint}>Separate tricks with commas</Text>
        </View>

        {/* Media Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          <MediaUpload
            onMediaSelected={handleMediaSelected}
            maxItems={10}
            allowImages={true}
            allowVideos={true}
            existingMedia={[]}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40, // Account for status bar
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
})

export default EditProfileScreen