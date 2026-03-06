'use client';

import { useState, useEffect } from 'react';
import { achievementsAPI } from '@/lib/api';
import Link from 'next/link';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

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
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-zinc-300 text-zinc-800';
    if (rank === 3) return 'bg-orange-300 text-orange-900';
    return 'bg-zinc-800 text-zinc-400';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen lg:pl-[72px] bg-zinc-950">
        <div className="bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white">Streak Leaderboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Top students by current study streak</p>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-zinc-400">
                Keep your streak alive by reviewing cards every day! Compete with students worldwide.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-zinc-800 rounded w-32 mb-2" />
                      <div className="h-3 bg-zinc-800 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && leaderboard.length > 0 && (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <Link
                  key={entry.user_id}
                  href={`/profile/${entry.user_id}`}
                  className={`block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors ${
                    entry.is_current_user ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getRankColor(entry.rank)}`}>
                      {getRankEmoji(entry.rank) || `#${entry.rank}`}
                    </div>

                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold flex-shrink-0">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {entry.full_name || entry.username || 'User'}
                        </p>
                        {entry.is_verified && (
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {entry.is_current_user && (
                          <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {entry.achievements_count} achievements · {entry.total_points} points
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-white flex items-center gap-1">
                        🔥 {entry.current_streak}
                      </div>
                      <p className="text-xs text-zinc-500">day streak</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && leaderboard.length === 0 && (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="mb-4">
                <svg className="w-10 h-10 text-zinc-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No leaderboard data yet</h3>
              <p className="text-zinc-500">Start your streak to appear on the leaderboard!</p>
            </div>
          )}

          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex gap-3">
              <div>
                <h3 className="font-semibold text-emerald-400 mb-1">How to climb the leaderboard</h3>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>· Review cards every single day to build your streak</li>
                  <li>· Use freeze cards to protect your streak on busy days</li>
                  <li>· Unlock achievements to earn more points</li>
                  <li>· Share your progress to inspire others!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
