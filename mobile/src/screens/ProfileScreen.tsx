import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/authStore'

const ProfileScreen = () => {
  const navigation = useNavigation()
  const { user, isGuest, logout } = useAuthStore()

  if (isGuest) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>You're browsing as a guest</Text>
        <Text style={styles.guestInfo}>
          Sign up to save spots, connect with skaters, and unlock all features!
        </Text>
        
        <TouchableOpacity style={styles.signUpButton} onPress={logout}>
          <Text style={styles.signUpButtonText}>Sign Up / Log In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Welcome, {user?.username}!</Text>
      
      <View style={styles.profileActions}>
        <TouchableOpacity
          style={styles.eventsButton}
          onPress={() => navigation.navigate('EventManagement' as never)}
        >
          <Ionicons name="calendar" size={20} color="#22c55e" />
          <Text style={styles.eventsButtonText}>Manage Events</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  guestInfo: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 32,
    lineHeight: 20,
  },
  signUpButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  signUpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileActions: {
    gap: 16,
  },
  eventsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  eventsButtonText: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
})

export default ProfileScreen