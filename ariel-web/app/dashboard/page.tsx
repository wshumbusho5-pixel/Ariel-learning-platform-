'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';
import ArielAssistant from '@/components/ArielAssistant';
import ArielSpotlight from '@/components/ArielSpotlight';
import Link from 'next/link';

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

      const timeoutId = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats] = await Promise.all([
        progressAPI.getStats().catch(() => null),
        gamificationAPI.getStats().catch(() => null),
      ]);
      setStats(progressStats || {});
      setGamification(gamificationStats || {});
    } catch (error) {
      setStats({});
      setGamification({});
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Loading...</p>
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
  const totalPoints = gamification?.level_info?.total_points || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header - Instagram Style */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Ariel
            </h1>

            {/* Action Icons */}
            <div className="flex items-center gap-4">
              <button className="relative">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="relative">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Section - Instagram Style */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {/* Your Story */}
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900">Your Story</p>
            </button>

            {/* Streak Story */}
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-3xl">🔥</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900">{streakDays} Days</p>
            </button>

            {/* Level Story */}
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {level}
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900">Level {level}</p>
            </button>

            {/* Mastered Story */}
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-3xl">⭐</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900">{mastered} Cards</p>
            </button>

            {/* Accuracy Story */}
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900">{accuracy}%</p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 pb-24">
        {/* Ariel AI Spotlight */}
        <div className="mb-6">
          <ArielSpotlight />
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/create-cards"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              Create cards from URL / PDF / Image
            </Link>
            <Link
              href="/explore"
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold hover:bg-gray-50 transition"
            >
              Explore decks
            </Link>
          </div>
        </div>

        {/* Stats Cards - Instagram Post Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔥</span>
              <div className="px-2 py-1 bg-orange-100 rounded-full">
                <p className="text-xs font-bold text-orange-600">STREAK</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{streakDays}</p>
            <p className="text-xs text-gray-600">Day streak</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📚</span>
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <p className="text-xs font-bold text-blue-600">DUE</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{cardsDue}</p>
            <p className="text-xs text-gray-600">Cards due</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⭐</span>
              <div className="px-2 py-1 bg-green-100 rounded-full">
                <p className="text-xs font-bold text-green-600">DONE</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{mastered}</p>
            <p className="text-xs text-gray-600">Mastered</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎯</span>
              <div className="px-2 py-1 bg-purple-100 rounded-full">
                <p className="text-xs font-bold text-purple-600">RATE</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{accuracy}%</p>
            <p className="text-xs text-gray-600">Accuracy</p>
          </div>
        </div>

        {/* Level Progress - Instagram Post */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Level {level} Scholar</h3>
              <p className="text-sm text-gray-600">{totalPoints} total XP</p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
              <p className="text-white text-sm font-bold">{progress}%</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {gamification?.level_info?.points_to_next_level || 0} XP to Level {level + 1}
          </p>
        </div>

        {/* Quick Actions - Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => router.push('/explore')}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">🔍</span>
              <svg className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Explore</h3>
            <p className="text-sm text-white/80">Learn something new</p>
          </button>

          <button
            onClick={() => router.push('/review')}
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">⚡</span>
              <svg className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Study Now</h3>
            <p className="text-sm text-white/80">{cardsDue} cards waiting</p>
          </button>

          <button
            onClick={() => router.push('/study-rooms')}
            className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">🏠</span>
              <svg className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Study Rooms</h3>
            <p className="text-sm text-white/80">Join the community</p>
          </button>

          <button
            onClick={() => router.push('/challenges')}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">🎯</span>
              <svg className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Challenges</h3>
            <p className="text-sm text-white/80">Compete & win</p>
          </button>
        </div>

        {/* Recent Achievements - Instagram Grid */}
        {gamification?.achievements?.filter((a: any) => a.unlocked).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Achievements</h3>
              <button className="text-sm font-semibold text-purple-600">View All</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {gamification?.achievements?.filter((a: any) => a.unlocked).slice(0, 6).map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="aspect-square bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <span className="text-4xl mb-2">{achievement.icon || '🏆'}</span>
                  <p className="text-xs font-bold text-white line-clamp-2">{achievement.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
