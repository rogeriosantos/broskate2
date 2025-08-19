'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { shopsApi, handleApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/stores/auth';

interface Shop {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  owner_id: number;
  created_at: string;
}

export default function ShopsPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location for nearby shops
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const {
    data: shopsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shops', page, location],
    queryFn: () =>
      shopsApi.getShops({
        page,
        limit: 12,
        // Temporarily disable location filtering to test
        // latitude: location?.lat,
        // longitude: location?.lng,
        // radius_km: location ? 50 : undefined,
      }),
    retry: 2,
  });

  const shops = shopsData?.data || [];
  const totalPages = Math.ceil((shops.length || 0) / 12); // Since we don't have total from API, use array length

  // Debug: Log the data being received
  console.log('🔍 Shops Debug:', {
    shopsData,
    shops,
    isLoading,
    error
  });

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Skate Shops</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-gray-200 animate-pulse rounded-lg h-64'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Skate Shops</h1>
        <div className='text-center py-12'>
          <p className='text-red-600 mb-4'>Failed to load shops</p>
          <p className='text-gray-600'>{handleApiError(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>Skate Shops</h1>
          <p className='text-gray-600'>{location ? 'Find skate shops near you' : 'Discover skate shops around the world'}</p>
        </div>

        {/* Guest Sign Up Prompt */}
        {!isAuthenticated && (
          <div className='bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg'>
            <p className='text-sm mb-2'>Want to add your shop?</p>
            <Link
              href='/auth/register'
              className='bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors'
            >
              Sign Up Free
            </Link>
          </div>
        )}
      </div>

      {/* Location Status */}
      {location && (
        <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6'>
          <p className='text-sm'>📍 Showing shops near your location</p>
        </div>
      )}

      {/* Shops Grid */}
      {shops.length === 0 ? (
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>🛹</div>
          <h3 className='text-xl font-semibold mb-2'>No shops found</h3>
          <p className='text-gray-600 mb-6'>{location ? 'No shops found near your location' : 'No shops available yet'}</p>
          {!isAuthenticated && (
            <Link href='/auth/register' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
              Be the first to add a shop!
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            {shops.map((shop: Shop) => (
              <div key={shop.id} className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden'>
                <div className='p-6'>
                  <h3 className='text-xl font-semibold mb-2'>{shop.name}</h3>
                  {shop.description && <p className='text-gray-600 mb-3 line-clamp-2'>{shop.description}</p>}
                  {shop.address && <p className='text-sm text-gray-500 mb-3 flex items-center'>📍 {shop.address}</p>}
                  <div className='flex justify-between items-center'>
                    <Link href={`/shops/${shop.id}`} className='text-blue-600 hover:text-blue-800 font-medium'>
                      View Details →
                    </Link>
                    {shop.instagram && (
                      <a
                        href={`https://instagram.com/${shop.instagram}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-pink-600 hover:text-pink-800'
                      >
                        📸 IG
                      </a>
                    )}
                  </div>
                </div>

                {/* Guest Action Prompt */}
                {!isAuthenticated && (
                  <div className='bg-gray-50 px-6 py-3 border-t'>
                    <p className='text-sm text-gray-600'>
                      <Link href='/auth/register' className='text-blue-600 hover:underline'>
                        Sign up
                      </Link>{' '}
                      to connect with this shop
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center space-x-2'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Previous
              </button>
              <span className='px-4 py-2'>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom Guest CTA */}
      {!isAuthenticated && shops.length > 0 && (
        <div className='mt-12 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-8 text-center'>
          <h3 className='text-2xl font-bold mb-2'>Ready to join the community?</h3>
          <p className='text-gray-300 mb-6'>Connect with shops, discover spots, and share your skating journey</p>
          <div className='space-x-4'>
            <Link href='/auth/register' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
              Sign Up Free
            </Link>
            <Link href='/auth/login' className='border border-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors'>
              Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
