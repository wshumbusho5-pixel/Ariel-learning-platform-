'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI, socialAPI, notificationsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';
import ArielSpotlight from '@/components/ArielSpotlight';
import AIProviderSettings from '@/components/AIProviderSettings';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedDecks, setFeedDecks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      if (user && !user.onboarding_completed) {
        setShowOnboarding(true);
      }
      const timeoutId = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeoutId);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats, feedData, activityData] = await Promise.all([
        progressAPI.getStats().catch(() => null),
        gamificationAPI.getStats().catch(() => null),
        socialAPI.getPersonalizedFeed(4).catch(() => null),
        notificationsAPI.getNotifications(3, 0).catch(() => null),
      ]);
      setStats(progressStats || {});
      setGamification(gamificationStats || {});
      setFeedDecks(feedData || []);
      setRecentActivity(activityData?.notifications || activityData || []);
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
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors"
          >
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

  const streakDays = stats?.current_streak || 0;
  const level = gamification?.level_info?.current_level || 1;
  const accuracy = stats?.retention_rate || 0;
  const mastered = stats?.cards_mastered || 0;
  const cardsDue = stats?.cards_due_today || 0;
  const firstName = user?.full_name?.split(' ')[0] || user?.username || '';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px]">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800/60">
          <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between">
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
              <button
                onClick={() => router.push('/notifications')}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-5 py-7 space-y-6">

          {/* Greeting + primary action */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">{greeting}</p>
              <h2 className="text-3xl font-bold text-white mt-1">
                {firstName ? `${firstName}.` : 'Welcome back.'}
              </h2>
            </div>

            {cardsDue > 0 ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-700">
                <div>
                  <p className="text-base font-semibold text-white">
                    {cardsDue} card{cardsDue !== 1 ? 's' : ''} due for review
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">Review now to protect your streak</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/review')}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  Review
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-base font-semibold text-white">You're all caught up</p>
                  <p className="text-sm text-zinc-500 mt-0.5">No cards due — explore new content</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/explore')}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  Explore
                </button>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/reels')}
                className="flex-1 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-bold rounded-lg transition-colors"
              >
                Browse reels
              </button>
              <button
                type="button"
                onClick={() => router.push('/create-cards')}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold rounded-lg transition-colors"
              >
                Create cards
              </button>
              <button
                type="button"
                onClick={() => router.push('/live')}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold rounded-lg transition-colors"
              >
                Go live
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{cardsDue > 0 ? cardsDue : '—'}</p>
              <p className="text-xs text-zinc-500 mt-1.5">Due today</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{streakDays > 0 ? `${streakDays}d` : '—'}</p>
              <p className="text-xs text-zinc-500 mt-1.5">Streak</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{accuracy > 0 ? `${accuracy}%` : '—'}</p>
              <p className="text-xs text-zinc-500 mt-1.5">Retention</p>
            </div>
          </div>

          {/* Main two-column layout */}
          <div className="grid lg:grid-cols-5 gap-5">

            {/* Left: Subject decks + Activity */}
            <div className="lg:col-span-3 space-y-5">

              {/* Subject decks */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800">
                  <p className="text-base font-bold text-white">Your subjects</p>
                  <Link href="/explore" className="text-sm text-emerald-400 font-semibold hover:text-emerald-300">
                    Browse all →
                  </Link>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {feedDecks.length > 0 ? feedDecks.map((deck: any) => (
                    <button
                      key={deck.id}
                      onClick={() => router.push('/explore')}
                      className="w-full px-5 py-3.5 flex items-center gap-3.5 hover:bg-zinc-800/40 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm flex-shrink-0">
                        {deck.subject?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{deck.subject || 'General'}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">@{deck.author_username} · {deck.card_count} cards</p>
                      </div>
                      <svg className="w-4 h-4 text-zinc-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-zinc-600">No decks yet.</p>
                      <Link href="/explore" className="text-sm text-emerald-400 font-semibold mt-1 inline-block hover:text-emerald-300">
                        Explore decks →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800">
                  <p className="text-base font-bold text-white">Recent activity</p>
                  <Link href="/notifications" className="text-sm text-emerald-400 font-semibold hover:text-emerald-300">
                    All →
                  </Link>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {recentActivity.length > 0 ? recentActivity.map((notif: any) => (
                    <div key={notif.id} className="px-5 py-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200">{notif.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{notif.message || notif.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-zinc-600">No activity yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Ask Ariel */}
            <div className="lg:col-span-2">
              <ArielSpotlight />
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/leaderboard')}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-left transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-semibold text-zinc-200">Leaderboard</p>
              <p className="text-xs text-zinc-600 mt-0.5">Your rank</p>
            </button>
            <button
              onClick={() => router.push('/challenges')}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-left transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm font-semibold text-zinc-200">Challenges</p>
              <p className="text-xs text-zinc-600 mt-0.5">Weekly goals</p>
            </button>
            <button
              onClick={() => router.push('/achievements')}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-left transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-sm font-semibold text-zinc-200">Achievements</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {mastered > 0 ? `${mastered} mastered` : 'Unlock badges'}
              </p>
            </button>
          </div>

          {/* Advanced AI */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedAI((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-900/50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-400">Advanced AI</p>
                <p className="text-xs text-zinc-600 mt-0.5">Bring your own OpenAI or Claude key</p>
              </div>
              <svg
                className={`w-4 h-4 text-zinc-600 transition-transform ${showAdvancedAI ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAdvancedAI && (
              <div className="border-t border-zinc-800 px-5 py-4 bg-zinc-900/50">
                <AIProviderSettings />
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>

        <BottomNav />
      </div>
    </>
  );
}
