'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { usersApi, handleApiError } from '@/lib/api'
import { ArrowLeftIcon, UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' }
]

const COMMON_TRICKS = [
  'Ollie', 'Kickflip', 'Heelflip', 'Pop Shuvit', 'Frontside 180', 'Backside 180',
  'Tre Flip', 'Hardflip', 'Varial Kickflip', 'Backside Flip', 'Inward Heelflip',
  'Frontside Shuvit', 'Casper', 'Pogo', 'Rail Stand', 'Manual', 'Nose Manual',
  'Boardslide', 'Lipslide', '50-50 Grind', '5-0 Grind', 'Nosegrind', 'Tailslide',
  'Bluntslide', 'Feeble Grind', 'Smith Grind', 'Crooked Grind'
]

export default function EditProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    skill_level: '' as string,
    favorite_tricks: [] as string[],
    profile_image_url: '',
  })
  const [customTrick, setCustomTrick] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  // Fetch current profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
    enabled: !!isAuthenticated,
    retry: 2,
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data
      setFormData({
        bio: profile.bio || '',
        location: profile.location || '',
        skill_level: profile.skill_level || '',
        favorite_tricks: profile.favorite_tricks || [],
        profile_image_url: profile.profile_image_url || '',
      })
    }
  }, [profileData])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Profile updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      router.push(`/users/${response.data.id}`)
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error)
      setErrors({ general: errorMessage })
      toast.error('Failed to update profile')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleTrickToggle = (trick: string) => {
    setFormData(prev => ({
      ...prev,
      favorite_tricks: prev.favorite_tricks.includes(trick)
        ? prev.favorite_tricks.filter(t => t !== trick)
        : [...prev.favorite_tricks, trick]
    }))
  }

  const handleAddCustomTrick = () => {
    if (customTrick.trim() && !formData.favorite_tricks.includes(customTrick.trim())) {
      setFormData(prev => ({
        ...prev,
        favorite_tricks: [...prev.favorite_tricks, customTrick.trim()]
      }))
      setCustomTrick('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less'
    }
    
    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be 100 characters or less'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    
    const updateData: any = {}
    
    // Only include changed fields
    if (formData.bio !== (profileData?.data?.bio || '')) {
      updateData.bio = formData.bio || null
    }
    if (formData.location !== (profileData?.data?.location || '')) {
      updateData.location = formData.location || null
    }
    if (formData.skill_level !== (profileData?.data?.skill_level || '')) {
      updateData.skill_level = formData.skill_level || null
    }
    if (JSON.stringify(formData.favorite_tricks) !== JSON.stringify(profileData?.data?.favorite_tricks || [])) {
      updateData.favorite_tricks = formData.favorite_tricks.length > 0 ? formData.favorite_tricks : null
    }
    if (formData.profile_image_url !== (profileData?.data?.profile_image_url || '')) {
      updateData.profile_image_url = formData.profile_image_url || null
    }
    
    if (Object.keys(updateData).length === 0) {
      toast('No changes to save', { icon: 'ℹ️' })
      return
    }
    
    updateProfileMutation.mutate(updateData)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const profile = profileData?.data

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href={`/users/${profile?.id}`}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{errors.general}</div>
              </div>
            )}

            {/* Profile Image URL */}
            <div>
              <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                type="url"
                name="profile_image_url"
                id="profile_image_url"
                value={formData.profile_image_url}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="https://example.com/your-image.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to your profile image. We'll support file uploads soon!
              </p>
              
              {/* Image Preview */}
              {formData.profile_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.profile_image_url}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                name="bio"
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                maxLength={500}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.bio ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="Tell us about yourself, your skating style, what you're into..."
              />
              <div className="mt-1 flex justify-between">
                {errors.bio && (
                  <p className="text-sm text-red-600">{errors.bio}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                maxLength={100}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="e.g., San Francisco, CA"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Skill Level */}
            <div>
              <label htmlFor="skill_level" className="block text-sm font-medium text-gray-700">
                Skill Level
              </label>
              <select
                name="skill_level"
                id="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select skill level</option>
                {SKILL_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Favorite Tricks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Favorite Tricks
              </label>
              
              {/* Common tricks */}
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_TRICKS.map((trick) => (
                    <button
                      key={trick}
                      type="button"
                      onClick={() => handleTrickToggle(trick)}
                      className={`relative flex items-center justify-center px-3 py-2 text-sm border rounded-md transition-colors ${
                        formData.favorite_tricks.includes(trick)
                          ? 'bg-primary-100 border-primary-300 text-primary-800'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {trick}
                      {formData.favorite_tricks.includes(trick) && (
                        <CheckIcon className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom trick input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customTrick}
                  onChange={(e) => setCustomTrick(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTrick())}
                  className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Add a custom trick"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTrick}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add
                </button>
              </div>

              {/* Selected tricks */}
              {formData.favorite_tricks.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Selected tricks:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.favorite_tricks.map((trick) => (
                      <span
                        key={trick}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {trick}
                        <button
                          type="button"
                          onClick={() => handleTrickToggle(trick)}
                          className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Profile Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Add a bio to tell other skaters about yourself</li>
            <li>• Share your location to connect with local skaters</li>
            <li>• Select your favorite tricks to show your style</li>
            <li>• Upload a profile photo to make your profile more personal</li>
          </ul>
        </div>
      </div>
    </div>
  )
}