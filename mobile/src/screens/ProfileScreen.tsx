import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../stores/authStore'

const ProfileScreen = () => {
  const { user, logout } = useAuthStore()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Welcome, {user?.username}!</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
})

export default ProfileScreen