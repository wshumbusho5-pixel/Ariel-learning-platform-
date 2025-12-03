'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name || user?.username}!</h1>
              <p className="text-sm text-gray-600 mt-1">Ready to continue learning?</p>
            </div>
            <button
              onClick={() => router.push('/review')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Start Review
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Level & Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Level {gamification?.level_info?.current_level || 1}
              </h2>
              <p className="text-sm text-gray-600">
                {gamification?.level_info?.total_points || 0} total points
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Next Level</p>
              <p className="text-lg font-semibold text-blue-600">
                {gamification?.level_info?.points_to_next_level || 0} points away
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${gamification?.level_info?.progress_percentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cards Due</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.cards_due_today || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.current_streak || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retention</p>
                <p className="text-3xl font-bold text-green-600">{stats?.retention_rate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mastered</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.cards_mastered || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goal</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {gamification?.daily_goal?.cards_reviewed || 0} / {gamification?.daily_goal?.daily_goal || 20} cards
            </span>
            <span className="text-sm font-medium text-blue-600">
              {gamification?.daily_goal?.percentage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${gamification?.daily_goal?.percentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {gamification?.achievements?.filter((a: any) => a.unlocked).slice(0, 6).map((achievement: any) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <span className="text-3xl">{achievement.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{achievement.name}</p>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
          {gamification?.achievements?.filter((a: any) => a.unlocked).length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Complete reviews to unlock achievements!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
