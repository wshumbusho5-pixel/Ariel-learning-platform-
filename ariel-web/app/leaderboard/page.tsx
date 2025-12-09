'use client';

import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  is_verified: boolean;
  current_streak: number;
  total_points: number;
  achievements_count: number;
  is_current_user: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await achievementsAPI.getStreakLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">🏆</div>
            <div>
              <h1 className="text-3xl font-bold">Streak Leaderboard</h1>
              <p className="text-white text-opacity-90 text-sm mt-1">
                Top students by current study streak
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4 mt-6">
            <p className="text-sm text-white text-opacity-90">
              Keep your streak alive by reviewing cards every day! Compete with students worldwide.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <Link
                key={entry.user_id}
                href={`/profile/${entry.user_id}`}
                className={`block bg-white rounded-xl p-4 hover:shadow-md transition-shadow ${
                  entry.is_current_user ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getRankColor(entry.rank)}`}>
                    {getRankEmoji(entry.rank) || `#${entry.rank}`}
                  </div>

                  {/* Profile Picture */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {entry.profile_picture ? (
                      <img
                        src={entry.profile_picture}
                        alt={entry.username || entry.full_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (entry.username?.[0] || entry.full_name?.[0] || 'U').toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {entry.full_name || entry.username || 'User'}
                      </p>
                      {entry.is_verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {entry.is_current_user && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {entry.achievements_count} achievements • {entry.total_points} points
                    </p>
                  </div>

                  {/* Streak */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
                      🔥 {entry.current_streak}
                    </div>
                    <p className="text-xs text-gray-500">day streak</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && leaderboard.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No leaderboard data yet</h3>
            <p className="text-gray-600">Start your streak to appear on the leaderboard!</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How to climb the leaderboard</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Review cards every single day to build your streak</li>
                <li>• Use freeze cards (❄️) to protect your streak on busy days</li>
                <li>• Unlock achievements to earn more points</li>
                <li>• Share your progress to inspire others!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
