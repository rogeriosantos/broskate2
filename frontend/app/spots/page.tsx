'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { spotsApi, handleApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth'

interface Spot {
  id: number
  name: string
  description?: string
  address?: string
  latitude: number
  longitude: number
  spot_type: string
  difficulty_level: number
  features?: string[]
  approved: boolean
  created_by: number
  created_at: string
}

const SPOT_TYPES = [
  'street', 'park', 'bowl', 'vert', 'mini_ramp', 'ledge', 'stair', 'rail', 'gap', 'other'
]

const DIFFICULTY_LABELS: { [key: number]: string } = {
  1: 'Beginner',
  2: 'Intermediate', 
  3: 'Advanced',
  4: 'Expert',
  5: 'Pro'
}

export default function SpotsPage() {
  const { isAuthenticated } = useAuthStore()
  const [page, setPage] = useState(1)
  const [spotType, setSpotType] = useState<string>('')
  const [difficultyLevel, setDifficultyLevel] = useState<number | ''>('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Get user location for nearby spots
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const { data: spotsData, isLoading, error } = useQuery({
    queryKey: ['spots', page, spotType, difficultyLevel, location],
    queryFn: () => spotsApi.getSpots({
      page,
      limit: 12,
      latitude: location?.lat,
      longitude: location?.lng,
      radius_km: location ? 50 : undefined,
      spot_type: spotType || undefined,
      difficulty_level: difficultyLevel || undefined,
      approved_only: true // Only show approved spots for guests
    }),
    retry: 2,
  })

  const spots = spotsData?.data?.spots || []
  const totalPages = Math.ceil((spotsData?.data?.total || 0) / 12)

  const getDifficultyColor = (level: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Skate Spots</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Skate Spots</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load spots</p>
          <p className="text-gray-600">{handleApiError(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Skate Spots</h1>
          <p className="text-gray-600">
            {location ? 'Find skate spots near you' : 'Discover amazing skate spots worldwide'}
          </p>
        </div>
        
        {/* Add Spot Button for authenticated users */}
        {isAuthenticated ? (
          <Link 
            href="/spots/add"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + Add Spot
          </Link>
        ) : (
          /* Guest Sign Up Prompt */
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
            <p className="text-sm mb-2">Know a spot?</p>
            <Link 
              href="/auth/register"
              className="bg-white text-green-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Add Spot
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spot Type
            </label>
            <select
              value={spotType}
              onChange={(e) => setSpotType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {SPOT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => (
                <option key={level} value={level}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSpotType('')
                setDifficultyLevel('')
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Location Status */}
      {location && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="text-sm">📍 Showing spots near your location</p>
        </div>
      )}

      {/* Spots Grid */}
      {spots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛹</div>
          <h3 className="text-xl font-semibold mb-2">No spots found</h3>
          <p className="text-gray-600 mb-6">
            {spotType || difficultyLevel 
              ? 'Try adjusting your filters to see more spots'
              : location 
                ? 'No spots found near your location'
                : 'No spots available yet'
            }
          </p>
          {!isAuthenticated && (
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Be the first to add a spot!
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {spots.map((spot: Spot) => (
              <div key={spot.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{spot.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(spot.difficulty_level)}`}>
                      {DIFFICULTY_LABELS[spot.difficulty_level]}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">
                      {spot.spot_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  {spot.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{spot.description}</p>
                  )}
                  
                  {spot.address && (
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      📍 {spot.address}
                    </p>
                  )}
                  
                  {spot.features && spot.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {spot.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                      {spot.features.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{spot.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <Link 
                    href={`/spots/${spot.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
                
                {/* Guest Action Prompt */}
                {!isAuthenticated && (
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <p className="text-sm text-gray-600">
                      <Link href="/auth/register" className="text-blue-600 hover:underline">
                        Sign up
                      </Link> to check in and share photos
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom Guest CTA */}
      {!isAuthenticated && spots.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to skate?</h3>
          <p className="text-gray-300 mb-6">
            Check in at spots, share photos, and connect with the local skate scene
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up Free
            </Link>
            <Link 
              href="/auth/login"
              className="border border-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}