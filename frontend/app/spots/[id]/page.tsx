'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { spotsApi, handleApiError } from '../../../lib/api';
import { useAuthStore } from '../../../lib/stores/auth';

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

const DIFFICULTY_LABELS: { [key: number]: string } = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Pro',
};

export default function SpotDetailsPage() {
  const params = useParams();
  const spotId = parseInt(params.id as string);
  const { isAuthenticated } = useAuthStore();

  const {
    data: spotData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['spot', spotId],
    queryFn: () => spotsApi.getSpot(spotId),
    retry: 2,
  });

  const spot: Spot = spotData?.data;

  const getDifficultyColor = (level: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-orange-100 text-orange-800 border-orange-200',
      5: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-6'></div>
          <div className='h-32 bg-gray-200 rounded mb-6'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='h-48 bg-gray-200 rounded'></div>
            <div className='h-48 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>😕</div>
          <h1 className='text-2xl font-bold mb-4'>Spot Not Found</h1>
          <p className='text-gray-600 mb-6'>{error ? handleApiError(error) : 'This spot could not be found'}</p>
          <Link href='/spots' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
            Browse All Spots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Breadcrumb */}
      <nav className='mb-6'>
        <Link href='/spots' className='text-blue-600 hover:underline'>
          ← Back to Spots
        </Link>
      </nav>

      {/* Header */}
      <div className='bg-white rounded-lg shadow-md p-8 mb-6'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <div className='flex items-center space-x-3 mb-2'>
              <h1 className='text-3xl font-bold'>{spot.name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getDifficultyColor(spot.difficulty_level)}`}>
                {DIFFICULTY_LABELS[spot.difficulty_level]}
              </span>
            </div>

            <div className='flex items-center space-x-4 mb-4'>
              <span className='bg-gray-100 text-gray-800 px-3 py-1 text-sm rounded-lg'>
                {spot.spot_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              {spot.address && <p className='text-gray-600 flex items-center'>📍 {spot.address}</p>}
            </div>
          </div>

          {!isAuthenticated && (
            <div className='bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg'>
              <p className='text-sm mb-2'>Want to check in?</p>
              <Link href='/auth/register' className='bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors'>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {spot.description && (
          <div className='prose max-w-none mb-6'>
            <p className='text-gray-700'>{spot.description}</p>
          </div>
        )}

        {/* Features */}
        {spot.features && spot.features.length > 0 && (
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3'>Features</h3>
            <div className='flex flex-wrap gap-2'>
              {spot.features.map((feature, index) => (
                <span key={index} className='bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm'>
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Section (Placeholder) */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Location</h2>
        <div className='bg-gray-100 rounded-lg h-64 flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-4xl mb-2'>🗺️</div>
            <p className='text-gray-600'>Interactive map coming soon</p>
            <p className='text-sm text-gray-500'>
              Lat: {spot.latitude.toFixed(4)}, Lng: {spot.longitude.toFixed(4)}
            </p>
            <div className='mt-4'>
              <a
                href={`https://maps.google.com?q=${spot.latitude},${spot.longitude}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Check-ins Section */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Recent Activity</h2>

        {isAuthenticated ? (
          <div className='space-y-4'>
            <button className='w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors'>
              Check In at This Spot
            </button>
            <div className='text-center py-8'>
              <p className='text-gray-600'>Recent check-ins and photos will appear here</p>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <div className='text-4xl mb-4'>📸</div>
            <h3 className='text-lg font-semibold mb-2'>See who's been here</h3>
            <p className='text-gray-600 mb-6'>View check-ins, photos, and connect with skaters who've been to this spot</p>
            <div className='space-x-4'>
              <Link href='/auth/register' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
                Sign Up Free
              </Link>
              <Link href='/auth/login' className='border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors'>
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Safety & Tips */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Skate Safely</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='font-medium mb-2'>🛡️ Safety Tips</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Always wear protective gear</li>
              <li>• Check local regulations</li>
              <li>• Respect private property</li>
              <li>• Be aware of pedestrians</li>
            </ul>
          </div>
          <div>
            <h4 className='font-medium mb-2'>⚡ Skill Level: {DIFFICULTY_LABELS[spot.difficulty_level]}</h4>
            <p className='text-sm text-gray-600'>
              This spot is rated for {DIFFICULTY_LABELS[spot.difficulty_level].toLowerCase()} level skaters. Make sure you're comfortable
              with your skills before attempting.
            </p>
          </div>
        </div>
      </div>

      {/* Related Spots */}
      <div className='mt-8'>
        <h2 className='text-xl font-semibold mb-4'>Discover More Spots</h2>
        <Link href='/spots' className='inline-flex items-center text-blue-600 hover:underline'>
          Browse all spots →
        </Link>
      </div>
    </div>
  );
}
