'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MapPinIcon, BuildingStorefrontIcon, UserGroupIcon, SparklesIcon, FireIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
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
    // For guest browse, we'll use a generic event tracking instead
    // since it's not a signup prompt
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50/30">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-neon/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Animated badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500/10 to-neon/10 border border-primary-500/20 rounded-full mb-8 animate-fade-in-up">
              <SparklesIcon className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-primary-700">Join the skateboarding revolution</span>
            </div>

            {/* Main heading */}
            <h1 className="text-6xl md:text-8xl font-black tracking-tight font-display mb-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <span className="bg-gradient-to-r from-dark-900 via-primary-600 to-neon bg-clip-text text-transparent">
                Bro
              </span>
              <span className="text-dark-900">Skate</span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-3xl text-xl md:text-2xl text-dark-600 font-medium leading-relaxed animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              Connect with your local skateboarding community. 
              <span className="bg-gradient-to-r from-primary-600 to-neon bg-clip-text text-transparent font-bold"> Discover epic spots</span>, 
              join shop crews, and share your passion for skating.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <Link
                href="/auth/register"
                onClick={() => handleSignupClick('hero_cta')}
                className="btn-primary text-lg px-10 py-4 shadow-2xl shadow-primary-500/25 group"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Get Started Free
              </Link>
              <Link
                href="/spots"
                onClick={handleGuestBrowseClick}
                className="btn-outline text-lg px-10 py-4 group"
              >
                <FireIcon className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Explore Spots
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">1000+</div>
                <div className="text-sm text-dark-500 mt-1">Skate Spots</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-neon">500+</div>
                <div className="text-sm text-dark-500 mt-1">Active Skaters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sunset">50+</div>
                <div className="text-sm text-dark-500 mt-1">Local Shops</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-dark-50/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-neon/10 to-primary-500/10 border border-neon/20 rounded-full mb-6">
              <span className="text-sm font-semibold text-neon">🔥 FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-dark-900 font-display mb-6">
              Everything you need to 
              <span className="bg-gradient-to-r from-primary-600 to-neon bg-clip-text text-transparent"> dominate</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-dark-600 font-medium">
              BroSkate brings together skaters, shops, and spots in one powerful platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Discover Spots */}
            <div className="group relative">
              <div className="card-hover p-10 text-center h-full bg-gradient-to-br from-white to-primary-50/50 border-primary-100 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-500/10">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform duration-300">
                    <MapPinIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon rounded-full animate-glow-pulse opacity-75" />
                </div>
                
                <h3 className="mt-8 text-2xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-300">
                  Discover Epic Spots
                </h3>
                <p className="mt-4 text-dark-600 leading-relaxed">
                  Find legendary skate spots with detailed info, difficulty ratings, and real photos from the community.
                </p>
                
                <div className="mt-8">
                  <Link 
                    href="/spots"
                    className="inline-flex items-center font-semibold text-primary-600 hover:text-primary-700 group-hover:underline transition-all duration-300"
                  >
                    Explore Spots 
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Join Shop Communities */}
            <div className="group relative">
              <div className="card-hover p-10 text-center h-full bg-gradient-to-br from-white to-neon/10 border-neon/20 hover:border-neon/40 hover:shadow-2xl hover:shadow-neon/10">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-neon to-glow rounded-2xl flex items-center justify-center shadow-lg shadow-neon/30 group-hover:scale-110 transition-transform duration-300">
                    <BuildingStorefrontIcon className="w-10 h-10 text-dark-900" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full animate-glow-pulse opacity-75" />
                </div>
                
                <h3 className="mt-8 text-2xl font-bold text-dark-900 group-hover:text-neon transition-colors duration-300">
                  Join Shop Crews
                </h3>
                <p className="mt-4 text-dark-600 leading-relaxed">
                  Connect with local skate shops, join exclusive crews, and stay updated on events and sessions.
                </p>
                
                <div className="mt-8">
                  <Link 
                    href="/shops"
                    className="inline-flex items-center font-semibold text-neon hover:text-glow group-hover:underline transition-all duration-300"
                  >
                    Find Shops 
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Build Community */}
            <div className="group relative">
              <div className="card-hover p-10 text-center h-full bg-gradient-to-br from-white to-sunset/10 border-sunset/20 hover:border-sunset/40 hover:shadow-2xl hover:shadow-sunset/10">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-sunset to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sunset/30 group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-500 rounded-full animate-glow-pulse opacity-75" />
                </div>
                
                <h3 className="mt-8 text-2xl font-bold text-dark-900 group-hover:text-sunset transition-colors duration-300">
                  Build Community
                </h3>
                <p className="mt-4 text-dark-600 leading-relaxed">
                  Follow other skaters, share epic sessions, and become part of the global skateboarding movement.
                </p>
                
                <div className="mt-8">
                  <Link 
                    href="/auth/register"
                    className="inline-flex items-center font-semibold text-sunset hover:text-secondary-600 group-hover:underline transition-all duration-300"
                  >
                    Join Community 
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="relative overflow-hidden bg-gradient-dark text-white">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" style={{backgroundSize: '50px 50px'}} />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-neon/10 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500/20 to-neon/20 border border-primary-500/30 rounded-full mb-8">
              <span className="text-sm font-semibold text-primary-300">🚀 JOIN NOW</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black tracking-tight font-display mb-6">
              Ready to 
              <span className="bg-gradient-to-r from-primary-400 via-neon to-primary-400 bg-clip-text text-transparent"> shred</span>?
            </h2>
            
            <p className="mx-auto mt-8 max-w-3xl text-xl text-gray-300 font-medium leading-relaxed">
              No barriers, no gatekeeping. Just pure skateboarding culture and endless progression.
              <span className="text-neon font-bold"> Your next session starts here.</span>
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/auth/register"
                className="btn-neon text-lg px-12 py-4 shadow-2xl shadow-neon/25 group"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Sign Up Free
              </Link>
              <Link
                href="/spots"
                className="btn-outline border-white/30 text-white hover:bg-white hover:text-dark-900 text-lg px-12 py-4 group backdrop-blur-sm"
              >
                <FireIcon className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Browse as Guest
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full border-2 border-white/20" />
                  <div className="w-8 h-8 bg-neon rounded-full border-2 border-white/20" />
                  <div className="w-8 h-8 bg-sunset rounded-full border-2 border-white/20" />
                </div>
                <span className="ml-3">500+ skaters already joined</span>
              </div>
              <div>⭐ ⭐ ⭐ ⭐ ⭐ Rated 5/5 by the community</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}