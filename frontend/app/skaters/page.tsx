'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usersApi, handleApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth'
import { MagnifyingGlassIcon, UserIcon, MapPinIcon, StarIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface User {
  id: number
  username: string
  profile_image_url?: string
  bio?: string
  location?: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'pro'
  favorite_tricks?: string[]
  created_at: string
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' }
]

const SKILL_LEVEL_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-orange-100 text-orange-800',
  pro: 'bg-red-100 text-red-800'
}

export default function SkatersPage() {
  const { isAuthenticated } = useAuthStore()
  const [page, setPage] = useState(1)
  const [skillLevel, setSkillLevel] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', page, skillLevel, location, search],
    queryFn: () => usersApi.getUsers({
      page,
      limit: 12,
      skill_level: skillLevel || undefined,
      location: location || undefined,
      search: search || undefined,
    }),
    retry: 2,
  })

  const users = usersData?.data?.users || []
  const totalPages = Math.ceil((usersData?.data?.total || 0) / 12)

  const getJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Skaters</h1>
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
        <h1 className="text-3xl font-bold mb-8">Skaters</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load skaters</p>
          <p className="text-gray-600">{handleApiError(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Skaters</h1>
          <p className="text-gray-600">
            Connect with skaters from around the world
          </p>
        </div>
        
        {/* Join Community CTA for guests */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-lg shadow-lg">
            <p className="text-sm mb-2">Join the community</p>
            <Link 
              href="/auth/register"
              className="bg-white text-purple-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search skaters..."
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Skill Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Level
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {SKILL_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City or region..."
            />
          </div>
          
          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('')
                setSkillLevel('')
                setLocation('')
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No skaters found</h3>
          <p className="text-gray-600 mb-6">
            {search || skillLevel || location 
              ? 'Try adjusting your filters to see more skaters'
              : 'No skaters have signed up yet'
            }
          </p>
          {!isAuthenticated && (
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Be the first to join!
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {users.map((user: User) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  {/* Profile Section */}
                  <div className="flex items-center space-x-4 mb-4">
                    {user.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={user.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-100">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          @{user.username}
                        </h3>
                        {user.skill_level && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${SKILL_LEVEL_COLORS[user.skill_level]}`}>
                            <StarIcon className="w-3 h-3 inline mr-1" />
                            {SKILL_LEVELS.find(s => s.value === user.skill_level)?.label}
                          </span>
                        )}
                      </div>
                      
                      {user.location && (
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {user.location}
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-400">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        Joined {getJoinedDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  {/* Favorite Tricks */}
                  {user.favorite_tricks && user.favorite_tricks.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Favorite Tricks</p>
                      <div className="flex flex-wrap gap-1">
                        {user.favorite_tricks.slice(0, 3).map((trick, index) => (
                          <span key={index} className="bg-primary-100 text-primary-800 px-2 py-1 text-xs rounded">
                            {trick}
                          </span>
                        ))}
                        {user.favorite_tricks.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{user.favorite_tricks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* View Profile Link */}
                  <Link 
                    href={`/users/${user.id}`}
                    className="block text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </Link>
                </div>
                
                {/* Guest Action Prompt */}
                {!isAuthenticated && (
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <p className="text-sm text-gray-600">
                      <Link href="/auth/register" className="text-blue-600 hover:underline">
                        Sign up
                      </Link> to connect and follow skaters
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
      {!isAuthenticated && users.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Join the Community</h3>
          <p className="text-purple-100 mb-6">
            Connect with skaters, share your skills, and discover new spots together
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/register"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign Up Free
            </Link>
            <Link 
              href="/auth/login"
              className="border border-purple-300 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}