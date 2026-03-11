'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI, authAPI, cardsAPI, reelsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'stats' | 'achievements'>('grid');
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [myCards, setMyCards] = useState<any[]>([]);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      loadData();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  const loadData = async () => {
    // Refresh user data to get live follower/following counts
    checkAuth();

    const results = await Promise.allSettled([
      progressAPI.getStats(),
      gamificationAPI.getStats(),
      cardsAPI.getMyDeck({ limit: 50 }),
      reelsAPI.getMyReels(50),
    ]);

    if (results[0].status === 'fulfilled') setStats(results[0].value);
    if (results[1].status === 'fulfilled') setGamification(results[1].value);
    if (results[2].status === 'fulfilled') {
      const d = results[2].value;
      setMyCards(Array.isArray(d) ? d : d?.cards ?? []);
    }
    if (results[3].status === 'fulfilled') {
      const d = results[3].value;
      setMyReels(Array.isArray(d) ? d : []);
    }
    setLoading(false);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError('');
    setAvatarBroken(false);
    try {
      await authAPI.uploadProfilePicture(file);
      await checkAuth();
    } catch (err: any) {
      setAvatarError(err?.response?.data?.detail || 'Upload failed. Try again.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen lg:pl-[72px] bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-zinc-700">Sign in to view your profile</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-zinc-100 border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-violet-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;
  const totalCards = myCards.length || stats?.total_cards || 0;
  const cardsReviewed = stats?.total_reviews || 0;
  const cardsMastered = stats?.cards_mastered || 0;
  const streakDays = stats?.current_streak || 0;
  const followers = (user as any)?.followers_count ?? (user as any)?.followers?.length ?? 0;
  const following = (user as any)?.following_count ?? (user as any)?.following?.length ?? 0;

  return (
    <>
      <SideNav />
      <div className="min-h-screen pb-20 bg-white lg:pl-[72px]">

        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')}>
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-black text-zinc-900">{user?.username || 'Profile'}</h1>
            <button onClick={handleLogout}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">

          {/* Profile header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-start gap-6 mb-4">
              <div className="flex-shrink-0">
                <label className="relative w-24 h-24 block cursor-pointer group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                  <div className="w-24 h-24 rounded-full ring-2 ring-gray-200 overflow-hidden">
                    {avatarUploading ? (
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-400 rounded-full animate-spin" />
                      </div>
                    ) : user?.profile_picture && !avatarBroken ? (
                      <img
                        src={user.profile_picture}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarBroken(true)}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </label>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-3 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-black text-zinc-900">{totalCards}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">cards</p>
                  </div>
                  <button onClick={() => router.push('/profile/followers')} className="text-center">
                    <p className="text-xl font-black text-zinc-900">{followers}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">followers</p>
                  </button>
                  <button onClick={() => router.push('/profile/following')} className="text-center">
                    <p className="text-xl font-black text-zinc-900">{following}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">following</p>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditSheet}
                    className="flex-1 py-1.5 px-4 bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-zinc-800 rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-1.5 px-4 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-zinc-500 rounded-lg transition-colors border border-gray-200"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>

            {avatarError && (
              <p className="text-xs text-red-500 mb-3">{avatarError}</p>
            )}

            <div className="mb-4">
              <p className="text-[17px] font-black text-zinc-900 mb-0.5">
                {user?.full_name || user?.username}
              </p>
              <p className="text-sm text-zinc-400">
                Level {level} · {streakDays > 0 ? `${streakDays} day streak` : 'Start your streak'}
              </p>
              {(user as any)?.bio && (
                <p className="text-sm text-zinc-600 mt-1.5">{(user as any).bio}</p>
              )}
              {user?.subjects && user.subjects.length > 0 && (
                <p className="text-sm text-zinc-400 mt-1">
                  Studying {user.subjects.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            {/* Highlight bubbles */}
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => router.push('/leaderboard')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center hover:border-violet-300 transition-colors">
                  <span className="text-xl">🔥</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">{streakDays}d streak</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center hover:border-violet-300 transition-colors">
                  <span className="text-xl">⭐</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Level {level}</p>
              </button>
              <button onClick={() => router.push('/achievements')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center hover:border-violet-300 transition-colors">
                  <span className="text-xl">🏆</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Trophies</p>
              </button>
              <button onClick={() => router.push('/deck')} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center hover:border-violet-300 transition-colors">
                  <span className="text-xl">📚</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">{totalCards} cards</p>
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-t border-gray-100">
            <div className="flex">
              {(['grid', 'reels', 'stats', 'achievements'] as const).map((tab) => {
                const icons: Record<string, string> = {
                  grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
                  reels: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
                  stats: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                  achievements: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 border-b-2 transition-colors ${
                      activeTab === tab ? 'border-zinc-900' : 'border-transparent'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 mx-auto ${activeTab === tab ? 'text-zinc-900' : 'text-zinc-300'}`}
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

            {/* Cards grid — 2 columns, tall enough to read */}
            {activeTab === 'grid' && (
              myCards.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎴</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-700 mb-1">No cards yet</p>
                  <p className="text-xs text-zinc-400">Cards you create will appear here.</p>
                  <button
                    onClick={() => router.push('/create-cards')}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors"
                  >
                    Create cards
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {myCards.map((card: any) => (
                    <div
                      key={card.id}
                      onClick={() => router.push('/deck')}
                      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all"
                      style={{ minHeight: '140px' }}
                    >
                      {card.subject && (
                        <span className="inline-block text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                          {card.subject}
                        </span>
                      )}
                      <p className="text-[13px] text-zinc-800 font-semibold leading-snug line-clamp-4">
                        {card.question}
                      </p>
                      {card.answer && (
                        <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-snug">
                          {card.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Reels grid */}
            {activeTab === 'reels' && (
              myReels.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎬</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-700 mb-1">No reels yet</p>
                  <p className="text-xs text-zinc-400">Reels you upload will appear here.</p>
                  <button
                    onClick={() => router.push('/reels/upload')}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors"
                  >
                    Upload reel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {myReels.map((reel: any) => {
                    const thumb = reel.thumbnail_url?.replace(/^https?:\/\/[^/]+/, '');
                    return (
                      <div
                        key={reel.id}
                        onClick={() => router.push('/reels')}
                        className="aspect-[9/16] bg-gray-100 rounded relative overflow-hidden cursor-pointer group"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {thumb && (
                          <img src={thumb} alt={reel.title} className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[9px] text-white font-semibold truncate">{reel.title}</p>
                          <p className="text-[8px] text-white/60">{reel.views || 0} views</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Stats */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-black text-zinc-900">Level Progress</h3>
                    <span className="text-xs font-semibold text-zinc-500">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
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
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-base font-black text-zinc-900 mb-3">Study Streak</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Current</p>
                      <p className="text-2xl font-black text-zinc-900">{streakDays} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Best</p>
                      <p className="text-2xl font-black text-zinc-900">{stats?.longest_streak || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            {activeTab === 'achievements' && (
              <div className="space-y-3">
                {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
                  gamification.achievements.filter((a: any) => a.unlocked).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">{achievement.icon || '🏆'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 text-sm mb-1">{achievement.name}</h4>
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
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl opacity-40">🏆</span>
                    </div>
                    <h3 className="text-base font-black text-zinc-900 mb-2">No achievements yet</h3>
                    <p className="text-sm text-zinc-400">Keep studying to unlock achievements!</p>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full bg-white rounded-t-3xl pb-10 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-5">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 space-y-4 max-w-lg mx-auto">
              <h2 className="text-base font-black text-zinc-900">Edit Profile</h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Full name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-zinc-900 rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Username</label>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-zinc-900 rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-400 text-sm"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-zinc-900 rounded-xl focus:outline-none focus:border-violet-400 placeholder:text-zinc-400 text-sm resize-none"
                />
                <p className="text-xs text-zinc-400 text-right mt-0.5">{editBio.length}/160</p>
              </div>

              {editError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{editError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-zinc-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-colors disabled:opacity-60"
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
