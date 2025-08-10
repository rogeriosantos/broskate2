'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { shopsApi, handleApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth'

interface Shop {
  id: number
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  instagram?: string
  owner_id: number
  created_at: string
}

export default function ShopDetailsPage() {
  const params = useParams()
  const shopId = parseInt(params.id as string)
  const { isAuthenticated } = useAuthStore()

  const { data: shopData, isLoading, error } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopsApi.getShop(shopId),
    retry: 2,
  })

  const shop: Shop = shopData?.data

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Shop Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error ? handleApiError(error) : 'This shop could not be found'}
          </p>
          <Link 
            href="/shops"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Shops
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/shops" className="text-blue-600 hover:underline">
          ← Back to Shops
        </Link>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
            {shop.address && (
              <p className="text-gray-600 flex items-center">
                📍 {shop.address}
              </p>
            )}
          </div>
          
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
              <p className="text-sm mb-2">Want to connect?</p>
              <Link 
                href="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {shop.description && (
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700">{shop.description}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shop.phone && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📞</span>
              <a 
                href={`tel:${shop.phone}`}
                className="text-blue-600 hover:underline"
              >
                {shop.phone}
              </a>
            </div>
          )}
          
          {shop.website && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">🌐</span>
              <a 
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
          
          {shop.instagram && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📸</span>
              <a 
                href={`https://instagram.com/${shop.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @{shop.instagram}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Map Section (Placeholder) */}
      {shop.latitude && shop.longitude && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600">Map view coming soon</p>
              <p className="text-sm text-gray-500">
                Lat: {shop.latitude.toFixed(4)}, Lng: {shop.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Community Features - Guest Prompts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Community Features</h2>
        
        {isAuthenticated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
              Join Shop Community
            </button>
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
              Check In Here
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Join to unlock community features</h3>
            <p className="text-gray-600 mb-6">
              Connect with other skaters, join the shop community, and share your experiences
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
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Related Shops */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Discover More Shops</h2>
        <Link 
          href="/shops"
          className="inline-flex items-center text-blue-600 hover:underline"
        >
          Browse all shops →
        </Link>
      </div>
    </div>
  )
}