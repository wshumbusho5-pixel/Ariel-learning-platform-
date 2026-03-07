'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI, authAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'stats' | 'achievements'>('grid');
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

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

  const openEditSheet = () => {
    setEditName(user?.full_name || '');
    setEditUsername(user?.username || '');
    setEditBio((user as any)?.bio || '');
    setEditError('');
    setShowEditSheet(true);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await authAPI.updateProfile({
        full_name: editName.trim() || undefined,
        username: editUsername.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      await checkAuth();
      setShowEditSheet(false);
    } catch (e: any) {
      setEditError(e?.response?.data?.detail || 'Failed to save. Try again.');
    } finally {
      setEditSaving(false);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen lg:pl-[72px] bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-zinc-900">Sign in to view your profile</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-white border border-stone-200 text-sm font-semibold text-zinc-700 hover:bg-stone-100"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-stone-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400 font-medium">Loading...</p>
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
      <div className="min-h-screen pb-20 bg-stone-50 lg:pl-[72px]">
        <div className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-zinc-900">{user?.username || 'Profile'}</h1>
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
                <div className="w-24 h-24 rounded-full ring-4 ring-stone-200">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-5 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{totalCards}</p>
                    <p className="text-[11px] text-zinc-500">cards</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{cardsReviewed}</p>
                    <p className="text-[11px] text-zinc-500">reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{cardsMastered}</p>
                    <p className="text-[11px] text-zinc-500">mastered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{followers}</p>
                    <p className="text-[11px] text-zinc-500">followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{following}</p>
                    <p className="text-[11px] text-zinc-500">following</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditSheet}
                    className="flex-1 py-1 px-4 bg-white hover:bg-stone-100 text-sm font-semibold text-zinc-800 rounded-lg transition-colors border border-stone-200"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-1 px-4 bg-zinc-900 hover:bg-zinc-800 text-sm font-semibold text-zinc-300 rounded-lg transition-colors border border-stone-200"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-bold text-zinc-900 text-sm mb-0.5">
                {user?.full_name || user?.username}
              </p>
              <p className="text-sm text-zinc-500">
                Level {level} · {streakDays > 0 ? `${streakDays} day streak` : 'Start your streak'}
              </p>
              {(user as any)?.bio && (
                <p className="text-sm text-zinc-600 mt-2">{(user as any).bio}</p>
              )}
              {user?.subjects && user.subjects.length > 0 && (
                <p className="text-sm text-zinc-500 mt-1">
                  Studying {user.subjects.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              <button onClick={() => router.push('/leaderboard')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center hover:border-sky-400 transition-colors">
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">{streakDays}d streak</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center hover:border-sky-400 transition-colors">
                  <span className="text-lg">⭐</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">Level {level}</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center hover:border-sky-400 transition-colors">
                  <span className="text-lg">🏆</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">Trophies</p>
              </button>
              <button onClick={() => router.push('/deck')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center hover:border-sky-400 transition-colors">
                  <span className="text-lg">📚</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">{totalCards} cards</p>
              </button>
            </div>
          </div>

          <div className="border-t border-stone-200">
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
                      activeTab === tab ? 'border-sky-500' : 'border-transparent'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 mx-auto ${activeTab === tab ? 'text-sky-500' : 'text-stone-400'}`}
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
                <div className="aspect-square bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center">
                  <div className="text-center px-2">
                    <p className="text-sm font-semibold text-zinc-500">Create your first study post</p>
                    <p className="text-xs text-zinc-400 mt-1">Pinned decks and posts will show here.</p>
                  </div>
                </div>
                {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                  gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="aspect-square bg-white border border-stone-200 flex items-center justify-center"
                    >
                      <span className="text-4xl">{achievement.icon || '🏆'}</span>
                    </div>
                  ))
                ) : (
                  [...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-stone-100 border border-stone-200 flex items-center justify-center"
                    >
                      <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-900">Level Progress</h3>
                    <span className="text-xs font-semibold text-zinc-400">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-1000"
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
                    <div key={stat.label} className="bg-white border border-stone-200 rounded-xl p-4">
                      <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                      <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">Study Streak</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Current Streak</p>
                      <p className="text-2xl font-bold text-zinc-900">{streakDays} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Best Streak</p>
                      <p className="text-2xl font-bold text-zinc-900">{stats?.longest_streak || 0} days</p>
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
                      className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">{achievement.icon || '🏆'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-zinc-900 text-sm mb-1">{achievement.name}</h4>
                        <p className="text-xs text-zinc-500 mb-1">{achievement.description}</p>
                        {achievement.unlocked_at && (
                          <p className="text-xs text-zinc-400">
                            {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl opacity-50">🏆</span>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 mb-2">No achievements yet</h3>
                    <p className="text-sm text-zinc-500">Keep studying to unlock achievements!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Edit Profile sheet */}
      {showEditSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowEditSheet(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl pb-10 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-5">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            <div className="px-5 space-y-4 max-w-lg mx-auto">
              <h2 className="text-base font-bold text-white">Edit Profile</h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Full name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-sky-500 placeholder:text-zinc-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Username</label>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-sky-500 placeholder:text-zinc-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-sky-500 placeholder:text-zinc-600 text-sm resize-none"
                />
                <p className="text-xs text-zinc-600 text-right mt-0.5">{editBio.length}/160</p>
              </div>

              {editError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-2">{editError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-colors disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
