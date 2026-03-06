'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { socialAPI } from '@/lib/api';
import UserCard from '@/components/UserCard';

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  profile_picture?: string;
  education_level?: string;
  subjects: string[];
  school?: string;
  is_teacher: boolean;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  total_points: number;
  current_streak: number;
  level: number;
  is_following: boolean;
  follows_you: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'followers' | 'following'>('about');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await socialAPI.getUserProfile(userId);
      setProfile(data);
      setIsFollowing(data.follows_you);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowers = async () => {
    try {
      const data = await socialAPI.getFollowers(userId);
      setFollowers(data);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const data = await socialAPI.getFollowing(userId);
      setFollowing(data);
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'followers') {
      loadFollowers();
    } else if (activeTab === 'following') {
      loadFollowing();
    }
  }, [activeTab, userId]);

  const handleFollowToggle = async () => {
    if (!profile) return;

    setIsActionLoading(true);
    try {
      if (isFollowing) {
        await socialAPI.unfollowUser(userId);
        setIsFollowing(false);
        setProfile({ ...profile, followers_count: profile.followers_count - 1 });
      } else {
        await socialAPI.followUser(userId);
        setIsFollowing(true);
        setProfile({ ...profile, followers_count: profile.followers_count + 1 });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-zinc-400 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.username || profile.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (profile.username?.[0] || profile.full_name?.[0] || 'U').toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || profile.username || 'Anonymous'}
                </h1>
                {profile.is_verified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {profile.is_teacher && (
                  <span className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-600 rounded-full">
                    Teacher
                  </span>
                )}
              </div>

              {profile.username && profile.full_name && (
                <p className="text-gray-500 mb-3">@{profile.username}</p>
              )}

              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <div>
                  <span className="font-bold text-gray-900">{profile.followers_count}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{profile.following_count}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{profile.current_streak}</span>
                  <span className="text-gray-600 ml-1">day streak 🔥</span>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={handleFollowToggle}
                disabled={isActionLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isActionLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>

              {profile.follows_you && (
                <span className="ml-3 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg">
                  Follows you
                </span>
              )}
            </div>
          </div>

          {/* Education Info */}
          {(profile.education_level || profile.school || profile.subjects.length > 0) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {profile.education_level && (
                <div className="mb-2">
                  <span className="text-gray-600">📚 </span>
                  <span className="text-gray-900">{profile.education_level}</span>
                </div>
              )}
              {profile.school && (
                <div className="mb-2">
                  <span className="text-gray-600">🏫 </span>
                  <span className="text-gray-900">{profile.school}</span>
                </div>
              )}
              {profile.subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Followers ({profile.followers_count})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Following ({profile.following_count})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.total_points}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Level</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.level}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.current_streak} days 🔥</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Joined</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-3">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No followers yet</p>
              </div>
            ) : (
              followers.map((follower) => (
                <UserCard key={follower.id} user={follower} onFollowChange={loadFollowers} />
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Not following anyone yet</p>
              </div>
            ) : (
              following.map((user) => (
                <UserCard key={user.id} user={user} onFollowChange={loadFollowing} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
