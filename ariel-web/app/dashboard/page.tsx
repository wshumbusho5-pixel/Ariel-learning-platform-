'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';
import ArielAssistant from '@/components/ArielAssistant';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-spin" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-2 rounded-full bg-black"></div>
          </div>
          <p className="text-xl font-bold text-white animate-pulse">Loading your vibe...</p>
        </div>
      </div>
    );
  }

  const streakDays = stats?.current_streak || 0;
  const level = gamification?.level_info?.current_level || 1;
  const progress = gamification?.level_info?.progress_percentage || 0;
  const cardsDue = stats?.cards_due_today || 0;
  const accuracy = stats?.retention_rate || 0;
  const mastered = stats?.cards_mastered || 0;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-24">
      {/* Premium gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>

      {/* Animated orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Instagram-style profile header */}
        <div className="flex items-center justify-between mb-8 animate-reveal">
          <div className="flex items-center gap-4">
            {/* Story-style profile ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 p-0.5 animate-pulse">
                <div className="w-full h-full rounded-full bg-black"></div>
              </div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-1">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-3xl font-bold gradient-text">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {level}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {user?.full_name || user?.username}
              </h1>
              <p className="text-gray-400 text-sm">Level {level} Scholar 🎓</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/review')}
            className="magnetic-btn px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-full shadow-2xl hover-glow flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Study Now</span>
          </button>
        </div>

        {/* Story-style streak counter */}
        <div className="mb-8 animate-reveal" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {/* Current streak */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-red-500 p-1">
                  <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center">
                    <span className="text-2xl">🔥</span>
                    <span className="text-xs font-bold text-white">{streakDays}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Streak</p>
              </div>
            </div>

            {/* Cards due */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-1">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center">
                  <span className="text-2xl">📚</span>
                  <span className="text-xs font-bold text-white">{cardsDue}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Due</p>
            </div>

            {/* Accuracy */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-1">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center">
                  <span className="text-2xl">🎯</span>
                  <span className="text-xs font-bold text-white">{accuracy}%</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Accuracy</p>
            </div>

            {/* Mastered */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xs font-bold text-white">{mastered}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Mastered</p>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout - Instagram style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Large featured card - Level progress */}
          <div className="md:col-span-2 glass-card rounded-3xl p-8 hover-glow transition-all animate-reveal" style={{animationDelay: '0.2s'}}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Level {level}</h3>
                <p className="text-gray-400">Keep grinding! 💪</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-sm font-bold text-white shadow-xl">
                PRO
              </div>
            </div>

            {/* Circular progress ring */}
            <div className="flex items-center justify-between">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#DB2777" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
              </div>

              <div className="flex-1 ml-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total XP</span>
                    <span className="text-white font-bold">{gamification?.level_info?.total_points || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">To next level</span>
                    <span className="text-white font-bold">{gamification?.level_info?.points_to_next_level || 0} XP</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's goal */}
          <div className="glass-card rounded-3xl p-6 hover-glow transition-all animate-reveal" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h4 className="text-white font-bold">Daily Goal</h4>
                <p className="text-gray-400 text-xs">You're crushing it!</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Progress</span>
                <span className="text-white font-bold">{gamification?.daily_goal?.percentage || 0}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${gamification?.daily_goal?.percentage || 0}%` }}
                ></div>
              </div>
              <p className="text-gray-400 text-sm">
                {gamification?.daily_goal?.cards_reviewed || 0} / {gamification?.daily_goal?.daily_goal || 20} cards
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Bento style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/feed')}
            className="group glass-card rounded-3xl p-6 hover-glow transition-all text-left animate-reveal"
            style={{animationDelay: '0.4s'}}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚡</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Activity Feed</h4>
            <p className="text-gray-400 text-sm">See what's poppin'</p>
          </button>

          <button
            onClick={() => router.push('/study-rooms')}
            className="group glass-card rounded-3xl p-6 hover-glow transition-all text-left animate-reveal"
            style={{animationDelay: '0.5s'}}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🏠</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Study Rooms</h4>
            <p className="text-gray-400 text-sm">Collab with the squad</p>
          </button>

          <button
            onClick={() => router.push('/challenges')}
            className="group glass-card rounded-3xl p-6 hover-glow transition-all text-left animate-reveal"
            style={{animationDelay: '0.6s'}}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Challenges</h4>
            <p className="text-gray-400 text-sm">Compete & flex</p>
          </button>
        </div>

        {/* Recent Achievements - Instagram post style */}
        <div className="animate-reveal" style={{animationDelay: '0.7s'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">Recent Wins 🏆</h3>
            <button className="text-purple-400 text-sm font-semibold hover:text-purple-300">See all</button>
          </div>

          {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gamification?.achievements?.filter((a: any) => a.unlocked).slice(0, 6).map((achievement: any, idx: number) => (
                <div
                  key={achievement.id}
                  className="glass-card rounded-2xl p-4 hover-glow transition-all animate-reveal"
                  style={{animationDelay: `${0.8 + idx * 0.05}s`}}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3 shadow-xl">
                      <span className="text-3xl">{achievement.icon || '🏆'}</span>
                    </div>
                    <h5 className="font-bold text-white text-sm mb-1">{achievement.name}</h5>
                    <p className="text-gray-400 text-xs line-clamp-2">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏆</span>
              </div>
              <p className="text-gray-400">Start reviewing to unlock achievements!</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
