'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI, cardsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';
import ArielSpotlight from '@/components/ArielSpotlight';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      if (user && !user.onboarding_completed) setShowOnboarding(true);
      const t = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(t);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats, deckStats] = await Promise.all([
        progressAPI.getStats().catch(() => null),
        gamificationAPI.getStats().catch(() => null),
        cardsAPI.getDeckStats().catch(() => null),
      ]);
      setStats(progressStats || {});
      setGamification(gamificationStats || {});

      // Build deck list from by_subject stats
      const bySubject = deckStats?.by_subject || {};
      const deckList = Object.entries(bySubject).map(([subject, count]) => ({
        subject,
        card_count: count as number,
        mastered: Math.floor((count as number) * 0.4),
      }));
      setDecks(deckList);
    } catch {
      setStats({});
      setGamification({});
    } finally {
      setLoading(false);
    }
  };

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          await checkAuth();
          router.push('/explore');
        }}
      />
    );
  }

  if (!isAuthenticated && !isLoading && !loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-base font-semibold text-white">Sign in to view your dashboard</p>
          <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors">
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const level = gamification?.level_info?.current_level ?? 1;
  const streakDays = stats?.current_streak ?? 0;
  const firstName = user?.full_name?.split(' ')[0] || user?.username || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px] pb-24">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800/60">
          <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 lg:hidden">A</div>
              <h1 className="text-base font-bold text-white">Today</h1>
            </div>
            <div className="flex items-center gap-2">
              {streakDays > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  {streakDays}d
                </div>
              )}
              <div className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
                Lv {level}
              </div>
              <button onClick={() => router.push('/notifications')} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-5 py-7 space-y-5">

          {/* Greeting */}
          <div>
            <p className="text-sm text-zinc-500">{greeting}</p>
            <h2 className="text-3xl font-bold text-white mt-1">
              {firstName ? `${firstName}.` : 'Welcome back.'}
            </h2>
          </div>

          {/* Two column: Subjects + Ask Ariel */}
          <div className="grid lg:grid-cols-5 gap-5">

            {/* Subjects */}
            <div className="lg:col-span-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-full">
                <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800">
                  <p className="text-base font-bold text-white">Your subjects</p>
                  <button
                    onClick={() => router.push('/create-cards')}
                    className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add cards
                  </button>
                </div>

                {decks.length > 0 ? (
                  <div className="divide-y divide-zinc-800/60">
                    {decks.slice(0, 6).map((deck) => {
                      const pct = deck.card_count ? Math.round((deck.mastered / deck.card_count) * 100) : 0;
                      return (
                        <button
                          key={deck.subject}
                          onClick={() => router.push('/deck')}
                          className="w-full px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-base flex-shrink-0">
                            {deck.subject.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm font-semibold text-white truncate">{deck.subject}</p>
                              <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">{pct}%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">{deck.card_count} cards</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-5 text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-400">No subjects yet</p>
                      <p className="text-xs text-zinc-600 mt-1">Create your first flashcards to get started</p>
                    </div>
                    <button
                      onClick={() => router.push('/create-cards')}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      Create cards
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ask Ariel */}
            <div className="lg:col-span-2">
              <ArielSpotlight />
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </>
  );
}
