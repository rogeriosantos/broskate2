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
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BS</span>
              </div>
              <span className="font-display font-bold text-xl text-gray-900">
                BroSkate
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/shops/add"
                  className="flex items-center space-x-1 bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Shop</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn-ghost text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="btn-ghost text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-sm"
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