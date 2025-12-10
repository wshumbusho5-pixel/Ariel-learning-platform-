'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'settings'>('stats');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-spin" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-2 rounded-full bg-white"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;
  const streakDays = stats?.current_streak || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-24">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header with Profile Info */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 opacity-10"></div>

        <div className="relative max-w-4xl mx-auto px-6 py-12">
          {/* Profile Card */}
          <div className="glass-card rounded-3xl p-8 mb-6 animate-reveal">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-50"></div>
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-2xl">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full rounded-3xl object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-5xl">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-lg">{level}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {user?.full_name || user?.username}
                </h1>
                {user?.username && user?.full_name && (
                  <p className="text-gray-600 text-lg mb-3">@{user.username}</p>
                )}
                {user?.email && (
                  <p className="text-gray-500 text-sm mb-4">{user.email}</p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-2xl">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="text-xs text-gray-600">Streak</p>
                      <p className="font-bold text-gray-900">{streakDays} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-2xl">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-xs text-gray-600">Level</p>
                      <p className="font-bold text-gray-900">{level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-2xl">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-xs text-gray-600">XP</p>
                      <p className="font-bold text-gray-900">{gamification?.level_info?.total_points || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Button */}
              <button
                onClick={handleLogout}
                className="magnetic-btn px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold shadow-xl hover-glow"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Level Progress */}
          <div className="glass-card p-6 rounded-3xl mb-6 animate-reveal" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Level Progress</h3>
              <span className="text-sm text-gray-600 font-semibold">{progress}%</span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {gamification?.level_info?.points_to_next_level || 0} XP to Level {level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative max-w-4xl mx-auto px-6 mb-6">
        <div className="glass-card rounded-2xl p-1.5 flex gap-1.5 animate-reveal" style={{animationDelay: '0.2s'}}>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-5 py-2.5 rounded-xl font-bold text-sm transition-all magnetic-btn ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-5 py-2.5 rounded-xl font-bold text-sm transition-all magnetic-btn ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏆 Achievements
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-5 py-2.5 rounded-xl font-bold text-sm transition-all magnetic-btn ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative max-w-4xl mx-auto px-6">
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4 animate-reveal">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neu-card p-6 hover-glow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl">📚</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Cards</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">
                    {stats?.total_cards || 0}
                  </p>
                </div>
              </div>

              <div className="neu-card p-6 hover-glow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl">✅</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Reviewed</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">
                    {stats?.total_reviews || 0}
                  </p>
                </div>
              </div>

              <div className="neu-card p-6 hover-glow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl">⭐</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Mastered</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                    {stats?.cards_mastered || 0}
                  </p>
                </div>
              </div>

              <div className="neu-card p-6 hover-glow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-transparent bg-clip-text">
                    {stats?.retention_rate || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="neu-card p-6 hover-glow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Study Streak</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">
                    {streakDays} days 🔥
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Longest Streak</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.longest_streak || 0} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="animate-reveal">
            {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {gamification?.achievements?.filter((a: any) => a.unlocked).map((achievement: any, idx: number) => (
                  <div
                    key={achievement.id}
                    className="neu-card p-6 hover-glow animate-reveal"
                    style={{animationDelay: `${idx * 0.05}s`}}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl flex-shrink-0">
                        <span className="text-4xl">{achievement.icon || '🏆'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{achievement.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        {achievement.unlocked_at && (
                          <p className="text-xs text-gray-500">
                            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neu-card p-12 rounded-3xl text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl opacity-50">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-gray-600">Keep studying to unlock achievements!</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-reveal">
            <div className="neu-card p-6 hover-glow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="neu-card p-6 hover-glow">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Study Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Daily Goal</p>
                    <p className="text-sm text-gray-600">Cards to review per day</p>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl">
                    <span className="font-bold text-gray-900">{gamification?.daily_goal?.daily_goal || 20}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full magnetic-btn px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold shadow-xl hover-glow"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
