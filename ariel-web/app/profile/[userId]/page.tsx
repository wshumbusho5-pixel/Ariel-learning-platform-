'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'followers' | 'following'>('about');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await socialAPI.getUserProfile(userId);
      setProfile(data);
      setIsFollowing(data.is_following);
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
    } catch {}
  };

  const loadFollowing = async () => {
    try {
      const data = await socialAPI.getFollowing(userId);
      setFollowing(data);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'followers') loadFollowers();
    else if (activeTab === 'following') loadFollowing();
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
    } catch {}
    setIsActionLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-[17px] font-bold mb-2" style={{ color: '#e7e9ea' }}>Profile not found</p>
          <button onClick={() => router.back()} className="text-[14px]" style={{ color: '#8b9099' }}>Go back</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'followers', label: `Followers` },
    { key: 'following', label: `Following` },
  ] as const;

  return (
    <div className="min-h-screen bg-black pb-24">

      {/* Back button */}
      <div className="sticky top-0 z-40 bg-black border-b border-[#2f3336] px-4 h-14 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-900 transition-colors">
          <svg className="w-5 h-5" style={{ color: '#e7e9ea' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </button>
        <div>
          <p className="text-[15px] font-bold leading-none" style={{ color: '#e7e9ea' }}>
            {profile.full_name || profile.username || 'Profile'}
          </p>
          {profile.total_points > 0 && (
            <p className="text-[12px]" style={{ color: '#8b9099' }}>{profile.total_points} points</p>
          )}
        </div>
      </div>

      {/* Avatar + info */}
      <div className="px-4 pt-6 pb-4 border-b border-[#2f3336]">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#e7e9ea' }}>
                {(profile.username?.[0] || profile.full_name?.[0] || 'U').toUpperCase()}
              </span>
            )}
          </div>

          {/* Follow button */}
          <div className="flex-1 flex justify-end pt-1">
            <button
              onClick={handleFollowToggle}
              disabled={isActionLoading}
              className={`px-5 py-1.5 rounded-full text-[14px] font-bold transition-all ${
                isFollowing
                  ? 'bg-transparent border border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-red-400'
                  : 'bg-white text-black hover:bg-zinc-200'
              } ${isActionLoading ? 'opacity-50' : ''}`}
            >
              {isActionLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Name + username */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold" style={{ color: '#e7e9ea' }}>
              {profile.full_name || profile.username || 'Anonymous'}
            </h1>
            {profile.is_verified && (
              <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {profile.is_teacher && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-violet-500/15 text-violet-400 rounded-full border border-violet-500/30">
                Teacher
              </span>
            )}
          </div>
          {profile.username && (
            <p className="text-[14px] mt-0.5" style={{ color: '#8b9099' }}>@{profile.username}</p>
          )}
          {profile.follows_you && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold bg-zinc-800 text-zinc-400 rounded-full">
              Follows you
            </span>
          )}
          {profile.bio && (
            <p className="text-[15px] leading-relaxed mt-3" style={{ color: '#e7e9ea' }}>{profile.bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-5 mt-3">
          <button onClick={() => setActiveTab('followers')} className="flex items-center gap-1 hover:underline">
            <span className="text-[15px] font-bold" style={{ color: '#e7e9ea' }}>{profile.followers_count}</span>
            <span className="text-[14px]" style={{ color: '#8b9099' }}>followers</span>
          </button>
          <button onClick={() => setActiveTab('following')} className="flex items-center gap-1 hover:underline">
            <span className="text-[15px] font-bold" style={{ color: '#e7e9ea' }}>{profile.following_count}</span>
            <span className="text-[14px]" style={{ color: '#8b9099' }}>following</span>
          </button>
          {profile.current_streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-bold" style={{ color: '#e7e9ea' }}>{profile.current_streak}</span>
              <span className="text-[14px]" style={{ color: '#8b9099' }}>day streak 🔥</span>
            </div>
          )}
        </div>

        {/* Subjects */}
        {profile.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.subjects.map(s => (
              <span key={s} className="px-2.5 py-0.5 text-[12px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2f3336] sticky top-14 bg-black z-30">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 relative py-4 text-[14px] font-semibold transition-colors"
            style={{ color: activeTab === tab.key ? '#e7e9ea' : '#8b9099' }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-violet-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {activeTab === 'about' && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Points', value: profile.total_points },
                { label: 'Level', value: profile.level },
                { label: 'Streak', value: `${profile.current_streak} days 🔥` },
                { label: 'Joined', value: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
              ].map(stat => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[12px] mb-1" style={{ color: '#8b9099' }}>{stat.label}</p>
                  <p className="text-[20px] font-bold" style={{ color: '#e7e9ea' }}>{stat.value}</p>
                </div>
              ))}
            </div>
            {(profile.education_level || profile.school) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                {profile.education_level && (
                  <p className="text-[14px]" style={{ color: '#e7e9ea' }}>📚 {profile.education_level}</p>
                )}
                {profile.school && (
                  <p className="text-[14px]" style={{ color: '#e7e9ea' }}>🏫 {profile.school}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-3">
            {followers.length === 0 ? (
              <p className="text-center py-12 text-[14px]" style={{ color: '#8b9099' }}>No followers yet</p>
            ) : (
              followers.map(f => <UserCard key={f.id} user={f} onFollowChange={loadFollowers} />)
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-3">
            {following.length === 0 ? (
              <p className="text-center py-12 text-[14px]" style={{ color: '#8b9099' }}>Not following anyone yet</p>
            ) : (
              following.map(u => <UserCard key={u.id} user={u} onFollowChange={loadFollowing} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
