'use client';

import Link from 'next/link';
import { useAuthStore } from '../../lib/stores/auth';

interface GuestPromptProps {
  variant?: 'card' | 'banner' | 'inline' | 'modal';
  title?: string;
  description?: string;
  primaryAction?: string;
  secondaryAction?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GuestPrompt({
  variant = 'card',
  title,
  description,
  primaryAction = 'Sign Up Free',
  secondaryAction = 'Log In',
  className = '',
  size = 'md',
}: GuestPromptProps) {
  const { isAuthenticated } = useAuthStore();

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4',
    lg: 'p-6 text-lg',
  };

  const buttonSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const defaultTitles = {
    card: 'Join the Community',
    banner: 'Ready to get started?',
    inline: 'Want to join?',
    modal: 'Join BroSkate',
  };

  const defaultDescriptions = {
    card: 'Connect with skaters, discover spots, and share your journey',
    banner: 'Sign up to unlock all features and connect with the community',
    inline: 'Sign up to access this feature',
    modal: 'Create your account to get the full BroSkate experience',
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white ${sizeClasses[size]} rounded-lg shadow-lg ${className}`}>
        <div className='flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4'>
          <div className='text-center sm:text-left'>
            <h3 className='font-semibold mb-1'>{title || defaultTitles[variant]}</h3>
            <p className='text-blue-100 text-sm'>{description || defaultDescriptions[variant]}</p>
          </div>
          <div className='flex space-x-3'>
            <Link
              href='/auth/register'
              className={`bg-white text-blue-600 ${buttonSizes[size]} rounded font-medium hover:bg-gray-100 transition-colors`}
            >
              {primaryAction}
            </Link>
            <Link
              href='/auth/login'
              className={`border border-white/30 text-white ${buttonSizes[size]} rounded hover:bg-white/10 transition-colors`}
            >
              {secondaryAction}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`bg-gray-50 border border-gray-200 text-gray-800 ${sizeClasses[size]} rounded ${className}`}>
        <p className='text-sm'>
          {description || defaultDescriptions[variant]}{' '}
          <Link href='/auth/register' className='text-blue-600 hover:underline font-medium'>
            {primaryAction}
          </Link>
          {' or '}
          <Link href='/auth/login' className='text-blue-600 hover:underline'>
            {secondaryAction.toLowerCase()}
          </Link>
        </p>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={`text-center ${sizeClasses[size]} ${className}`}>
        <div className='text-4xl mb-4'>🔒</div>
        <h3 className='text-xl font-semibold mb-2'>{title || defaultTitles[variant]}</h3>
        <p className='text-gray-600 mb-6'>{description || defaultDescriptions[variant]}</p>
        <div className='space-x-4'>
          <Link
            href='/auth/register'
            className={`bg-blue-600 text-white ${buttonSizes[size]} rounded-lg hover:bg-blue-700 transition-colors`}
          >
            {primaryAction}
          </Link>
          <Link href='/auth/login' className={`border border-gray-300 ${buttonSizes[size]} rounded-lg hover:bg-gray-50 transition-colors`}>
            {secondaryAction}
          </Link>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${sizeClasses[size]} ${className}`}>
      <div className='text-center'>
        <h3 className='font-semibold mb-2'>{title || defaultTitles[variant]}</h3>
        <p className='text-gray-600 text-sm mb-4'>{description || defaultDescriptions[variant]}</p>
        <div className='space-x-3'>
          <Link
            href='/auth/register'
            className={`bg-blue-600 text-white ${buttonSizes[size]} rounded hover:bg-blue-700 transition-colors inline-block`}
          >
            {primaryAction}
          </Link>
          <Link
            href='/auth/login'
            className={`border border-gray-300 ${buttonSizes[size]} rounded hover:bg-gray-50 transition-colors inline-block`}
          >
            {secondaryAction}
          </Link>
        </div>
      </div>
    </div>
  );
}
