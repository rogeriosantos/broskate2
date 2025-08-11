'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { spotsApi, handleApiError } from '@/lib/api'
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SPOT_TYPES = [
  { value: 'street', label: 'Street' },
  { value: 'park', label: 'Skate Park' },
  { value: 'vert', label: 'Vert Ramp' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'mini_ramp', label: 'Mini Ramp' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'rail', label: 'Rail' },
  { value: 'ledge', label: 'Ledge' },
  { value: 'gap', label: 'Gap' },
  { value: 'other', label: 'Other' }
]

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' }
]

export default function AddSpotPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    spot_type: 'street' as string,
    difficulty_level: 3,
    features: [] as string[],
  })
  const [featureInput, setFeatureInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }))
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }))
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success('Location captured!')
        },
        (error) => {
          toast.error('Unable to get location. Please enter coordinates manually.')
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Spot name is required'
    }
    
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Location coordinates are required'
    } else {
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90'
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180'
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})
    
    try {
      const spotData = {
        name: formData.name,
        description: formData.description || undefined,
        address: formData.address || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        spot_type: formData.spot_type,
        difficulty_level: formData.difficulty_level,
        features: formData.features.length > 0 ? formData.features : undefined,
      }
      
      const response = await spotsApi.createSpot(spotData)
      
      toast.success('Skate spot created successfully!')
      router.push(`/spots/${response.data.id}`)
      
    } catch (error: any) {
      console.error('Create spot error:', error)
      const errorMessage = handleApiError(error)
      setErrors({ general: errorMessage })
      toast.error('Failed to create spot')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/spots"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Spots
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Skate Spot</h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{errors.general}</div>
              </div>
            )}

            {/* Spot Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Spot Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="Enter spot name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Describe the spot, what makes it special..."
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Street address or nearby landmark"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-xs font-medium text-gray-500 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    id="latitude"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.latitude ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="e.g., 40.7128"
                  />
                  {errors.latitude && (
                    <p className="mt-1 text-xs text-red-600">{errors.latitude}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs font-medium text-gray-500 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    id="longitude"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.longitude ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="e.g., -74.0060"
                  />
                  {errors.longitude && (
                    <p className="mt-1 text-xs text-red-600">{errors.longitude}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <MapPinIcon className="h-4 w-4 mr-1" />
                Use Current Location
              </button>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Spot Type */}
            <div>
              <label htmlFor="spot_type" className="block text-sm font-medium text-gray-700">
                Spot Type
              </label>
              <select
                name="spot_type"
                id="spot_type"
                value={formData.spot_type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {SPOT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
                Difficulty Level
              </label>
              <select
                name="difficulty_level"
                id="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.value} - {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., handrail, stairs, ledge"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add
                </button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove {feature}</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Spot...
                  </>
                ) : (
                  'Create Spot'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}