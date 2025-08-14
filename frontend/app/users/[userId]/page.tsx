'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi, handleApiError } from '../../../lib/api';
import { useAuthStore } from '../../../lib/stores/auth';
import { UserIcon, MapPinIcon, CalendarIcon, StarIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email?: string;
  profile_image_url?: string;
  bio?: string;
  location?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  favorite_tricks?: string[];
  created_at: string;
  is_guest: boolean;
}

const SKILL_LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

const SKILL_LEVEL_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-orange-100 text-orange-800',
  pro: 'bg-red-100 text-red-800',
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = parseInt(params.userId as string);
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUser(userId),
    retry: 2,
  });

  const { data: followStatusData } = useQuery({
    queryKey: ['followStatus', userId],
    queryFn: () => usersApi.getFollowStatus(userId),
    enabled: !!isAuthenticated && !!userId,
    retry: 2,
  });

  const { data: followersData } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => usersApi.getFollowers(userId, { limit: 1 }),
    retry: 2,
  });

  const { data: followingData } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => usersApi.getFollowing(userId, { limit: 1 }),
    retry: 2,
  });

  const followMutation = useMutation({
    mutationFn: () => usersApi.followUser(userId),
    onSuccess: () => {
      toast.success('Following user!');
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => usersApi.unfollowUser(userId),
    onSuccess: () => {
      toast.success('Unfollowed user');
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });

  const user: User = userData?.data;
  const followStatus = followStatusData?.data;
  const followersCount = followersData?.data?.total || 0;
  const followingCount = followingData?.data?.total || 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-4xl mx-auto py-8 px-4'>
          <div className='animate-pulse'>
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <div className='flex items-center space-x-4'>
                <div className='w-24 h-24 bg-gray-200 rounded-full'></div>
                <div className='flex-1'>
                  <div className='h-6 bg-gray-200 rounded w-48 mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded w-32'></div>
                </div>
              </div>
              <div className='mt-6 space-y-3'>
                <div className='h-4 bg-gray-200 rounded w-full'></div>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>👤</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>User Not Found</h1>
          <p className='text-gray-600 mb-6'>{error ? handleApiError(error) : 'This user does not exist or has been removed.'}</p>
          <Link href='/' className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors'>
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto py-8 px-4'>
        {/* Profile Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-6'>
              {/* Profile Image */}
              <div className='relative'>
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.username}
                    className='w-24 h-24 rounded-full object-cover border-4 border-gray-200'
                  />
                ) : (
                  <div className='w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100'>
                    <UserIcon className='w-10 h-10 text-gray-400' />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className='flex-1'>
                <div className='flex items-center space-x-3 mb-2'>
                  <h1 className='text-3xl font-bold text-gray-900'>@{user.username}</h1>
                  {user.skill_level && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${SKILL_LEVEL_COLORS[user.skill_level]}`}>
                      <StarIcon className='w-4 h-4 inline mr-1' />
                      {SKILL_LEVEL_LABELS[user.skill_level]}
                    </span>
                  )}
                </div>

                <div className='flex items-center space-x-4 text-gray-600 text-sm'>
                  {user.location && (
                    <div className='flex items-center'>
                      <MapPinIcon className='w-4 h-4 mr-1' />
                      {user.location}
                    </div>
                  )}
                  <div className='flex items-center'>
                    <CalendarIcon className='w-4 h-4 mr-1' />
                    Joined {joinedDate}
                  </div>
                </div>

                {user.bio && <p className='mt-3 text-gray-700 leading-relaxed'>{user.bio}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center space-x-3'>
              {isOwnProfile ? (
                <Link href='/profile/edit' className='bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors'>
                  Edit Profile
                </Link>
              ) : isAuthenticated ? (
                <button
                  onClick={() => {
                    if (followStatus?.is_following) {
                      unfollowMutation.mutate();
                    } else {
                      followMutation.mutate();
                    }
                  }}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    followStatus?.is_following
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <div className='w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  ) : followStatus?.is_following ? (
                    <UserMinusIcon className='w-4 h-4' />
                  ) : (
                    <UserPlusIcon className='w-4 h-4' />
                  )}
                  <span>{followStatus?.is_following ? 'Unfollow' : 'Follow'}</span>
                </button>
              ) : (
                <Link
                  href='/auth/register'
                  className='bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors'
                >
                  Sign up to follow
                </Link>
              )}
            </div>
          </div>

          {/* Favorite Tricks */}
          {user.favorite_tricks && user.favorite_tricks.length > 0 && (
            <div className='mt-6 pt-6 border-t border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Favorite Tricks</h3>
              <div className='flex flex-wrap gap-2'>
                {user.favorite_tricks.map((trick, index) => (
                  <span key={index} className='px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full'>
                    {trick}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Sections */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Recent Activity */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>Recent Activity</h2>
              <div className='text-center py-8'>
                <div className='text-4xl mb-2'>🛹</div>
                <p className='text-gray-500'>No recent activity</p>
                <p className='text-sm text-gray-400 mt-1'>
                  {isOwnProfile
                    ? 'Start exploring spots and shops to see your activity here'
                    : `${user.username} hasn't been active recently`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className='space-y-6'>
            {/* Stats */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Stats</h3>
              <div className='space-y-4'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Spots Visited</span>
                  <span className='font-semibold'>0</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Photos Shared</span>
                  <span className='font-semibold'>0</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Following</span>
                  <span className='font-semibold'>{followingCount}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Followers</span>
                  <span className='font-semibold'>{followersCount}</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Badges</h3>
              <div className='text-center py-4'>
                <div className='text-3xl mb-2'>🏆</div>
                <p className='text-gray-500 text-sm'>No badges yet</p>
                <p className='text-xs text-gray-400 mt-1'>Earn badges by being active in the community</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action for Non-Users */}
        {!currentUser && (
          <div className='mt-8 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-lg p-8 text-center'>
            <h3 className='text-2xl font-bold mb-2'>Join the Community</h3>
            <p className='mb-6 opacity-90'>Create your own profile and connect with skaters like {user.username}</p>
            <div className='space-x-4'>
              <Link href='/auth/register' className='bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors'>
                Sign Up Free
              </Link>
              <Link
                href='/auth/login'
                className='border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors'
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
