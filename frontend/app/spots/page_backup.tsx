'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { spotsApi, handleApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/stores/auth';

interface Spot {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  spot_type: string;
  difficulty_level: number;
  features?: string[];
  approved: boolean;
  created_by: number;
  created_at: string;
}

const SPOT_TYPES = ['street', 'park', 'bowl', 'vert', 'mini_ramp', 'ledge', 'stair', 'rail', 'gap', 'other'];

const DIFFICULTY_LABELS: { [key: number]: string } = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Pro',
};

export default function SpotsPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [spotType, setSpotType] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<number | ''>('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location for nearby spots
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
    data: spotsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['spots', page, spotType, difficultyLevel, location?.lat, location?.lng],
    queryFn: () =>
      spotsApi.getSpots({
        page,
        limit: 12,
        latitude: location?.lat,
        longitude: location?.lng,
        radius_km: location ? 50 : undefined,
        spot_type: spotType || undefined,
        difficulty_level: difficultyLevel || undefined,
        approved_only: false, // Show all spots (including unapproved) for now
      }),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const spots = spotsData?.data || [];
  
  // Ensure spots is an array
  const spotsArray = Array.isArray(spots) ? spots : [];
  
  // Use spots directly for now to debug
  const uniqueSpots = spotsArray;
  
  console.log('API Response:', spotsData);
  console.log('Spots array length:', spotsArray.length);
  console.log('All spots:', spotsArray);
  
  const totalPages = Math.ceil((uniqueSpots.length || 0) / 12);

  const getDifficultyColor = (level: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30'>
        <div className='container mx-auto px-4 py-8'>
          <div className='text-center mb-8'>
            <div className='inline-flex items-center px-4 py-2 bg-sky-100 rounded-full mb-4'>
              <span className='w-2 h-2 bg-sky-500 rounded-full animate-pulse mr-2'></span>
              <span className='text-sm font-semibold text-sky-700'>Loading Epic Spots</span>
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Skate Spots</h1>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='bg-white rounded-xl shadow-md overflow-hidden'>
                <div className='h-32 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse'></div>
                <div className='p-4'>
                  <div className='h-4 bg-gray-200 rounded animate-pulse mb-2'></div>
                  <div className='h-3 bg-gray-100 rounded animate-pulse mb-2'></div>
                  <div className='h-3 bg-gray-100 rounded animate-pulse w-2/3'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30'>
        <div className='container mx-auto px-4 py-12'>
          <div className='text-center max-w-lg mx-auto'>
            <div className='w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center'>
              <span className='text-2xl'>⚠️</span>
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>Oops! Something went wrong</h1>
            <p className='text-red-600 mb-4 font-medium'>Failed to load spots</p>
            <p className='text-gray-600 mb-8'>{handleApiError(error)}</p>
            <button 
              onClick={() => window.location.reload()} 
              className='bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/20'>
      <div className='container mx-auto px-4 py-6'>
        {/* Compact Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-100 to-emerald-100 border border-sky-200 rounded-full mb-4 shadow-sm'>
            <span className='text-sm font-bold text-sky-700 tracking-wide uppercase'>🛹 DISCOVER</span>
          </div>

          <h1 className='text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight'>
            Epic <span className='bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent'>Skate Spots</span>
          </h1>

          <p className='text-lg text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed'>
            {location ? 'Find legendary spots near you with GPS precision 📍' : 'Discover amazing skate spots from around the globe 🌍'}
          </p>

          {/* Compact Action Button */}
          {isAuthenticated ? (
            <Link 
              href='/spots/add' 
              className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group'
            >
              <span className='text-lg mr-2 group-hover:rotate-90 transition-transform duration-300'>+</span>
              Add Epic Spot
              <span className='ml-2 group-hover:translate-x-1 transition-transform duration-300'>🚀</span>
            </Link>
          ) : (
            <div className='bg-white border border-sky-100 rounded-xl p-4 max-w-sm mx-auto shadow-md hover:shadow-lg transition-shadow duration-300'>
              <div className='text-3xl mb-2'>🎯</div>
              <p className='text-gray-700 mb-4 font-semibold text-sm'>Know an epic spot?</p>
              <Link 
                href='/auth/register' 
                className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm'
              >
                Join & Add Spots
                <span className='ml-2'>✨</span>
              </Link>
            </div>
          )}
        </div>

        {/* Compact Filters */}
        <div className='bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 hover:shadow-lg transition-shadow duration-300'>
          <h3 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
            <span className='text-2xl mr-2'>🎯</span>
            Filter Epic Spots
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Spot Type</label>
              <select
                value={spotType}
                onChange={(e) => setSpotType(e.target.value)}
                className='w-full bg-gray-50 border-2 border-gray-200 focus:border-sky-500 focus:bg-white rounded-lg px-3 py-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all duration-300'
              >
                <option value=''>🌟 All Types</option>
                {SPOT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'street' && '🏙️ Street'}
                    {type === 'park' && '🏞️ Park'}
                    {type === 'bowl' && '🥣 Bowl'}
                    {type === 'vert' && '📐 Vert'}
                    {type === 'mini_ramp' && '🛹 Mini Ramp'}
                    {type === 'ledge' && '📏 Ledge'}
                    {type === 'stair' && '🪜 Stairs'}
                    {type === 'rail' && '🚃 Rail'}
                    {type === 'gap' && '↗️ Gap'}
                    {type === 'other' && '⭐ Other'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value ? parseInt(e.target.value) : '')}
                className='w-full bg-gray-50 border-2 border-gray-200 focus:border-sky-500 focus:bg-white rounded-lg px-3 py-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all duration-300'
              >
                <option value=''>🔥 All Levels</option>
                {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => (
                  <option key={level} value={level}>
                    {level === '1' && '🟢 Beginner'}
                    {level === '2' && '🔵 Intermediate'}
                    {level === '3' && '🟡 Advanced'}
                    {level === '4' && '🟠 Expert'}
                    {level === '5' && '🔴 Pro'}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex items-end'>
              <button
                onClick={() => {
                  setSpotType('');
                  setDifficultyLevel('');
                  setPage(1);
                }}
                className='w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md border border-gray-200'
              >
                ✨ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Compact Location Status */}
        {location && (
          <div className='bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-200 rounded-xl p-4 mb-8 shadow-sm'>
            <div className='flex items-center justify-center space-x-3'>
              <div className='w-3 h-3 bg-sky-500 rounded-full animate-pulse'></div>
              <div className='flex items-center space-x-2'>
                <span className='text-xl'>📍</span>
                <p className='text-sky-700 font-bold'>GPS Active - Showing spots near you</p>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Spots Grid */}
        {uniqueSpots.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center'>
              <span className='text-3xl'>🛹</span>
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-3'>No spots found</h3>
            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
              {spotType || difficultyLevel
                ? 'Try adjusting your filters to discover more epic spots'
                : location
                ? 'No spots found near your location. Be the first to add one!'
                : 'No spots available yet. Help build the community!'}
            </p>
            {!isAuthenticated && (
              <Link 
                href='/auth/register' 
                className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
              >
                Be the first to add a spot! 
                <span className='ml-2'>🚀</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12'>
              {uniqueSpots.map((spot: Spot, index: number) => (
                <div
                  key={spot.id}
                  className='group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-sky-200 overflow-hidden transform hover:scale-[1.02] transition-all duration-300'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Compact Card Header with Gradient */}
                  <div className='bg-gradient-to-br from-sky-500 to-emerald-500 p-4 text-white'>
                    <div className='flex justify-between items-start mb-3'>
                      <h3 className='text-lg font-bold truncate pr-2 group-hover:scale-105 transition-transform duration-300'>
                        {spot.name}
                      </h3>
                      <div className='flex-shrink-0'>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-sm bg-white/20 border border-white/30 text-white`}
                        >
                          {spot.difficulty_level === 1 && '🟢'}
                          {spot.difficulty_level === 2 && '🔵'}
                          {spot.difficulty_level === 3 && '🟡'}
                          {spot.difficulty_level === 4 && '🟠'}
                          {spot.difficulty_level === 5 && '🔴'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center'>
                      <span className='bg-white/20 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold rounded-full border border-white/30'>
                        {spot.spot_type === 'street' && '🏙️ Street'}
                        {spot.spot_type === 'park' && '🏞️ Park'}
                        {spot.spot_type === 'bowl' && '🥣 Bowl'}
                        {spot.spot_type === 'vert' && '📐 Vert'}
                        {spot.spot_type === 'mini_ramp' && '🛹 Mini Ramp'}
                        {spot.spot_type === 'ledge' && '📏 Ledge'}
                        {spot.spot_type === 'stair' && '🪜 Stairs'}
                        {spot.spot_type === 'rail' && '🚃 Rail'}
                        {spot.spot_type === 'gap' && '↗️ Gap'}
                        {spot.spot_type === 'other' && '⭐ Other'}
                      </span>
                    </div>
                  </div>

                  {/* Compact Card Body */}
                  <div className='p-4'>
                    {spot.description && (
                      <p className='text-gray-700 mb-4 leading-relaxed text-sm line-clamp-2 font-medium'>
                        {spot.description}
                      </p>
                    )}

                    {spot.address && (
                      <div className='flex items-center text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100'>
                        <span className='text-sky-500 mr-2'>📍</span>
                        <span className='text-xs font-semibold truncate'>{spot.address}</span>
                      </div>
                    )}

                    {spot.features && spot.features.length > 0 && (
                      <div className='mb-4'>
                        <div className='flex flex-wrap gap-1'>
                          {spot.features.slice(0, 2).map((feature, featureIndex) => (
                            <span
                              key={featureIndex}
                              className='bg-gradient-to-r from-sky-100 to-emerald-100 text-sky-700 border border-sky-200 px-2 py-1 text-xs font-bold rounded-full'
                            >
                              ⚡ {feature}
                            </span>
                          ))}
                          {spot.features.length > 2 && (
                            <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-semibold border border-gray-200'>
                              +{spot.features.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Compact Action Button */}
                    <Link
                      href={`/spots/${spot.id}`}
                      className='inline-flex items-center justify-center w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group text-sm'
                    >
                      View Details
                      <span className='ml-2 group-hover:translate-x-1 transition-transform duration-300'>→</span>
                    </Link>
                  </div>

                  {/* Compact Guest Prompt */}
                  {!isAuthenticated && (
                    <div className='bg-gradient-to-r from-gray-50 to-sky-50 px-4 py-3 border-t border-gray-100'>
                      <p className='text-xs text-gray-700 font-medium text-center'>
                        <Link href='/auth/register' className='text-sky-600 hover:text-sky-700 font-bold hover:underline'>
                          Join now
                        </Link>{' '}
                        to check in! 📸
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
                      <p className='text-gray-700 mb-6 leading-relaxed text-base line-clamp-3 font-medium'>
                        {spot.description}
                      </p>
                    )}

                    {spot.address && (
                      <div className='flex items-center text-gray-600 mb-6 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
                        <span className='text-sky-500 mr-3 text-lg'>📍</span>
                        <span className='text-sm font-semibold truncate'>{spot.address}</span>
                      </div>
                    )}

                    {spot.features && spot.features.length > 0 && (
                      <div className='mb-6'>
                        <h4 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Features</h4>
                        <div className='flex flex-wrap gap-2'>
                          {spot.features.slice(0, 3).map((feature, featureIndex) => (
                            <span
                              key={featureIndex}
                              className='bg-gradient-to-r from-sky-100 to-emerald-100 text-sky-700 border border-sky-200 px-3 py-1 text-xs font-bold rounded-full'
                            >
                              ⚡ {feature}
                            </span>
                          ))}
                          {spot.features.length > 3 && (
                            <span className='text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold border border-gray-200'>
                              +{spot.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      href={`/spots/${spot.id}`}
                      className='inline-flex items-center justify-center w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group'
                    >
                      View Epic Details
                      <span className='ml-3 group-hover:translate-x-1 transition-transform duration-300'>→</span>
                    </Link>
                  </div>

                  {/* Guest Prompt */}
                  {!isAuthenticated && (
                    <div className='bg-gradient-to-r from-gray-50 to-sky-50 px-6 py-4 border-t border-gray-100'>
                      <p className='text-sm text-gray-700 font-medium text-center'>
                        <Link href='/auth/register' className='text-sky-600 hover:text-sky-700 font-bold hover:underline'>
                          Join now
                        </Link>{' '}
                        to check in & share photos! �✨
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
        {!isAuthenticated && uniqueSpots.length > 0 && (
          <div className='mt-8 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-6 text-center'>
            <h3 className='text-xl font-bold mb-2'>Ready to skate?</h3>
            <p className='text-gray-300 mb-4 text-sm'>Check in at spots, share photos, and connect with the local skate scene</p>
            <div className='space-x-3'>
              <Link href='/auth/register' className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold'>
                Sign Up Free
              </Link>
              <Link
                href='/auth/login'
                className='border border-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold'
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
