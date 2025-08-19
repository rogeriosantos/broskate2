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
    queryKey: ['spots', page, spotType, difficultyLevel, location],
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
  });

  const spots = spotsData?.data || [];
  const totalPages = Math.ceil((spots.length || 0) / 12); // Since we don't have total from API, use array length

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
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Skate Spots</h1>
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
        <h1 className='text-3xl font-bold mb-8'>Skate Spots</h1>
        <div className='text-center py-12'>
          <p className='text-red-600 mb-4'>Failed to load spots</p>
          <p className='text-gray-600'>{handleApiError(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50/30'>
      <div className='container mx-auto px-4 py-12'>
        {/* Modern Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500/10 to-neon/10 border border-primary-500/20 rounded-full mb-6'>
            <span className='text-sm font-semibold text-primary-700'>🛹 DISCOVER</span>
          </div>

          <h1 className='text-5xl md:text-6xl font-black tracking-tight text-dark-900 font-display mb-4'>
            Epic <span className='bg-gradient-to-r from-primary-600 to-neon bg-clip-text text-transparent'>Skate Spots</span>
          </h1>

          <p className='text-xl text-dark-600 font-medium max-w-2xl mx-auto mb-8'>
            {location ? 'Find legendary spots near you with GPS precision' : 'Discover amazing skate spots from around the globe'}
          </p>

          {/* Action Button */}
          {isAuthenticated ? (
            <Link href='/spots/add' className='btn-primary px-8 py-4 shadow-2xl shadow-primary-500/25 group'>
              <span className='text-xl mr-2'>+</span>
              Add Epic Spot
            </Link>
          ) : (
            <div className='card-hover p-6 bg-gradient-to-r from-primary-500/5 to-neon/5 border-primary-200 inline-block'>
              <p className='text-dark-600 mb-3 font-medium'>Know an epic spot?</p>
              <Link href='/auth/register' className='btn-primary px-6 py-3 shadow-lg shadow-primary-500/20'>
                Join & Add Spots
              </Link>
            </div>
          )}
        </div>

        {/* Modern Filters */}
        <div className='card-hover p-8 mb-12 bg-gradient-to-r from-white to-primary-50/30 border-primary-100'>
          <h3 className='text-lg font-bold text-dark-900 mb-6 flex items-center'>
            <span className='text-2xl mr-2'>🎯</span>
            Filter Epic Spots
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-bold text-dark-700 mb-3'>Spot Type</label>
              <select
                value={spotType}
                onChange={(e) => setSpotType(e.target.value)}
                className='w-full bg-white/80 backdrop-blur-sm border-2 border-primary-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 font-medium'
              >
                <option value=''>🌟 All Types</option>
                {SPOT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'street' && '🏙️ '}
                    {type === 'park' && '🏞️ '}
                    {type === 'bowl' && '🥣 '}
                    {type === 'vert' && '📐 '}
                    {type === 'mini_ramp' && '🛹 '}
                    {type === 'ledge' && '📏 '}
                    {type === 'stair' && '🪜 '}
                    {type === 'rail' && '🚃 '}
                    {type === 'gap' && '↗️ '}
                    {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-bold text-dark-700 mb-3'>Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value ? parseInt(e.target.value) : '')}
                className='w-full bg-white/80 backdrop-blur-sm border-2 border-primary-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 font-medium'
              >
                <option value=''>🔥 All Levels</option>
                {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => (
                  <option key={level} value={level}>
                    {level === '1' && '🟢 '}
                    {level === '2' && '🔵 '}
                    {level === '3' && '🟡 '}
                    {level === '4' && '🟠 '}
                    {level === '5' && '🔴 '}
                    {label}
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
                className='w-full bg-gradient-to-r from-dark-100 to-dark-200 hover:from-dark-200 hover:to-dark-300 text-dark-700 font-semibold px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
              >
                ✨ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Location Status */}
        {location && (
          <div className='card-hover p-6 mb-8 bg-gradient-to-r from-primary-50 to-neon/5 border-primary-200 inline-block'>
            <div className='flex items-center space-x-3'>
              <div className='w-3 h-3 bg-primary-500 rounded-full animate-glow-pulse'></div>
              <p className='text-primary-700 font-semibold'>📍 GPS Active - Showing spots near you</p>
            </div>
          </div>
        )}

        {/* Spots Grid */}
        {spots.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>🛹</div>
            <h3 className='text-xl font-semibold mb-2'>No spots found</h3>
            <p className='text-gray-600 mb-6'>
              {spotType || difficultyLevel
                ? 'Try adjusting your filters to see more spots'
                : location
                ? 'No spots found near your location'
                : 'No spots available yet'}
            </p>
            {!isAuthenticated && (
              <Link href='/auth/register' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
                Be the first to add a spot!
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
              {spots.map((spot: Spot, index: number) => (
                <div
                  key={spot.id}
                  className='group card-hover p-0 overflow-hidden bg-gradient-to-br from-white to-primary-50/30 border-primary-100 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-500/10 animate-fade-in-up'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Card Header */}
                  <div className='p-6 pb-4'>
                    <div className='flex justify-between items-start mb-4'>
                      <h3 className='text-xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-300'>
                        {spot.name}
                      </h3>
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getDifficultyColor(
                            spot.difficulty_level
                          )} group-hover:scale-105 transition-transform duration-300`}
                        >
                          {spot.difficulty_level === 1 && '🟢'} {spot.difficulty_level === 2 && '🔵'} {spot.difficulty_level === 3 && '🟡'}{' '}
                          {spot.difficulty_level === 4 && '🟠'} {spot.difficulty_level === 5 && '🔴'}
                          {DIFFICULTY_LABELS[spot.difficulty_level]}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2 mb-4'>
                      <span className='bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-3 py-1 text-sm font-semibold rounded-full shadow-sm'>
                        {spot.spot_type === 'street' && '🏙️'} {spot.spot_type === 'park' && '🏞️'} {spot.spot_type === 'bowl' && '🥣'}{' '}
                        {spot.spot_type === 'vert' && '📐'} {spot.spot_type === 'mini_ramp' && '🛹'}
                        {' ' + spot.spot_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>

                    {spot.description && <p className='text-dark-600 mb-4 leading-relaxed line-clamp-2 font-medium'>{spot.description}</p>}

                    {spot.address && (
                      <div className='flex items-center text-dark-500 mb-4 bg-dark-50/50 rounded-xl px-3 py-2'>
                        <span className='text-primary-500 mr-2'>📍</span>
                        <span className='text-sm font-medium truncate'>{spot.address}</span>
                      </div>
                    )}

                    {spot.features && spot.features.length > 0 && (
                      <div className='flex flex-wrap gap-2 mb-4'>
                        {spot.features.slice(0, 3).map((feature, featureIndex) => (
                          <span
                            key={featureIndex}
                            className='bg-gradient-to-r from-neon/10 to-glow/10 text-neon border border-neon/20 px-3 py-1 text-xs font-semibold rounded-full'
                          >
                            ⚡ {feature}
                          </span>
                        ))}
                        {spot.features.length > 3 && (
                          <span className='text-xs text-dark-500 bg-dark-100 px-2 py-1 rounded-full font-medium'>
                            +{spot.features.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className='px-6 pb-6'>
                    <Link
                      href={`/spots/${spot.id}`}
                      className='inline-flex items-center font-bold text-primary-600 hover:text-primary-700 group-hover:underline transition-all duration-300'
                    >
                      View Epic Details
                      <span className='ml-2 group-hover:translate-x-1 transition-transform duration-300'>→</span>
                    </Link>
                  </div>

                  {/* Guest Action Prompt */}
                  {!isAuthenticated && (
                    <div className='bg-gradient-to-r from-primary-50 to-neon/5 px-6 py-4 border-t border-primary-100'>
                      <p className='text-sm text-primary-700 font-medium'>
                        <Link href='/auth/register' className='text-primary-600 hover:text-primary-700 font-bold hover:underline'>
                          Join now
                        </Link>{' '}
                        to check in & share photos! 🔥
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
        {!isAuthenticated && spots.length > 0 && (
          <div className='mt-12 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-8 text-center'>
            <h3 className='text-2xl font-bold mb-2'>Ready to skate?</h3>
            <p className='text-gray-300 mb-6'>Check in at spots, share photos, and connect with the local skate scene</p>
            <div className='space-x-4'>
              <Link href='/auth/register' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
                Sign Up Free
              </Link>
              <Link
                href='/auth/login'
                className='border border-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors'
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
