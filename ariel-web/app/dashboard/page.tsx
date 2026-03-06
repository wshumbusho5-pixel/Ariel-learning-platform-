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
  description?: string;
  topic?: string;
}

const CATEGORIES = [
  {
    key: 'gospel',
    label: 'Gospel',
    keywords: ['bible', 'gospel', 'faith', 'christianity', 'theology', 'scripture', 'church', 'religion', 'spiritual'],
    gradient: 'from-amber-900 to-amber-700',
    accent: 'bg-amber-500',
    text: 'text-amber-300',
    fallback: [
      { id: 'g1', subject: 'Bible Stories', card_count: 42, author_username: 'faithlearn' },
      { id: 'g2', subject: 'New Testament', card_count: 38, author_username: 'bibletutor' },
      { id: 'g3', subject: 'Psalms & Proverbs', card_count: 55, author_username: 'divineword' },
      { id: 'g4', subject: 'Theology Basics', card_count: 29, author_username: 'seminary101' },
      { id: 'g5', subject: 'Church History', card_count: 33, author_username: 'faithlearn' },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    keywords: ['business', 'marketing', 'finance', 'management', 'entrepreneurship', 'accounting', 'strategy', 'sales'],
    gradient: 'from-sky-900 to-sky-700',
    accent: 'bg-sky-500',
    text: 'text-sky-300',
    fallback: [
      { id: 'b1', subject: 'Marketing 101', card_count: 60, author_username: 'bizpro' },
      { id: 'b2', subject: 'Financial Accounting', card_count: 48, author_username: 'cpatutor' },
      { id: 'b3', subject: 'Entrepreneurship', card_count: 35, author_username: 'startuplab' },
      { id: 'b4', subject: 'Business Strategy', card_count: 44, author_username: 'mbaguide' },
      { id: 'b5', subject: 'Sales Fundamentals', card_count: 27, author_username: 'salescoach' },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    keywords: ['biology', 'chemistry', 'physics', 'mathematics', 'history', 'literature', 'science', 'algebra', 'calculus', 'geography'],
    gradient: 'from-emerald-900 to-emerald-700',
    accent: 'bg-emerald-500',
    text: 'text-emerald-300',
    fallback: [
      { id: 'e1', subject: 'Biology', card_count: 80, author_username: 'sciencepro' },
      { id: 'e2', subject: 'Calculus', card_count: 65, author_username: 'mathtutor' },
      { id: 'e3', subject: 'World History', card_count: 72, author_username: 'historylab' },
      { id: 'e4', subject: 'Chemistry', card_count: 58, author_username: 'chemwiz' },
      { id: 'e5', subject: 'Literature', card_count: 43, author_username: 'readingroom' },
    ],
  },
  {
    key: 'economy',
    label: 'Economy',
    keywords: ['economics', 'macroeconomics', 'microeconomics', 'economy', 'gdp', 'inflation', 'trade', 'monetary', 'fiscal'],
    gradient: 'from-violet-900 to-violet-700',
    accent: 'bg-violet-500',
    text: 'text-violet-300',
    fallback: [
      { id: 'ec1', subject: 'Macroeconomics', card_count: 54, author_username: 'econprof' },
      { id: 'ec2', subject: 'Microeconomics', card_count: 49, author_username: 'econprof' },
      { id: 'ec3', subject: 'Global Trade', card_count: 38, author_username: 'tradedesk' },
      { id: 'ec4', subject: 'Monetary Policy', card_count: 31, author_username: 'fedwatch' },
      { id: 'ec5', subject: 'Development Economics', card_count: 44, author_username: 'deveconomy' },
    ],
  },
  {
    key: 'technology',
    label: 'Technology',
    keywords: ['programming', 'computer', 'software', 'coding', 'javascript', 'python', 'ai', 'machine learning', 'data', 'cybersecurity'],
    gradient: 'from-zinc-800 to-zinc-600',
    accent: 'bg-zinc-400',
    text: 'text-zinc-300',
    fallback: [
      { id: 't1', subject: 'Python Basics', card_count: 70, author_username: 'codelab' },
      { id: 't2', subject: 'Data Structures', card_count: 55, author_username: 'cstutor' },
      { id: 't3', subject: 'Web Development', card_count: 63, author_username: 'devacademy' },
      { id: 't4', subject: 'Machine Learning', card_count: 48, author_username: 'ailearn' },
      { id: 't5', subject: 'Cybersecurity', card_count: 39, author_username: 'securelab' },
    ],
  },
];

function DeckCard({ deck, gradient, onClick }: { deck: Deck; gradient: string; onClick: () => void }) {
  const initial = (deck.subject || deck.title || '?').charAt(0).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all hover:scale-[1.02] text-left"
    >
      {/* Cover */}
      <div className={`w-full h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl font-black text-white/20 select-none">{initial}</span>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-bold text-white leading-tight line-clamp-2">{deck.subject || deck.title}</p>
        <p className="text-[10px] text-zinc-500 mt-1">{deck.card_count ?? 0} cards</p>
        {deck.author_username && (
          <p className="text-[10px] text-zinc-600 mt-0.5 truncate">@{deck.author_username}</p>
        )}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [gamification, setGamification] = useState<any>(null);
  const [categoryDecks, setCategoryDecks] = useState<Record<string, Deck[]>>({});
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
      const [gamStats, feedDecks] = await Promise.all([
        gamificationAPI.getStats().catch(() => null),
        socialAPI.getPersonalizedFeed(50).catch(() => []),
      ]);
      setGamification(gamStats || {});

      // Bucket feed decks into categories by keyword match
      const buckets: Record<string, Deck[]> = {};
      CATEGORIES.forEach(cat => { buckets[cat.key] = []; });

      (feedDecks as Deck[]).forEach((deck) => {
        const haystack = `${deck.subject} ${deck.title} ${deck.topic} ${deck.description}`.toLowerCase();
        for (const cat of CATEGORIES) {
          if (cat.keywords.some(kw => haystack.includes(kw))) {
            if (buckets[cat.key].length < 10) buckets[cat.key].push(deck);
            break;
          }
        }
      });

      // Fill empty buckets with fallback data
      CATEGORIES.forEach(cat => {
        if (buckets[cat.key].length === 0) buckets[cat.key] = cat.fallback as Deck[];
      });

      setCategoryDecks(buckets);
    } catch {
      const fallbacks: Record<string, Deck[]> = {};
      CATEGORIES.forEach(cat => { fallbacks[cat.key] = cat.fallback as Deck[]; });
      setCategoryDecks(fallbacks);
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
  const streakDays = gamification?.streak ?? 0;
  const firstName = user?.full_name?.split(' ')[0] || user?.username || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px] pb-24">

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

        <div className="py-6 space-y-8">

          {/* Greeting */}
          <div className="px-5 max-w-6xl mx-auto">
            <p className="text-sm text-zinc-500">{greeting}</p>
            <h2 className="text-3xl font-bold text-white mt-0.5">
              {firstName ? `${firstName}.` : 'Welcome back.'}
            </h2>
          </div>

          {/* Category shelves */}
          {CATEGORIES.map((cat) => {
            const decks = categoryDecks[cat.key] || cat.fallback as Deck[];
            return (
              <div key={cat.key}>
                {/* Row header */}
                <div className="px-5 max-w-6xl mx-auto flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.accent}`} />
                    <p className="text-base font-bold text-white">{cat.label}</p>
                  </div>
                  <button
                    onClick={() => router.push('/explore')}
                    className={`text-xs font-semibold ${cat.text} hover:opacity-70 transition-opacity`}
                  >
                    See all →
                  </button>
                </div>

                {/* Horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  {decks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      gradient={cat.gradient}
                      onClick={() => router.push('/explore')}
                    />
                  ))}
                  {/* See more card */}
                  <button
                    onClick={() => router.push('/explore')}
                    className="flex-shrink-0 w-36 rounded-2xl border border-zinc-800 border-dashed hover:border-zinc-600 transition-colors flex flex-col items-center justify-center gap-2 h-[232px]"
                  >
                    <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-xs text-zinc-600 font-medium">See more</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Ask Ariel */}
          <div className="px-5 max-w-6xl mx-auto">
            <ArielSpotlight />
          </div>

        </div>
      </div>
      <BottomNav />
    </>
  );
}
