'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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

interface GoogleMapProps {
  spots: Spot[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onSpotClick?: (spot: Spot) => void;
  className?: string;
}

const SPOT_TYPE_ICONS = {
  street: '🏙️',
  park: '🏞️',
  bowl: '🥣',
  vert: '📐',
  mini_ramp: '🛹',
  ledge: '📏',
  stair: '🪜',
  rail: '🚃',
  gap: '↗️',
  other: '⭐',
};

const DIFFICULTY_COLORS = {
  1: '#10B981', // green
  2: '#3B82F6', // blue
  3: '#F59E0B', // yellow
  4: '#F97316', // orange
  5: '#EF4444', // red
};

export default function GoogleMap({
  spots,
  center = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom = 12,
  onSpotClick,
  className = 'w-full h-96',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if we have the API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        console.log('Google Maps API Key:', apiKey ? 'Present' : 'Missing');
        
        if (!apiKey) {
          setError('Google Maps API key not configured');
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: [],
        });

        console.log('Loading Google Maps...');
        await loader.load();
        console.log('Google Maps loaded successfully');
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
      }
    };

    initMap();
  }, []); // Only run once

  // Create map instance when both API is loaded and ref is available
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      console.log('Creating map instance...');
      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);
      console.log('Map instance created successfully');
    } catch (err) {
      console.error('Error creating map instance:', err);
      setError('Failed to create map instance');
    }
  }, [isLoaded, center.lat, center.lng, zoom, map]);

  // Update markers when spots change
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      if (spot.latitude && spot.longitude) {
        // Get icon for spot type
        const icon = SPOT_TYPE_ICONS[spot.spot_type as keyof typeof SPOT_TYPE_ICONS] || '📍';
        
        // Create custom marker with emoji and color
        const marker = new google.maps.Marker({
          position: { lat: spot.latitude, lng: spot.longitude },
          map,
          title: spot.name,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${DIFFICULTY_COLORS[spot.difficulty_level as keyof typeof DIFFICULTY_COLORS]}" stroke="white" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${icon}</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-bold text-lg mb-2">${spot.name}</h3>
              ${spot.description ? `<p class="text-gray-600 text-sm mb-2">${spot.description}</p>` : ''}
              ${spot.address ? `<p class="text-gray-500 text-xs mb-2">📍 ${spot.address}</p>` : ''}
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-xs font-semibold px-2 py-1 rounded-full" style="background: ${
                  DIFFICULTY_COLORS[spot.difficulty_level as keyof typeof DIFFICULTY_COLORS]
                }20; color: ${DIFFICULTY_COLORS[spot.difficulty_level as keyof typeof DIFFICULTY_COLORS]}">
                  Difficulty ${spot.difficulty_level}
                </span>
                <span class="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-full">
                  ${SPOT_TYPE_ICONS[spot.spot_type as keyof typeof SPOT_TYPE_ICONS]} ${spot.spot_type.replace('_', ' ')}
                </span>
              </div>
              ${
                spot.features && spot.features.length > 0
                  ? `
                <div class="text-xs text-gray-600">
                  <strong>Features:</strong> ${spot.features.slice(0, 3).join(', ')}${spot.features.length > 3 ? '...' : ''}
                </div>
              `
                  : ''
              }
            </div>
          `,
        });

        // Add click listener
        marker.addListener('click', () => {
          // Close any open info windows
          markersRef.current.forEach((m) => {
            if ((m as any).infoWindow) {
              (m as any).infoWindow.close();
            }
          });

          infoWindow.open(map, marker);
          onSpotClick?.(spot);
        });

        // Store reference to info window
        (marker as any).infoWindow = infoWindow;
        markersRef.current.push(marker as any);
      }
    });

    // Adjust map bounds to show all markers
    if (spots.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      spots.forEach((spot) => {
        if (spot.latitude && spot.longitude) {
          bounds.extend({ lat: spot.latitude, lng: spot.longitude });
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(map, 'zoom_changed', () => {
          if (map.getZoom()! > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, spots, isLoaded, onSpotClick]);

  if (error) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className='text-center p-6'>
          <div className='w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>🗺️</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Map Error</h3>
          <p className='text-red-600 text-sm'>{error}</p>
          <p className='text-gray-500 text-xs mt-2'>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className='text-center p-6'>
          <div className='w-16 h-16 mx-auto mb-4 bg-sky-100 rounded-full flex items-center justify-center animate-pulse'>
            <span className='text-2xl'>🗺️</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Loading Map</h3>
          <p className='text-gray-600 text-sm'>Initializing Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden shadow-lg border border-gray-200`}>
      <div ref={mapRef} className='w-full h-full' />
    </div>
  );
}
