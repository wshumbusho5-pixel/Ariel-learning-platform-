'use client';

import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';
import AchievementCard from '@/components/AchievementCard';
import StreakWidget from '@/components/StreakWidget';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

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
  const [stats, setStats] = useState({ total: 0, unlocked: 0, totalPoints: 0 });

  useEffect(() => {
    loadAchievements();
  }, [selectedCategory]);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await achievementsAPI.getAchievementsList(category);
      setAchievements(data);

      const unlocked = data.filter((a: Achievement) => a.is_unlocked).length;
      const totalPoints = data
        .filter((a: Achievement) => a.is_unlocked)
        .reduce((sum: number, a: Achievement) => sum + a.points_reward, 0);
      setStats({ total: data.length, unlocked, totalPoints });
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen lg:pl-[72px] bg-[#09090b] page-enter">
        <div className="bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-zinc-500 text-sm mt-1">Track your progress and unlock rewards</p>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Unlocked</p>
                <p className="text-2xl font-bold text-violet-300">
                  {stats.unlocked}/{stats.total}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Completion</p>
                <p className="text-2xl font-bold text-violet-300">
                  {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Points</p>
                <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <StreakWidget />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-violet-400 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          )}

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

          {!isLoading && achievements.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">No achievements found</h3>
              <p className="text-zinc-500">
                {selectedCategory === 'all'
                  ? 'Start studying to unlock achievements!'
                  : `No ${selectedCategory} achievements available.`}
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
