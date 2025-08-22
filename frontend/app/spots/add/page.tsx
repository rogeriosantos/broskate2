'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/stores/auth';
import { spotsApi, handleApiError } from '../../../lib/api';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import MapSelector from '../../../components/maps/MapSelector';

const SPOT_TYPES = [
  { value: 'street', label: 'Street' },
  { value: 'park', label: 'Skate Park' },
  { value: 'vert', label: 'Vert Ramp' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'mini_ramp', label: 'Mini Ramp' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'rail', label: 'Rail' },
  { value: 'ledge', label: 'Ledge' },
  { value: 'gap', label: 'Gap' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
];

export default function AddSpotPage() {
  // Prevent SSR execution of client-side code
  if (typeof window === 'undefined') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    spot_types: ['street'] as string[], // Changed to array
    difficulty_levels: [3] as number[], // Changed to array
    features: [] as string[],
  });
  const [featureInput, setFeatureInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMapSelector, setShowMapSelector] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's current location for centering the map
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // Default to NYC if location is denied
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    } else {
      // Default to NYC if geolocation is not supported
      setUserLocation({ lat: 40.7128, lng: -74.006 });
    }
  }, []);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSpotTypeToggle = (spotType: string) => {
    setFormData((prev) => ({
      ...prev,
      spot_types: prev.spot_types.includes(spotType)
        ? prev.spot_types.filter(type => type !== spotType)
        : [...prev.spot_types, spotType]
    }));
  };

  const handleDifficultyToggle = (difficulty: number) => {
    setFormData((prev) => ({
      ...prev,
      difficulty_levels: prev.difficulty_levels.includes(difficulty)
        ? prev.difficulty_levels.filter(level => level !== difficulty)
        : [...prev.difficulty_levels, difficulty]
    }));
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (featureToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((feature) => feature !== featureToRemove),
    }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Unable to get your location. Please enter coordinates manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
    }));
    toast.success('Location selected from map!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Spot name is required';
    }

    if (formData.spot_types.length === 0) {
      newErrors.spot_types = 'At least one spot type must be selected';
    }

    if (formData.difficulty_levels.length === 0) {
      newErrors.difficulty_levels = 'At least one difficulty level must be selected';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Location coordinates are required';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const spotData = {
        name: formData.name,
        description: formData.description || undefined,
        address: formData.address || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        spot_type: formData.spot_types[0], // Primary spot type
        difficulty_level: formData.difficulty_levels[0], // Primary difficulty level
        features: [
          ...formData.features,
          // Add additional spot types as features
          ...formData.spot_types.slice(1).map(type => `Additional type: ${SPOT_TYPES.find(t => t.value === type)?.label || type}`),
          // Add additional difficulty levels as features
          ...formData.difficulty_levels.slice(1).map(level => `Difficulty: ${DIFFICULTY_LEVELS.find(d => d.value === level)?.label || level}`)
        ].filter(feature => feature), // Remove empty features
      };

      const response = await spotsApi.createSpot(spotData);

      toast.success('Skate spot created successfully!');
      router.push(`/spots/${response.data.id}`);
    } catch (error: any) {
      console.error('Create spot error:', error);
      const errorMessage = handleApiError(error);
      setErrors({ general: errorMessage });
      toast.error('Failed to create spot');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='flex items-center mb-8'>
          <Link href='/spots' className='flex items-center text-gray-600 hover:text-gray-900 mr-4'>
            <ArrowLeftIcon className='h-5 w-5 mr-1' />
            Back to Spots
          </Link>
          <h1 className='text-3xl font-bold text-gray-900'>Add New Skate Spot</h1>
        </div>

        {/* Form */}
        <div className='bg-white shadow-md rounded-lg p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {errors.general && (
              <div className='rounded-md bg-red-50 p-4'>
                <div className='text-sm text-red-800'>{errors.general}</div>
              </div>
            )}

            {/* Spot Name */}
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Spot Name *
              </label>
              <input
                type='text'
                name='name'
                id='name'
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder='Enter spot name'
              />
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor='description' className='block text-sm font-medium text-gray-700'>
                Description
              </label>
              <textarea
                name='description'
                id='description'
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Describe the spot, what makes it special...'
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor='address' className='block text-sm font-medium text-gray-700'>
                Address
              </label>
              <input
                type='text'
                name='address'
                id='address'
                value={formData.address}
                onChange={handleChange}
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Street address or nearby landmark'
              />
            </div>

            {/* Location */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Location *</label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label htmlFor='latitude' className='block text-xs font-medium text-gray-500 mb-1'>
                    Latitude
                  </label>
                  <input
                    type='number'
                    name='latitude'
                    id='latitude'
                    step='any'
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.latitude ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder='e.g., 40.7128'
                  />
                  {errors.latitude && <p className='mt-1 text-xs text-red-600'>{errors.latitude}</p>}
                </div>
                <div>
                  <label htmlFor='longitude' className='block text-xs font-medium text-gray-500 mb-1'>
                    Longitude
                  </label>
                  <input
                    type='number'
                    name='longitude'
                    id='longitude'
                    step='any'
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.longitude ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder='e.g., -74.0060'
                  />
                  {errors.longitude && <p className='mt-1 text-xs text-red-600'>{errors.longitude}</p>}
                </div>
              </div>
              
              {/* Location Buttons */}
              <div className='flex flex-wrap gap-2 mt-3'>
                <button
                  type='button'
                  onClick={handleGetLocation}
                  className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                >
                  <MapPinIcon className='h-4 w-4 mr-1' />
                  Use Current Location
                </button>
                
                <button
                  type='button'
                  onClick={() => setShowMapSelector(!showMapSelector)}
                  className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                >
                  <svg className='h-4 w-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                  </svg>
                  {showMapSelector ? 'Hide Map' : 'Select on Map'}
                </button>
              </div>

              {/* Map Selector */}
              {showMapSelector && userLocation && (
                <div className='mt-4'>
                  <div className='mb-2'>
                    <p className='text-sm text-gray-600 mb-2'>Click on the map to select the spot location:</p>
                  </div>
                  <MapSelector
                    center={userLocation}
                    zoom={13}
                    onLocationSelect={handleMapLocationSelect}
                    selectedLocation={
                      formData.latitude && formData.longitude
                        ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
                        : null
                    }
                    className='w-full h-80'
                  />
                </div>
              )}

              {errors.location && <p className='mt-1 text-sm text-red-600'>{errors.location}</p>}
            </div>

            {/* Spot Types */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Spot Types *
              </label>
              {errors.spot_types && <p className='text-sm text-red-600 mb-2'>{errors.spot_types}</p>}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                {SPOT_TYPES.map((type) => (
                  <label key={type.value} className='relative flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.spot_types.includes(type.value)}
                      onChange={() => handleSpotTypeToggle(type.value)}
                      className='sr-only'
                    />
                    <div className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.spot_types.includes(type.value)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}>
                      {type.label}
                      {formData.spot_types.includes(type.value) && (
                        <svg className='w-4 h-4 ml-2' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-2'>Select all that apply. The first selected will be the primary type.</p>
            </div>

            {/* Difficulty Levels */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Difficulty Levels *
              </label>
              {errors.difficulty_levels && <p className='text-sm text-red-600 mb-2'>{errors.difficulty_levels}</p>}
              <div className='grid grid-cols-1 sm:grid-cols-5 gap-3'>
                {DIFFICULTY_LEVELS.map((level) => (
                  <label key={level.value} className='relative flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.difficulty_levels.includes(level.value)}
                      onChange={() => handleDifficultyToggle(level.value)}
                      className='sr-only'
                    />
                    <div className={`flex flex-col items-center justify-center w-full px-3 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.difficulty_levels.includes(level.value)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}>
                      <span className='text-lg font-bold'>{level.value}</span>
                      <span className='text-xs'>{level.label}</span>
                      {formData.difficulty_levels.includes(level.value) && (
                        <svg className='w-4 h-4 mt-1' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-2'>Select all difficulty levels that apply. The first selected will be the primary level.</p>
            </div>

            {/* Features */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Features</label>
              <div className='flex items-center space-x-2 mb-3'>
                <input
                  type='text'
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className='flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                  placeholder='e.g., handrail, stairs, ledge'
                />
                <button
                  type='button'
                  onClick={handleAddFeature}
                  className='px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                >
                  Add
                </button>
              </div>
              {formData.features.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800'
                    >
                      {feature}
                      <button
                        type='button'
                        onClick={() => handleRemoveFeature(feature)}
                        className='ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none'
                      >
                        <span className='sr-only'>Remove {feature}</span>
                        <svg className='h-2 w-2' stroke='currentColor' fill='none' viewBox='0 0 8 8'>
                          <path strokeLinecap='round' strokeWidth='1.5' d='m1 1 6 6m0-6L1 7' />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className='pt-6'>
              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Creating Spot...
                  </>
                ) : (
                  'Create Spot'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
