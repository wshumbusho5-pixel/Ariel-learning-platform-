'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import ArielAssistant from '@/components/ArielAssistant';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  reward_points: number;
  participants_count: number;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  profile_picture?: string;
  progress: number;
  completed: boolean;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8003/api/challenges/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8003/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadChallenges();
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const loadLeaderboard = async (challengeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8003/api/challenges/${challengeId}/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'cards_reviewed':
        return '📚';
      case 'streak_days':
        return '🔥';
      case 'study_time':
        return '⏰';
      case 'achievements':
        return '🏆';
      case 'perfect_scores':
        return '💯';
      default:
        return '🎯';
    }
  };

  const getChallengeColor = (type: string) => {
    switch (type) {
      case 'cards_reviewed':
        return 'from-blue-500 to-cyan-500';
      case 'streak_days':
        return 'from-orange-500 to-red-500';
      case 'study_time':
        return 'from-purple-500 to-pink-500';
      case 'achievements':
        return 'from-yellow-500 to-orange-500';
      case 'perfect_scores':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-spin" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-2 rounded-full bg-white"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pb-24">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 animate-reveal">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center shadow-xl">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Weekly Challenges
              </h1>
              <p className="text-sm text-gray-600 font-semibold">Compete and earn rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {challenges.length === 0 ? (
          <div className="text-center py-20 animate-reveal">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
              <span className="text-6xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No active challenges</h3>
            <p className="text-gray-600">Check back soon for new challenges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge, idx) => {
              const daysRemaining = getDaysRemaining(challenge.end_date);
              const isExpiringSoon = daysRemaining <= 2;

              return (
                <div
                  key={challenge.id}
                  className="neu-card p-6 hover-glow transition-all animate-reveal"
                  style={{animationDelay: `${idx * 0.1}s`}}
                >
                  {/* Challenge Icon */}
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${getChallengeColor(challenge.challenge_type)} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <span className="text-4xl">{getChallengeIcon(challenge.challenge_type)}</span>
                  </div>

                  {/* Challenge Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span>{challenge.participants_count} joined</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-yellow-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{challenge.reward_points} pts</span>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{daysRemaining} days left</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => joinChallenge(challenge.id)}
                      className={`flex-1 py-3 bg-gradient-to-r ${getChallengeColor(challenge.challenge_type)} text-white rounded-2xl font-bold shadow-lg hover-glow transition-all magnetic-btn`}
                    >
                      Join Challenge
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        loadLeaderboard(challenge.id);
                      }}
                      className="px-4 py-3 glass-card rounded-2xl font-bold hover-glow transition-all magnetic-btn text-2xl"
                    >
                      🏆
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover-glow magnetic-btn"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-yellow-100 to-orange-100'
                      : 'bg-white/50'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg'
                      : entry.rank === 2
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg'
                      : entry.rank === 3
                      ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </div>

                  {/* Profile */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    {entry.profile_picture ? (
                      <img
                        src={entry.profile_picture}
                        alt={entry.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {entry.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{entry.username}</p>
                    <p className="text-sm text-gray-600">Progress: {entry.progress}</p>
                  </div>

                  {/* Completed Badge */}
                  {entry.completed && (
                    <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      ✓ DONE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
