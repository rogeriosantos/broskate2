'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapSelectorProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export default function MapSelector({
  center = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom = 12,
  onLocationSelect,
  selectedLocation,
  className = 'w-full h-96',
}: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if we have the API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        console.log('MapSelector: API Key', apiKey ? 'Present' : 'Missing');
        
        if (!apiKey) {
          setError('Google Maps API key not configured');
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: [],
        });

        console.log('MapSelector: Loading Google Maps...');
        await loader.load();
        console.log('MapSelector: Google Maps loaded successfully');
        setIsLoaded(true);
      } catch (err) {
        console.error('MapSelector: Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
      }
    };

    initMap();
  }, []);

  // Create map instance when both Google Maps is loaded and ref is ready
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      console.log('MapSelector: Creating map instance...');
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
      console.log('MapSelector: Map instance created successfully');

      // Add click listener to place marker
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          console.log('MapSelector: Location selected:', { lat, lng });
          
          // Update marker position
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            // Create new marker
            markerRef.current = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              title: 'Selected Location',
              icon: {
                url: `data:image/svg+xml,${encodeURIComponent(`
                  <svg width="35" height="35" viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
                      </filter>
                    </defs>
                    <polygon points="17.5,2 21.5,12 32,12 24.5,18.5 27.5,29 17.5,23 7.5,29 10.5,18.5 3,12 13.5,12" 
                             fill="#FF4444" 
                             stroke="#FF8888" 
                             stroke-width="2" 
                             filter="url(#shadow)"/>
                    <polygon points="17.5,4 20.5,12.5 27,12.5 22,17.5 24,26 17.5,21.5 11,26 13,17.5 8,12.5 14.5,12.5" 
                             fill="#FF6666"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(35, 35),
                anchor: new google.maps.Point(17.5, 17.5),
              },
            });
          }
          
          // Call the callback with the selected location
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        }
      });
    } catch (err) {
      console.error('MapSelector: Error creating map instance:', err);
      setError('Failed to create map instance');
    }
  }, [isLoaded, center.lat, center.lng, zoom, onLocationSelect, map]);

  // Update marker when selectedLocation changes externally
  useEffect(() => {
    if (map && selectedLocation) {
      if (markerRef.current) {
        markerRef.current.setPosition(selectedLocation);
      } else {
        markerRef.current = new google.maps.Marker({
          position: selectedLocation,
          map,
          title: 'Selected Location',
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg width="35" height="35" viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
                  </filter>
                </defs>
                <polygon points="17.5,2 21.5,12 32,12 24.5,18.5 27.5,29 17.5,23 7.5,29 10.5,18.5 3,12 13.5,12" 
                         fill="#FF4444" 
                         stroke="#FF8888" 
                         stroke-width="2" 
                         filter="url(#shadow)"/>
                <polygon points="17.5,4 20.5,12.5 27,12.5 22,17.5 24,26 17.5,21.5 11,26 13,17.5 8,12.5 14.5,12.5" 
                         fill="#FF6666"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(35, 35),
            anchor: new google.maps.Point(17.5, 17.5),
          },
        });
      }
      
      // Center map on selected location
      map.setCenter(selectedLocation);
    }
  }, [map, selectedLocation]);

  if (error) {
    return (
      <div className={`${className} bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200`}>
        <div className='text-center p-6'>
          <div className='w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>⚠️</span>
          </div>
          <h3 className='text-lg font-semibold text-red-900 mb-2'>Map Error</h3>
          <p className='text-red-700 text-sm'>{error}</p>
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
          <p className='text-gray-600 text-sm'>Initializing map selector...</p>
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
