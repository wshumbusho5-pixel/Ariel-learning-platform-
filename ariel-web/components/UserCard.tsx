'use client';

import { useState } from 'react';
import { socialAPI } from '@/lib/api';

interface UserCardProps {
  user: {
    id: string;
    username?: string;
    full_name?: string;
    profile_picture?: string;
    bio?: string;
    is_following: boolean;
    is_teacher: boolean;
    is_verified: boolean;
  };
  onFollowChange?: () => void;
}

export default function UserCard({ user, onFollowChange }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.is_following);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await socialAPI.unfollowUser(user.id);
        setIsFollowing(false);
      } else {
        await socialAPI.followUser(user.id);
        setIsFollowing(true);
      }
      onFollowChange?.();
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username || user.full_name || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (user.username?.[0] || user.full_name?.[0] || 'U').toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.full_name || user.username || 'Anonymous'}
            </h3>
            {user.is_verified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {user.is_teacher && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                Teacher
              </span>
            )}
          </div>
          {user.username && user.full_name && (
            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-sm text-gray-600 truncate mt-1">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Right: Follow Button */}
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ml-3 ${
          isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
