'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

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
      <div className="min-h-screen lg:pl-56 bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white">Sign in to view your profile</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
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
  const followers = (user as any)?.followers_count ?? (user as any)?.followers?.length ?? 0;
  const following = (user as any)?.following_count ?? (user as any)?.following?.length ?? 0;

  return (
    <>
      <SideNav />
      <div className="min-h-screen pb-20 bg-zinc-950 lg:pl-56">
        <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-white">{user?.username || 'Profile'}</h1>
            <button onClick={handleLogout}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start gap-6 mb-4">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-zinc-700 ring-4 ring-zinc-800">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-around mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{totalCards}</p>
                    <p className="text-sm text-zinc-500">cards</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{cardsReviewed}</p>
                    <p className="text-sm text-zinc-500">reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{cardsMastered}</p>
                    <p className="text-sm text-zinc-500">mastered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{followers}</p>
                    <p className="text-sm text-zinc-500">followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{following}</p>
                    <p className="text-sm text-zinc-500">following</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1 px-4 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg transition-colors border border-zinc-700"
                  >
                    Log out
                  </button>
                  <button
                    onClick={() => router.push('/achievements')}
                    className="py-1 px-4 bg-zinc-900 hover:bg-zinc-800 text-sm font-semibold text-zinc-300 rounded-lg transition-colors border border-zinc-700"
                  >
                    Achievements
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-bold text-white text-sm mb-0.5">
                {user?.full_name || user?.username}
              </p>
              <p className="text-sm text-zinc-400">
                Level {level} · {streakDays > 0 ? `${streakDays} day streak 🔥` : 'Start your streak'}
              </p>
              {(user as any)?.bio && (
                <p className="text-sm text-zinc-400 mt-2">{(user as any).bio}</p>
              )}
              {user?.subjects && user.subjects.length > 0 && (
                <p className="text-sm text-zinc-500 mt-1">
                  Studying {user.subjects.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              <button onClick={() => router.push('/leaderboard')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-emerald-500 transition-colors">
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">{streakDays}d streak</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-emerald-500 transition-colors">
                  <span className="text-lg">⭐</span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">Level {level}</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-emerald-500 transition-colors">
                  <span className="text-lg">🏆</span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">Trophies</p>
              </button>
              <button onClick={() => router.push('/deck')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-emerald-500 transition-colors">
                  <span className="text-lg">📚</span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">{totalCards} cards</p>
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-800">
            <div className="flex">
              {(['grid', 'stats', 'achievements'] as const).map((tab) => {
                const icons: Record<string, string> = {
                  grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
                  stats: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                  achievements: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 border-t-2 transition-colors ${
                      activeTab === tab ? 'border-emerald-500' : 'border-transparent'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 mx-auto ${activeTab === tab ? 'text-emerald-500' : 'text-zinc-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[tab]} />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-4">
            {activeTab === 'grid' && (
              <div className="grid grid-cols-3 gap-1">
                <div className="aspect-square bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center">
                  <div className="text-center px-2">
                    <p className="text-sm font-semibold text-zinc-400">Create your first study post</p>
                    <p className="text-xs text-zinc-600 mt-1">Pinned decks and posts will show here.</p>
                  </div>
                </div>
                {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                  gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="aspect-square bg-zinc-900 border border-zinc-800 flex items-center justify-center"
                    >
                      <span className="text-4xl">{achievement.icon || '🏆'}</span>
                    </div>
                  ))
                ) : (
                  [...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-zinc-900 border border-zinc-800 flex items-center justify-center"
                    >
                      <svg className="w-12 h-12 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Level Progress</h3>
                    <span className="text-xs font-semibold text-zinc-500">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {gamification?.level_info?.points_to_next_level || 0} XP to Level {level + 1}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Cards', value: totalCards },
                    { label: 'Reviews Done', value: cardsReviewed },
                    { label: 'Mastered', value: cardsMastered },
                    { label: 'Accuracy', value: `${stats?.retention_rate || 0}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Study Streak</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Current Streak</p>
                      <p className="text-2xl font-bold text-white">{streakDays} days 🔥</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Best Streak</p>
                      <p className="text-2xl font-bold text-white">{stats?.longest_streak || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-3">
                {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                  gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">{achievement.icon || '🏆'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm mb-1">{achievement.name}</h4>
                        <p className="text-xs text-zinc-500 mb-1">{achievement.description}</p>
                        {achievement.unlocked_at && (
                          <p className="text-xs text-zinc-600">
                            {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl opacity-70">🏆</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">No achievements yet</h3>
                    <p className="text-sm text-zinc-500">Keep studying to unlock achievements!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
