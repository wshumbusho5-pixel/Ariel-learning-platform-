'use client';

import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';
import AchievementCard from '@/components/AchievementCard';
import StreakWidget from '@/components/StreakWidget';

interface Achievement {
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  current_value: number;
  target_value: number;
  percentage: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  points_reward: number;
  shared_to_story?: boolean;
}

const categories = [
  { id: 'all', name: 'All', icon: '🏆' },
  { id: 'streak', name: 'Streaks', icon: '🔥' },
  { id: 'cards', name: 'Cards', icon: '📚' },
  { id: 'social', name: 'Social', icon: '⭐' },
  { id: 'learning', name: 'Learning', icon: '🎓' },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    loadAchievements();
  }, [selectedCategory]);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await achievementsAPI.getAchievementsList(category);
      setAchievements(data);

      // Calculate stats
      const unlocked = data.filter((a: Achievement) => a.is_unlocked).length;
      const totalPoints = data
        .filter((a: Achievement) => a.is_unlocked)
        .reduce((sum: number, a: Achievement) => sum + a.points_reward, 0);

      setStats({
        total: data.length,
        unlocked: unlocked,
        totalPoints: totalPoints,
      });
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600 text-sm mt-1">Track your progress and unlock rewards</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
              <p className="text-xs text-gray-600">Unlocked</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.unlocked}/{stats.total}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
              <p className="text-xs text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
              <p className="text-xs text-gray-600">Points</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Streak Widget */}
        <div className="mb-6">
          <StreakWidget />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Achievements Grid */}
        {!isLoading && achievements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.achievement_id}
                achievement={achievement}
                onShare={loadAchievements}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && achievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements found</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all'
                ? 'Start studying to unlock achievements!'
                : `No ${selectedCategory} achievements available.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
