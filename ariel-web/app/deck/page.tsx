'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardFeed from '@/components/CardFeed';
import BottomNav from '@/components/BottomNav';
import ArielAssistant from '@/components/ArielAssistant';
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">Create an account to save and review your flashcards</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Instagram-style Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-900">My Deck</h1>
        </div>
      </header>

      {/* Stats Cards - Instagram Stories Style */}
      {!loading && stats && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Horizontal Scrollable Stats */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 mb-4">
            <div className="flex-shrink-0 w-28">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total_cards}</div>
                <div className="text-xs text-gray-600 mt-1">Total</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-28">
              <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.new_cards}</div>
                <div className="text-xs text-gray-600 mt-1">New</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-28">
              <div className="bg-white border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.due_today}</div>
                <div className="text-xs text-gray-600 mt-1">Due Today</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-28">
              <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
                <div className="text-xs text-gray-600 mt-1">Mastered</div>
              </div>
            </div>
          </div>

          {/* Subject Tags */}
          {Object.keys(stats.by_subject).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_subject).map(([subject, count]) => (
                  <div
                    key={subject}
                    className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm"
                  >
                    <span className="font-semibold text-gray-900">{subject}</span>
                    <span className="text-gray-600 ml-1">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Review Button */}
          {stats.due_today > 0 && (
            <button
              onClick={() => router.push('/review')}
              className="w-full mb-4 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Review {stats.due_today} cards</span>
            </button>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">All Cards</h2>
            <span className="text-sm text-gray-600">{stats.total_cards} total</span>
          </div>
        </div>
      )}

      {/* Cards Feed - Instagram Grid Style */}
      <div className="max-w-2xl mx-auto px-4">
        <CardFeed type="my-deck" />
      </div>

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
