'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import ArielAssistant from '@/components/ArielAssistant';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'stats' | 'achievements'>('grid');

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      loadData();
    } else if (!isLoading) {
      // Not authenticated; stop local spinner so the prompt can show
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats] = await Promise.all([
        progressAPI.getStats(),
        gamificationAPI.getStats(),
      ]);
      setStats(progressStats);
      setGamification(gamificationStats);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-900" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Sign in to view your profile</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold hover:bg-slate-50"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-900" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;
  const totalCards = stats?.total_cards || 0;
  const cardsReviewed = stats?.total_reviews || 0;
  const cardsMastered = stats?.cards_mastered || 0;
  const streakDays = stats?.current_streak || 0;
  // Fallback to optional fields; backend may return either counts or arrays
  const followers = (user as any)?.followers_count ?? (user as any)?.followers?.length ?? 0;
  const following = (user as any)?.following_count ?? (user as any)?.following?.length ?? 0;

  return (
    <div className="min-h-screen pb-20 text-slate-900" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header with subtle accent */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')}>
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{user?.username || 'Profile'}</h1>
          <button onClick={handleLogout}>
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Instagram Profile Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-6 mb-4">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-0.5 shadow-[0_0_0_6px_rgba(255,255,255,0.8)]">
                <div className="w-full h-full rounded-full bg-white p-1 shadow-inner">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instagram Stats */}
            <div className="flex-1">
              <div className="flex items-center justify-around mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{totalCards}</p>
                  <p className="text-sm text-slate-500">cards</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{cardsReviewed}</p>
                  <p className="text-sm text-slate-500">reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{cardsMastered}</p>
                  <p className="text-sm text-slate-500">mastered</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{followers}</p>
                  <p className="text-sm text-slate-500">followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{following}</p>
                  <p className="text-sm text-slate-500">following</p>
                </div>
              </div>

              {/* Edit Profile & Settings Buttons (Instagram-style) */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/settings')}
                  className="flex-1 py-1 px-4 bg-white text-slate-800 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors border border-slate-300"
                >
                  Edit profile
                </button>
                <button
                  onClick={handleLogout}
                  className="py-1 px-4 bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-900 rounded-lg transition-colors border border-slate-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mb-4">
            <p className="font-bold text-slate-900 text-sm mb-0.5">
              {user?.full_name || user?.username}
            </p>
            <p className="text-sm text-slate-600">
              Level {level} • {streakDays} day streak 🔥
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Learning every day to become 70% smarter 🚀
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {user?.subjects && user.subjects.length
                ? `Studying ${user.subjects.slice(0, 3).join(', ')}`
                : 'Sharing flashcards & study tips daily.'}
            </p>
          </div>

          {/* Story Highlights (Instagram-style) */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200/70 flex items-center justify-center opacity-70">
                <span className="text-lg">🔥</span>
              </div>
              <p className="text-xs text-slate-900 font-medium">Streak</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200/70 flex items-center justify-center opacity-70">
                <span className="text-lg">⭐</span>
              </div>
              <p className="text-xs text-slate-900 font-medium">Level {level}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200/70 flex items-center justify-center opacity-70">
                <span className="text-lg">🏆</span>
              </div>
              <p className="text-xs text-slate-900 font-medium">Trophies</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200/70 flex items-center justify-center opacity-70">
                <span className="text-lg">📚</span>
              </div>
              <p className="text-xs text-slate-900 font-medium">Cards</p>
            </div>
          </div>
        </div>

        {/* Instagram-style Tabs */}
        <div className="border-t border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-3 border-t-2 transition-colors ${
                activeTab === 'grid'
                  ? 'border-slate-900'
                  : 'border-transparent'
              }`}
            >
              <svg
                className={`w-6 h-6 mx-auto ${activeTab === 'grid' ? 'text-slate-900' : 'text-slate-400'}`}
                fill={activeTab === 'grid' ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 border-t-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-slate-900'
                  : 'border-transparent'
              }`}
            >
              <svg
                className={`w-6 h-6 mx-auto ${activeTab === 'stats' ? 'text-slate-900' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-3 border-t-2 transition-colors ${
                activeTab === 'achievements'
                  ? 'border-slate-900'
                  : 'border-transparent'
              }`}
            >
              <svg
                className={`w-6 h-6 mx-auto ${activeTab === 'achievements' ? 'text-slate-900' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4">
          {/* Grid View (Instagram 3-column grid) */}
          {activeTab === 'grid' && (
            <div className="grid grid-cols-3 gap-1">
              {/* Pinned/CTA tile */}
              <div className="aspect-square bg-white flex items-center justify-center border border-dashed border-slate-300">
                <div className="text-center px-2">
                  <p className="text-sm font-semibold text-slate-900">Create your first study post</p>
                  <p className="text-xs text-slate-500 mt-1">Pinned decks and posts will show here.</p>
                </div>
              </div>
              {/* Achievement Grid */}
              {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any, idx: number) => (
                  <div
                    key={achievement.id}
                    className="aspect-square bg-white flex items-center justify-center border border-slate-200"
                  >
                    <span className="text-4xl">{achievement.icon || '🏆'}</span>
                  </div>
                ))
              ) : (
                <>
                  {/* Empty state placeholders (Instagram-style) */}
                  {[...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-slate-100 flex items-center justify-center border border-slate-200"
                    >
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Stats View */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Level Progress */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Level Progress</h3>
                  <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">
                  {gamification?.level_info?.points_to_next_level || 0} XP to Level {level + 1}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">{totalCards}</p>
                  <p className="text-xs text-slate-600 mt-1">Total Cards</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">{cardsReviewed}</p>
                  <p className="text-xs text-slate-600 mt-1">Reviews Done</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">{cardsMastered}</p>
                  <p className="text-xs text-slate-600 mt-1">Mastered</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">{stats?.retention_rate || 0}%</p>
                  <p className="text-xs text-slate-600 mt-1">Accuracy</p>
                </div>
              </div>

              {/* Streak Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Study Streak</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Current Streak</p>
                    <p className="text-2xl font-bold text-slate-900">{streakDays} days 🔥</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Best Streak</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.longest_streak || 0} days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements View */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4 shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">{achievement.icon || '🏆'}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">{achievement.name}</h4>
                      <p className="text-xs text-slate-600 mb-1">{achievement.description}</p>
                      {achievement.unlocked_at && (
                        <p className="text-xs text-slate-500">
                          {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl opacity-70">🏆</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">No achievements yet</h3>
                  <p className="text-sm text-slate-600">Keep studying to unlock achievements!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
