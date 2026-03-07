'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardFeed from '@/components/CardFeed';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/useAuth';
import { cardsAPI } from '@/lib/api';
import SideNav from '@/components/SideNav';

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
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

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
      <div className="min-h-screen lg:pl-[72px] bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Create an account to save and review your flashcards</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const subjects = stats ? Object.keys(stats.by_subject || {}) : [];

  return (
    <>
      <SideNav />

      {/* Snap-scroll card feed — full screen */}
      <CardFeed type="my-deck" subjectFilter={subjectFilter} snapScroll />

      {/* Overlay header — floats above the feed */}
      <div className="fixed top-0 left-0 right-0 lg:left-[72px] z-40 pointer-events-none">
        <div className="bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 pt-3 pb-6">
          <div className="flex items-center justify-between mb-2 pointer-events-auto">
            <h1 className="text-lg font-bold text-white drop-shadow">My Deck</h1>
            {stats && stats.due_today > 0 && (
              <button
                onClick={() => router.push('/review')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-full transition-colors shadow-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Review {stats.due_today}
              </button>
            )}
          </div>

          {/* Subject filter pills */}
          {subjects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSubjectFilter('all')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  subjectFilter === 'all'
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-black/40 backdrop-blur-sm text-white border-white/20 hover:border-white/40'
                }`}
              >
                All
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    subjectFilter === subject
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-black/40 backdrop-blur-sm text-white border-white/20 hover:border-white/40'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
