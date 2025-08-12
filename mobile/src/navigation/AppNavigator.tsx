import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuthStore } from '../stores/authStore'
import { Ionicons } from '@expo/vector-icons'

// Screens
import DiscoverScreen from '../screens/DiscoverScreen'
import SpotsScreen from '../screens/SpotsScreen'
import SpotDetailScreen from '../screens/SpotDetailScreen'
import ShopsScreen from '../screens/ShopsScreen'
import ShopDetailScreen from '../screens/ShopDetailScreen'
import ProfileScreen from '../screens/ProfileScreen'
import MapScreen from '../screens/MapScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import AddSpotScreen from '../screens/AddSpotScreen'
import AddShopScreen from '../screens/AddShopScreen'

export type RootStackParamList = {
  // Auth
  Login: undefined
  Register: undefined
  
  // Main App
  MainTabs: undefined
  
  // Details
  SpotDetail: { spotId: number }
  ShopDetail: { shopId: number }
  UserProfile: { userId: number }
  
  // Add/Edit
  AddSpot: undefined
  AddShop: undefined
  EditProfile: undefined
}

export type TabParamList = {
  Discover: undefined
  Spots: undefined
  Shops: undefined
  Map: undefined
  Profile: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'Spots') {
            iconName = focused ? 'location' : 'location-outline'
          } else if (route.name === 'Shops') {
            iconName = focused ? 'storefront' : 'storefront-outline'
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#22c55e', // Primary green
        tabBarInactiveTintColor: '#64748b', // Gray
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#22c55e',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Spots" component={SpotsScreen} />
      <Tab.Screen name="Shops" component={ShopsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#22c55e',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Login to BroSkate' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Join BroSkate' }}
      />
    </Stack.Navigator>
  )
}

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading screen while checking authentication
  if (isLoading) {
    return null // Could return a loading component here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen 
              name="SpotDetail" 
              component={SpotDetailScreen}
              options={{
                headerShown: true,
                title: 'Spot Details',
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: 'white',
              }}
            />
            <Stack.Screen 
              name="ShopDetail" 
              component={ShopDetailScreen}
              options={{
                headerShown: true,
                title: 'Shop Details',
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: 'white',
              }}
            />
            <Stack.Screen 
              name="AddSpot" 
              component={AddSpotScreen}
              options={{
                headerShown: true,
                title: 'Add Spot',
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: 'white',
              }}
            />
            <Stack.Screen 
              name="AddShop" 
              component={AddShopScreen}
              options={{
                headerShown: true,
                title: 'Add Shop',
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: 'white',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator