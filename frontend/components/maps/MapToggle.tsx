'use client';

import { useState } from 'react';

interface MapToggleProps {
  view: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

export default function MapToggle({ view, onViewChange }: MapToggleProps) {
  return (
    <div className='inline-flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1'>
      <button
        onClick={() => onViewChange('list')}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          view === 'list' ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-700 hover:text-sky-600 hover:bg-gray-50'
        }`}
      >
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
        </svg>
        List View
      </button>
      <button
        onClick={() => onViewChange('map')}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          view === 'map' ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-700 hover:text-sky-600 hover:bg-gray-50'
        }`}
      >
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
          />
        </svg>
        Map View
      </button>
    </div>
  );
}
