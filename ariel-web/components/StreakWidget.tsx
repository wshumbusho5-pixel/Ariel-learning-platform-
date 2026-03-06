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
  const [showModal, setShowModal] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(24);

  useEffect(() => {
    loadStreakData();
    // Update countdown every minute
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      const data = await achievementsAPI.getStreak();
      setStreakData(data);
      updateTimeRemaining();
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    setHoursRemaining(hours);
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

  const getStreakEmoji = (days: number) => {
    if (days === 0) return '💤';
    if (days < 3) return '🔥';
    if (days < 7) return '🔥🔥';
    if (days < 14) return '🔥🔥🔥';
    if (days < 30) return '🔥🔥🔥🔥';
    return '🔥🔥🔥🔥🔥';
  };

  const getStreakLevel = (days: number) => {
    if (days === 0) return 'No streak';
    if (days < 3) return 'Getting started';
    if (days < 7) return 'On fire';
    if (days < 14) return 'Legendary';
    if (days < 30) return 'Unstoppable';
    return 'God mode';
  };

  const isExpiringSoon = !streakData.is_active_today && hoursRemaining < 6;
  const hasStreak = streakData.current_streak > 0;

  return (
    <>
      {/* Main Widget */}
      <div
        onClick={() => setShowModal(true)}
        className={`bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:scale-105 transition-transform ${
          isExpiringSoon && hasStreak ? 'animate-pulse ring-4 ring-red-500 ring-opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-5xl">{getStreakEmoji(streakData.current_streak)}</div>
            <div>
              <h3 className="text-sm font-semibold text-white text-opacity-90">Current Streak</h3>
              <p className="text-4xl font-bold">{streakData.current_streak} days</p>
              <p className="text-xs text-white text-opacity-80">{getStreakLevel(streakData.current_streak)}</p>
            </div>
          </div>

          {streakData.is_active_today ? (
            <div className="bg-green-500 bg-opacity-30 px-4 py-2 rounded-full text-sm font-bold border-2 border-green-300">
              ✓ Active
            </div>
          ) : (
            <div className="bg-red-500 bg-opacity-40 px-4 py-2 rounded-full text-sm font-bold border-2 border-red-300 animate-bounce">
              {hoursRemaining}h left
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white border-opacity-30">
          <div>
            <p className="text-xs text-white text-opacity-80">Best</p>
            <p className="text-2xl font-bold">{streakData.longest_streak}</p>
          </div>
          <div>
            <p className="text-xs text-white text-opacity-80">Total Days</p>
            <p className="text-2xl font-bold">{streakData.total_active_days}</p>
          </div>
          <div>
            <p className="text-xs text-white text-opacity-80">Freezes</p>
            <p className="text-2xl font-bold">❄️ {streakData.freeze_cards_available}</p>
          </div>
        </div>

        {!streakData.is_active_today && hasStreak && (
          <div className="mt-4 bg-red-600 bg-opacity-40 rounded-xl p-3 border-2 border-red-300 animate-pulse">
            <p className="text-sm text-center font-bold">
              ⚠️ Study now or lose your {streakData.current_streak} day streak!
            </p>
          </div>
        )}
      </div>

      {/* Detailed Modal - Snapchat Style */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-br bg-blue-600 p-8 text-center relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
              <div className="text-8xl mb-4">{getStreakEmoji(streakData.current_streak)}</div>
              <h2 className="text-5xl font-bold text-white mb-2">
                {streakData.current_streak}
              </h2>
              <p className="text-xl text-white/90 font-semibold">
                {getStreakLevel(streakData.current_streak)}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Status */}
              {!streakData.is_active_today && hasStreak ? (
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-6xl">⏰</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-600 mb-2">Don't Lose It!</h3>
                  <p className="text-sm text-gray-600">
                    Only <span className="font-bold text-red-600">{hoursRemaining} hours</span> left to keep your streak alive!
                  </p>
                </div>
              ) : streakData.is_active_today ? (
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-6xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Streak Active!</h3>
                  <p className="text-sm text-gray-600">
                    You studied today. Keep it going tomorrow!
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-6xl">💪</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Streak!</h3>
                  <p className="text-sm text-gray-600">
                    Study today to begin your journey
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-200">
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {streakData.current_streak}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Current Streak</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-200">
                  <div className="text-4xl font-bold text-gray-900">
                    {streakData.longest_streak}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Best Streak</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-200">
                  <div className="text-4xl font-bold text-blue-600">
                    {streakData.total_active_days}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Total Days</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-200">
                  <div className="text-4xl font-bold text-cyan-600">
                    ❄️ {streakData.freeze_cards_available}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Freezes Left</div>
                </div>
              </div>

              {/* Milestone Progress */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Unlock Next Level</h4>
                <div className="space-y-3">
                  <StreakMilestone days={3} label="On fire" emoji="🔥🔥" current={streakData.current_streak} />
                  <StreakMilestone days={7} label="Legendary" emoji="🔥🔥🔥" current={streakData.current_streak} />
                  <StreakMilestone days={14} label="Unstoppable" emoji="🔥🔥🔥🔥" current={streakData.current_streak} />
                  <StreakMilestone days={30} label="God mode" emoji="🔥🔥🔥🔥🔥" current={streakData.current_streak} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    window.location.href = '/explore';
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Study Now</span>
                  <span>🔥</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Milestone Component
function StreakMilestone({ days, label, emoji, current }: { days: number; label: string; emoji: string; current: number }) {
  const isCompleted = current >= days;
  const progress = Math.min(100, (current / days) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-full ${
        isCompleted ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gray-200'
      } flex items-center justify-center flex-shrink-0 shadow-md`}>
        <span className="text-xl">{isCompleted ? '✓' : emoji.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-600'}`}>
            {days} days - {label}
          </span>
          {!isCompleted && (
            <span className="text-xs text-gray-500 font-semibold">{current}/{days}</span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              isCompleted ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-400'
            } rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
