'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      if (user && !user.onboarding_completed) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats] = await Promise.all([
        progressAPI.getStats(),
        gamificationAPI.getStats(),
      ]);
      setStats(progressStats);
      setGamification(gamificationStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          await checkAuth();
          router.push('/explore');
        }}
      />
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-spin" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-2 rounded-full bg-white"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading your universe...</p>
        </div>
      </div>
    );
  }

  const streakDays = stats?.current_streak || 0;
  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8 animate-reveal">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="gradient-text">Hey {user?.full_name?.split(' ')[0] || user?.username}!</span>
              </h1>
              <p className="text-gray-600 text-lg">Ready to level up today?</p>
            </div>
            <button
              onClick={() => router.push('/review')}
              className="magnetic-btn px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl hover-glow"
            >
              ⚡ Start Session
            </button>
          </div>

          {/* Level Card */}
          <div className="glass-card p-8 rounded-3xl mb-6 animate-reveal" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                  <span className="text-4xl">🚀</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold text-gray-900">Level {level}</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">PRO</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{gamification?.level_info?.total_points || 0} total XP</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Next Level</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  {gamification?.level_info?.points_to_next_level || 0} XP
                </p>
              </div>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}></div>
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2 font-semibold">{progress}% to next level</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="neu-card p-6 hover-glow animate-reveal" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl">📚</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Cards Due</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">{stats?.cards_due_today || 0}</p>
            </div>
          </div>

          <div className="neu-card p-6 hover-glow animate-reveal" style={{animationDelay: '0.3s'}}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl">🔥</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Streak</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-transparent bg-clip-text">{streakDays}</p>
            </div>
          </div>

          <div className="neu-card p-6 hover-glow animate-reveal" style={{animationDelay: '0.4s'}}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">{stats?.retention_rate || 0}%</p>
            </div>
          </div>

          <div className="neu-card p-6 hover-glow animate-reveal" style={{animationDelay: '0.5s'}}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl">⭐</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Mastered</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{stats?.cards_mastered || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 animate-reveal" style={{animationDelay: '0.6s'}}>
          <span className="text-3xl">⚡</span> Quick Actions
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/feed')}
            className="group neu-card p-8 hover-glow text-left transition-all animate-reveal"
            style={{animationDelay: '0.7s'}}
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-4xl">⚡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Activity Feed</h4>
            <p className="text-gray-600">See what your friends are learning</p>
          </button>

          <button
            onClick={() => router.push('/study-rooms')}
            className="group neu-card p-8 hover-glow text-left transition-all animate-reveal"
            style={{animationDelay: '0.8s'}}
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-4xl">🏠</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Study Rooms</h4>
            <p className="text-gray-600">Study together, learn faster</p>
          </button>

          <button
            onClick={() => router.push('/challenges')}
            className="group neu-card p-8 hover-glow text-left transition-all animate-reveal"
            style={{animationDelay: '0.9s'}}
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-4xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Challenges</h4>
            <p className="text-gray-600">Compete and earn rewards</p>
          </button>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="glass-card p-8 rounded-3xl animate-reveal" style={{animationDelay: '1s'}}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">🎯</span> Daily Goal
              </h3>
              <p className="text-gray-600 mt-1">Keep the momentum going!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                {gamification?.daily_goal?.percentage || 0}%
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 font-semibold">
              {gamification?.daily_goal?.cards_reviewed || 0} / {gamification?.daily_goal?.daily_goal || 20} cards
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
              {(gamification?.daily_goal?.daily_goal || 20) - (gamification?.daily_goal?.cards_reviewed || 0)} left
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000"
              style={{ width: `${gamification?.daily_goal?.percentage || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 animate-reveal" style={{animationDelay: '1.1s'}}>
          <span className="text-3xl">🏆</span> Recent Achievements
        </h3>
        {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {gamification?.achievements?.filter((a: any) => a.unlocked).slice(0, 6).map((achievement: any, idx: number) => (
              <div
                key={achievement.id}
                className="glass-card p-6 rounded-3xl hover-glow animate-reveal"
                style={{animationDelay: `${1.2 + idx * 0.1}s`}}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-3xl">{achievement.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{achievement.name}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center animate-reveal" style={{animationDelay: '1.2s'}}>
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl opacity-50">🏆</span>
            </div>
            <p className="text-gray-600 text-lg">Complete reviews to unlock achievements!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
