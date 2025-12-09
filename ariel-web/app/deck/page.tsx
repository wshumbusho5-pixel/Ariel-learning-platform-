'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardFeed from '@/components/CardFeed';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/useAuth';
import { cardsAPI } from '@/lib/api';

interface DeckStats {
  total_cards: number;
  new_cards: number;
  due_today: number;
  mastered: number;
  by_subject: Record<string, number>;
  by_topic: Record<string, number>;
}

export default function DeckPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await cardsAPI.getDeckStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load deck stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
        <div className="text-center animate-slideUp">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to view your deck</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Create an account to save and review your flashcards</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            My Deck
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            Your personal flashcard collection
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow animate-slideUp">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.total_cards}
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Total Cards</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow animate-slideUp" style={{ animationDelay: '0.05s' }}>
              <div className="text-3xl font-bold text-blue-600">{stats.new_cards}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">New</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl font-bold text-orange-600">{stats.due_today}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Due Today</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <div className="text-3xl font-bold text-green-600">{stats.mastered}</div>
              <div className="text-xs text-gray-600 mt-1 font-medium">Mastered</div>
            </div>
          </div>

          {/* Subject Distribution */}
          {Object.keys(stats.by_subject).length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-sm font-bold text-gray-900 mb-3">By Subject</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_subject).map(([subject, count]) => (
                  <div
                    key={subject}
                    className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full hover:shadow-md transition-shadow"
                  >
                    <span className="font-semibold text-gray-900">{subject}</span>
                    <span className="text-gray-600 ml-1.5 text-sm">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Review Button */}
          {stats.due_today > 0 && (
            <button
              onClick={() => router.push('/review')}
              className="w-full mb-6 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl animate-slideUp"
              style={{ animationDelay: '0.25s' }}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Review Session ({stats.due_today} cards due)</span>
              </div>
            </button>
          )}

          <h2 className="text-lg font-bold text-gray-900 mb-4">All Cards</h2>
        </div>
      )}

      {/* Cards Feed */}
      <div className="max-w-2xl mx-auto px-4">
        <CardFeed type="my-deck" />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
