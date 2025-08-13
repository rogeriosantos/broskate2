'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { shopsApi, handleApiError } from '@/lib/api'
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AddShopPage() {
  // Prevent SSR execution of client-side code
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    contact_email: '',
    website_url: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
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
      newErrors.name = 'Shop name is required'
    }
    
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address'
    }
    
    if (formData.website_url && !formData.website_url.match(/^https?:\/\/.+/)) {
      newErrors.website_url = 'Please enter a valid URL starting with http:// or https://'
    }
    
    if (formData.latitude && formData.longitude) {
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
      const shopData: any = {
        name: formData.name,
        description: formData.description || undefined,
        address: formData.address || undefined,
        contact_email: formData.contact_email || undefined,
        website_url: formData.website_url || undefined,
      }
      
      // Only add coordinates if both are provided
      if (formData.latitude && formData.longitude) {
        shopData.latitude = parseFloat(formData.latitude)
        shopData.longitude = parseFloat(formData.longitude)
      }
      
      const response = await shopsApi.createShop(shopData)
      
      toast.success('Shop created successfully!')
      router.push(`/shops/${response.data.id}`)
      
    } catch (error: any) {
      console.error('Create shop error:', error)
      const errorMessage = handleApiError(error)
      setErrors({ general: errorMessage })
      toast.error('Failed to create shop')
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
            href="/shops"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Shops
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Skate Shop</h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{errors.general}</div>
              </div>
            )}

            {/* Shop Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Shop Name *
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
                placeholder="Enter shop name"
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
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Describe your shop, what you specialize in, your vibe..."
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
                placeholder="Street address"
              />
            </div>

            {/* Location (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Adding coordinates helps customers find your shop more easily
              </p>
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
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                id="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.contact_email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="contact@yourshop.com"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
              )}
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                name="website_url"
                id="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.website_url ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="https://yourshop.com"
              />
              {errors.website_url && (
                <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
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
                    Creating Shop...
                  </>
                ) : (
                  'Create Shop'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Shop Verification
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your shop will be reviewed by our team before being visible to all users. 
                  This usually takes 24-48 hours. You'll be notified once it's approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}