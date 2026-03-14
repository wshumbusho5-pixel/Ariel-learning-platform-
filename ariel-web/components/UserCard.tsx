'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div
      className="flex items-center justify-between px-0 py-3 border-b border-[#2f3336] cursor-pointer"
      onClick={() => router.push(`/profile/${user.id}`)}
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username || user.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[16px] font-bold" style={{ color: '#e7e9ea' }}>
              {(user.username?.[0] || user.full_name?.[0] || 'U').toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold truncate" style={{ color: '#e7e9ea' }}>
              {user.full_name || user.username || 'Anonymous'}
            </span>
            {user.is_verified && (
              <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {user.is_teacher && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-violet-500/15 text-violet-400 rounded-full border border-violet-500/30 flex-shrink-0">
                Teacher
              </span>
            )}
          </div>
          {user.username && (
            <p className="text-[13px] truncate" style={{ color: '#8b9099' }}>@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-[14px] truncate mt-0.5" style={{ color: '#8b9099' }}>{user.bio}</p>
          )}
        </div>
      </div>

      {/* Right: Follow Button */}
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`px-4 py-1.5 rounded-full text-[14px] font-bold transition-all flex-shrink-0 ml-3 ${
          isFollowing
            ? 'bg-transparent border border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-red-400'
            : 'bg-white text-black hover:bg-zinc-200'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        {isLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
