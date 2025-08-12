'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { 
  Bars3Icon, 
  XMarkIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  UserCircleIcon,
  UsersIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()

  const navigation = [
    { name: 'Spots', href: '/spots', icon: MapPinIcon },
    { name: 'Shops', href: '/shops', icon: BuildingStorefrontIcon },
    { name: 'Skaters', href: '/skaters', icon: UsersIcon },
  ]

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-xl shadow-black/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Modern Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-neon rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-black text-sm">BS</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon rounded-full animate-glow-pulse opacity-75" />
              </div>
              <span className="font-display font-black text-2xl bg-gradient-to-r from-dark-900 to-primary-600 bg-clip-text text-transparent">
                BroSkate
              </span>
            </Link>
          </div>

          {/* Modern Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center space-x-2 text-dark-600 hover:text-primary-600 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:bg-primary-50/80"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  href="/shops/add"
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary-500/25"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Shop</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-dark-600 hover:text-primary-600 px-3 py-2 text-sm font-medium rounded-xl hover:bg-dark-50/80 transition-all duration-300"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="max-w-20 truncate">{user?.username}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-dark-500 hover:text-dark-700 px-3 py-2 text-sm font-medium rounded-xl hover:bg-dark-50/80 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  href="/auth/login"
                  className="text-dark-600 hover:text-primary-600 px-4 py-2 text-sm font-semibold rounded-xl hover:bg-primary-50/80 transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 px-6 py-2 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary-500/25"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            <div className="pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/shops/add"
                    className="flex items-center space-x-2 bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 text-base font-medium rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Shop</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>{user?.username}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/auth/login"
                    className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 text-base font-medium rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}