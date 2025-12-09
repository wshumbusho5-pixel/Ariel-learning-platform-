'use client';

import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  last_activity_date: string | null;
  streak_start_date: string | null;
  freeze_cards_available: number;
  is_active_today: boolean;
}

export default function StreakWidget() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      const data = await achievementsAPI.getStreak();
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white animate-pulse">
        <div className="h-8 bg-white bg-opacity-30 rounded mb-2 w-24" />
        <div className="h-12 bg-white bg-opacity-30 rounded" />
      </div>
    );
  }

  if (!streakData) return null;

  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-4xl">🔥</div>
          <div>
            <h3 className="text-sm font-medium text-white text-opacity-90">Current Streak</h3>
            <p className="text-3xl font-bold">{streakData.current_streak} days</p>
          </div>
        </div>

        {streakData.is_active_today && (
          <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium">
            Active Today ✓
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white border-opacity-20">
        <div>
          <p className="text-xs text-white text-opacity-70">Longest</p>
          <p className="text-xl font-bold">{streakData.longest_streak}</p>
        </div>
        <div>
          <p className="text-xs text-white text-opacity-70">Total Days</p>
          <p className="text-xl font-bold">{streakData.total_active_days}</p>
        </div>
        <div>
          <p className="text-xs text-white text-opacity-70">Freezes</p>
          <p className="text-xl font-bold">❄️ {streakData.freeze_cards_available}</p>
        </div>
      </div>

      {!streakData.is_active_today && (
        <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
          <p className="text-sm text-center">
            Review cards today to keep your streak alive!
          </p>
        </div>
      )}
    </div>
  );
}
