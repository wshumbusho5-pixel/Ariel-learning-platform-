'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { gamificationAPI, socialAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';
import ArielSpotlight from '@/components/ArielSpotlight';

interface Deck {
  id: string;
  subject?: string;
  title?: string;
  card_count?: number;
  author_username?: string;
}

const CATEGORIES = [
  {
    key: 'gospel',
    label: 'Gospel',
    emoji: '✝️',
    gradient: 'from-amber-800 to-yellow-700',
    keywords: ['bible', 'gospel', 'faith', 'christianity', 'theology', 'scripture', 'religion', 'spiritual'],
    decks: [
      { id: 'g1', subject: 'Bible Stories', card_count: 42, author_username: 'faithlearn' },
      { id: 'g2', subject: 'New Testament', card_count: 38, author_username: 'bibletutor' },
      { id: 'g3', subject: 'Psalms & Proverbs', card_count: 55, author_username: 'divineword' },
      { id: 'g4', subject: 'Theology Basics', card_count: 29, author_username: 'seminary101' },
      { id: 'g5', subject: 'Church History', card_count: 33, author_username: 'faithlearn' },
      { id: 'g6', subject: 'Acts of the Apostles', card_count: 41, author_username: 'bibletutor' },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    emoji: '💼',
    gradient: 'from-sky-800 to-blue-700',
    keywords: ['business', 'marketing', 'finance', 'management', 'entrepreneurship', 'accounting', 'strategy', 'sales'],
    decks: [
      { id: 'b1', subject: 'Marketing 101', card_count: 60, author_username: 'bizpro' },
      { id: 'b2', subject: 'Financial Accounting', card_count: 48, author_username: 'cpatutor' },
      { id: 'b3', subject: 'Entrepreneurship', card_count: 35, author_username: 'startuplab' },
      { id: 'b4', subject: 'Business Strategy', card_count: 44, author_username: 'mbaguide' },
      { id: 'b5', subject: 'Sales Fundamentals', card_count: 27, author_username: 'salescoach' },
      { id: 'b6', subject: 'Leadership Skills', card_count: 39, author_username: 'bizpro' },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    emoji: '📚',
    gradient: 'from-emerald-800 to-green-700',
    keywords: ['biology', 'chemistry', 'physics', 'mathematics', 'history', 'literature', 'science', 'algebra'],
    decks: [
      { id: 'e1', subject: 'Biology', card_count: 80, author_username: 'sciencepro' },
      { id: 'e2', subject: 'Calculus', card_count: 65, author_username: 'mathtutor' },
      { id: 'e3', subject: 'World History', card_count: 72, author_username: 'historylab' },
      { id: 'e4', subject: 'Chemistry', card_count: 58, author_username: 'chemwiz' },
      { id: 'e5', subject: 'Literature', card_count: 43, author_username: 'readingroom' },
      { id: 'e6', subject: 'Physics', card_count: 51, author_username: 'sciencepro' },
    ],
  },
  {
    key: 'economy',
    label: 'Economy',
    emoji: '📈',
    gradient: 'from-violet-800 to-purple-700',
    keywords: ['economics', 'gdp', 'inflation', 'trade', 'monetary', 'fiscal', 'economy'],
    decks: [
      { id: 'ec1', subject: 'Macroeconomics', card_count: 54, author_username: 'econprof' },
      { id: 'ec2', subject: 'Microeconomics', card_count: 49, author_username: 'econprof' },
      { id: 'ec3', subject: 'Global Trade', card_count: 38, author_username: 'tradedesk' },
      { id: 'ec4', subject: 'Monetary Policy', card_count: 31, author_username: 'fedwatch' },
      { id: 'ec5', subject: 'Development Economics', card_count: 44, author_username: 'deveconomy' },
      { id: 'ec6', subject: 'Stock Market Basics', card_count: 36, author_username: 'investlearn' },
    ],
  },
  {
    key: 'technology',
    label: 'Technology',
    emoji: '💻',
    gradient: 'from-zinc-700 to-zinc-600',
    keywords: ['programming', 'software', 'coding', 'javascript', 'python', 'ai', 'data', 'cybersecurity'],
    decks: [
      { id: 't1', subject: 'Python Basics', card_count: 70, author_username: 'codelab' },
      { id: 't2', subject: 'Data Structures', card_count: 55, author_username: 'cstutor' },
      { id: 't3', subject: 'Web Development', card_count: 63, author_username: 'devacademy' },
      { id: 't4', subject: 'Machine Learning', card_count: 48, author_username: 'ailearn' },
      { id: 't5', subject: 'Cybersecurity', card_count: 39, author_username: 'securelab' },
      { id: 't6', subject: 'SQL & Databases', card_count: 45, author_username: 'datatutor' },
    ],
  },
  {
    key: 'health',
    label: 'Health',
    emoji: '🧬',
    gradient: 'from-rose-800 to-pink-700',
    keywords: ['health', 'medicine', 'anatomy', 'nutrition', 'fitness', 'psychology', 'mental'],
    decks: [
      { id: 'h1', subject: 'Human Anatomy', card_count: 90, author_username: 'medschool' },
      { id: 'h2', subject: 'Nutrition Science', card_count: 47, author_username: 'healthpro' },
      { id: 'h3', subject: 'Mental Health', card_count: 52, author_username: 'psychlearn' },
      { id: 'h4', subject: 'Pharmacology', card_count: 68, author_username: 'medschool' },
      { id: 'h5', subject: 'First Aid', card_count: 34, author_username: 'healthpro' },
      { id: 'h6', subject: 'Exercise Science', card_count: 41, author_username: 'fitnesstu' },
    ],
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      gamificationAPI.getStats().then(setGamification).catch(() => null).finally(() => setLoading(false));
      if (user && !user.onboarding_completed) setShowOnboarding(true);
      const t = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(t);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

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
  const streakDays = gamification?.streak ?? 0;
  const firstName = user?.full_name?.split(' ')[0] || user?.username || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const selected = CATEGORIES.find(c => c.key === activeCategory) || CATEGORIES[0];

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px] pb-24 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800/60">
          <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
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
              <div className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">Lv {level}</div>
              <button onClick={() => router.push('/notifications')} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-5 py-6 gap-6">

          {/* Greeting */}
          <div>
            <p className="text-sm text-zinc-500">{greeting}</p>
            <h2 className="text-3xl font-bold text-white mt-0.5">
              {firstName ? `${firstName}.` : 'Welcome back.'}
            </h2>
          </div>

          {/* Category cards — one scrolling row */}
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex-shrink-0 w-32 h-36 rounded-2xl bg-gradient-to-br ${cat.gradient} flex flex-col items-start justify-end p-4 transition-all ${
                    isActive
                      ? 'ring-2 ring-white/40 scale-[1.03]'
                      : 'opacity-70 hover:opacity-90 hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.emoji}</span>
                  <p className="text-sm font-bold text-white leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{cat.decks.length} topics</p>
                </button>
              );
            })}
          </div>

          {/* Selected category content */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selected.emoji}</span>
                <p className="text-base font-bold text-white">{selected.label}</p>
              </div>
              <button
                onClick={() => router.push('/explore')}
                className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
              >
                Browse all →
              </button>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {selected.decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => router.push('/explore')}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center font-bold text-white text-base flex-shrink-0`}>
                    {deck.subject.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{deck.subject}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">@{deck.author_username} · {deck.card_count} cards</p>
                  </div>
                  <svg className="w-4 h-4 text-zinc-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Ask Ariel */}
          <ArielSpotlight />

        </div>
      </div>
      <BottomNav />
    </>
  );
}
