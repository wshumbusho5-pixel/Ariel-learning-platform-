'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCardReview, { type SessionStats } from '@/components/SwipeCardReview';
import { useAuth } from '@/lib/useAuth';
import { cardsAPI } from '@/lib/api';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  likes: number;
  saves: number;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

export default function ReviewPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    checkAuth();
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const data = await cardsAPI.getDueCards(20);
      setCards(data);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    router.push('/deck');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to review cards</h2>
          <p className="text-zinc-500 mb-6">Create an account to start your review session</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-zinc-800 border-t-violet-400 mx-auto" />
          <p className="text-zinc-500 mt-4 text-sm">Loading your cards…</p>
        </div>
      </div>
    );
  }

  // ── Session Complete Screen ──────────────────────────────────
  if (sessionStats) {
    const { total, ratings, durationMs } = sessionStats;
    const again  = ratings.filter(r => r.quality === 0).length;
    const hard   = ratings.filter(r => r.quality === 2).length;
    const good   = ratings.filter(r => r.quality === 4).length;
    const easy   = ratings.filter(r => r.quality === 5).length;
    const correct = good + easy;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const hardestCard = ratings.find(r => r.quality === 0) ?? ratings.find(r => r.quality === 2);

    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-5 py-12">
        {/* Trophy / check icon */}
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          {accuracy >= 80 ? (
            <span className="text-3xl">🏆</span>
          ) : accuracy >= 50 ? (
            <span className="text-3xl">👍</span>
          ) : (
            <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <h2 className="text-3xl font-black text-white mb-1">Session complete</h2>
        <p className="text-zinc-500 text-sm mb-8">{formatDuration(durationMs)} · {total} card{total !== 1 ? 's' : ''}</p>

        {/* Accuracy ring */}
        <div className="relative w-32 h-32 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={accuracy >= 80 ? '#10b981' : accuracy >= 50 ? '#8b5cf6' : '#f97316'}
              strokeWidth="2.5"
              strokeDasharray={`${accuracy} ${100 - accuracy}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{accuracy}%</span>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">Accuracy</span>
          </div>
        </div>

        {/* Rating breakdown */}
        <div className="w-full max-w-sm grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Again', count: again, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Hard',  count: hard,  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            { label: 'Good',  count: good,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Easy',  count: easy,  color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`flex flex-col items-center py-3 rounded-xl border ${bg}`}>
              <span className={`text-xl font-black ${color}`}>{count}</span>
              <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Hardest card */}
        {hardestCard && (
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Needs more work</p>
            <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{hardestCard.question}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => router.push('/deck')}
            className="w-full py-3.5 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-2xl transition-colors"
          >
            Back to Deck
          </button>
          <button
            onClick={() => { setSessionStats(null); loadDueCards(); }}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold rounded-2xl transition-colors text-sm"
          >
            Review More Cards
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-zinc-500 mb-6 max-w-xs mx-auto text-sm">
            No cards due right now. Come back later or explore new cards to study.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/deck')}
              className="px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors"
            >
              View My Deck
            </button>
            <button
              onClick={() => router.push('/explore')}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold rounded-xl transition-colors"
            >
              Explore Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SwipeCardReview
      initialCards={cards}
      onComplete={setSessionStats}
      onExit={handleExit}
    />
  );
}
