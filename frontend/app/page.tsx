'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MapPinIcon, BuildingStorefrontIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useGuestAnalytics } from '@/lib/hooks/useGuestAnalytics'

export default function HomePage() {
  const { trackPageView, trackSignupPromptClick } = useGuestAnalytics()

  useEffect(() => {
    trackPageView('/')
  }, [trackPageView])

  const handleSignupClick = (location: string) => {
    trackSignupPromptClick('button', location, 'signup')
  }

  const handleGuestBrowseClick = () => {
    trackSignupPromptClick('button', 'hero_cta', 'guest_browse')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-skateboard text-white">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-display">
              Welcome to{' '}
              <span className="text-primary-300">BroSkate</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-200">
              Connect with your local skateboarding community. Discover spots, 
              join shop crews, and share your passion for skating.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/auth/register"
                onClick={() => handleSignupClick('hero_cta')}
                className="btn-primary text-lg px-8 py-3"
              >
                Get Started
              </Link>
              <Link
                href="/spots"
                onClick={handleGuestBrowseClick}
                className="btn-outline border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-3"
              >
                Browse Spots
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl font-display">
              Everything you need to skate
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              BroSkate brings together skaters, shops, and spots in one place
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Discover Spots */}
            <div className="card p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <MapPinIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Discover Spots
              </h3>
              <p className="mt-4 text-gray-600">
                Find skate spots near you with detailed info, photos, and difficulty ratings. 
                Add new spots to help grow the community.
              </p>
              <Link 
                href="/spots"
                className="mt-6 inline-block text-primary-600 hover:text-primary-700 font-medium"
              >
                Explore Spots →
              </Link>
            </div>

            {/* Join Shop Communities */}
            <div className="card p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                <BuildingStorefrontIcon className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Join Shop Communities
              </h3>
              <p className="mt-4 text-gray-600">
                Connect with your local skate shops, join their communities, 
                and stay updated on events and sessions.
              </p>
              <Link 
                href="/shops"
                className="mt-6 inline-block text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Find Shops →
              </Link>
            </div>

            {/* Build Community */}
            <div className="card p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Build Community
              </h3>
              <p className="mt-4 text-gray-600">
                Follow other skaters, share your sessions, and be part of 
                the global skateboarding community.
              </p>
              <Link 
                href="/auth/register"
                className="mt-6 inline-block text-green-600 hover:text-green-700 font-medium"
              >
                Join Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight font-display">
              Ready to join the community?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
              No barriers, no gatekeeping. Just pure skateboarding culture.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="btn-primary text-lg px-8 py-3"
              >
                Sign Up Free
              </Link>
              <Link
                href="/spots"
                className="btn-ghost text-white hover:bg-gray-800 text-lg px-8 py-3"
              >
                Browse as Guest
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}