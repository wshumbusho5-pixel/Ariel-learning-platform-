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
  topic?: string;
  description?: string;
}

const SUBJECT_META: Record<string, { label: string; icon: string; gradient: string; keywords: string[] }> = {
  gospel:      { label: 'Gospel & Faith',   icon: '✝️',  gradient: 'from-amber-800 to-yellow-700',   keywords: ['bible', 'gospel', 'faith', 'theology', 'scripture', 'church', 'religion'] },
  business:    { label: 'Business',          icon: '💼',  gradient: 'from-sky-800 to-blue-700',        keywords: ['business', 'marketing', 'finance', 'management', 'accounting', 'sales'] },
  economics:   { label: 'Economics',         icon: '📈',  gradient: 'from-violet-800 to-purple-700',   keywords: ['economics', 'gdp', 'inflation', 'trade', 'monetary', 'fiscal', 'economy'] },
  technology:  { label: 'Technology',        icon: '💻',  gradient: 'from-zinc-700 to-zinc-600',       keywords: ['programming', 'software', 'coding', 'javascript', 'python', 'ai', 'data'] },
  health:      { label: 'Health & Medicine', icon: '🧬',  gradient: 'from-rose-800 to-pink-700',       keywords: ['health', 'medicine', 'anatomy', 'nutrition', 'fitness', 'psychology'] },
  mathematics: { label: 'Mathematics',       icon: '📐',  gradient: 'from-indigo-800 to-indigo-600',   keywords: ['mathematics', 'calculus', 'algebra', 'geometry', 'statistics', 'math'] },
  sciences:    { label: 'Sciences',          icon: '🔬',  gradient: 'from-emerald-800 to-green-700',   keywords: ['biology', 'chemistry', 'physics', 'science', 'lab'] },
  history:     { label: 'History',           icon: '🏛️',  gradient: 'from-stone-700 to-stone-600',     keywords: ['history', 'historical', 'civilization', 'war', 'ancient'] },
  literature:  { label: 'Literature',        icon: '📚',  gradient: 'from-orange-800 to-orange-700',   keywords: ['literature', 'english', 'writing', 'poetry', 'novel'] },
  languages:   { label: 'Languages',         icon: '🌍',  gradient: 'from-teal-800 to-teal-600',       keywords: ['language', 'french', 'spanish', 'swahili', 'grammar', 'vocabulary'] },
  law:         { label: 'Law',               icon: '⚖️',  gradient: 'from-gray-800 to-gray-600',       keywords: ['law', 'legal', 'constitution', 'rights', 'court'] },
  arts:        { label: 'Arts & Music',      icon: '🎨',  gradient: 'from-fuchsia-800 to-pink-700',    keywords: ['art', 'music', 'design', 'creative', 'paint'] },
  psychology:  { label: 'Psychology',        icon: '🧠',  gradient: 'from-cyan-800 to-cyan-600',       keywords: ['psychology', 'mental', 'behavior', 'cognitive', 'therapy'] },
  engineering: { label: 'Engineering',       icon: '⚙️',  gradient: 'from-yellow-800 to-yellow-700',   keywords: ['engineering', 'mechanical', 'electrical', 'civil', 'structure'] },
  geography:   { label: 'Geography',         icon: '🗺️',  gradient: 'from-lime-800 to-lime-600',       keywords: ['geography', 'map', 'climate', 'continent', 'country'] },
  other:       { label: 'General',           icon: '✨',  gradient: 'from-zinc-800 to-zinc-700',       keywords: [] },
};

// Fallback topic decks per subject
const FALLBACK_DECKS: Record<string, Deck[]> = {
  gospel:      [{ id: 'g1', subject: 'Bible Stories', card_count: 42 }, { id: 'g2', subject: 'New Testament', card_count: 38 }, { id: 'g3', subject: 'Psalms & Proverbs', card_count: 55 }, { id: 'g4', subject: 'Theology Basics', card_count: 29 }, { id: 'g5', subject: 'Church History', card_count: 33 }],
  business:    [{ id: 'b1', subject: 'Marketing 101', card_count: 60 }, { id: 'b2', subject: 'Financial Accounting', card_count: 48 }, { id: 'b3', subject: 'Entrepreneurship', card_count: 35 }, { id: 'b4', subject: 'Business Strategy', card_count: 44 }, { id: 'b5', subject: 'Sales Fundamentals', card_count: 27 }],
  economics:   [{ id: 'ec1', subject: 'Macroeconomics', card_count: 54 }, { id: 'ec2', subject: 'Microeconomics', card_count: 49 }, { id: 'ec3', subject: 'Global Trade', card_count: 38 }, { id: 'ec4', subject: 'Monetary Policy', card_count: 31 }, { id: 'ec5', subject: 'Stock Market Basics', card_count: 36 }],
  technology:  [{ id: 't1', subject: 'Python Basics', card_count: 70 }, { id: 't2', subject: 'Data Structures', card_count: 55 }, { id: 't3', subject: 'Web Development', card_count: 63 }, { id: 't4', subject: 'Machine Learning', card_count: 48 }, { id: 't5', subject: 'Cybersecurity', card_count: 39 }],
  health:      [{ id: 'h1', subject: 'Human Anatomy', card_count: 90 }, { id: 'h2', subject: 'Nutrition Science', card_count: 47 }, { id: 'h3', subject: 'Mental Health', card_count: 52 }, { id: 'h4', subject: 'Pharmacology', card_count: 68 }, { id: 'h5', subject: 'First Aid', card_count: 34 }],
  mathematics: [{ id: 'm1', subject: 'Calculus', card_count: 65 }, { id: 'm2', subject: 'Algebra', card_count: 58 }, { id: 'm3', subject: 'Statistics', card_count: 44 }, { id: 'm4', subject: 'Geometry', card_count: 37 }, { id: 'm5', subject: 'Linear Algebra', card_count: 51 }],
  sciences:    [{ id: 's1', subject: 'Biology', card_count: 80 }, { id: 's2', subject: 'Chemistry', card_count: 58 }, { id: 's3', subject: 'Physics', card_count: 51 }, { id: 's4', subject: 'Ecology', card_count: 33 }, { id: 's5', subject: 'Genetics', card_count: 45 }],
  history:     [{ id: 'hi1', subject: 'World War II', card_count: 72 }, { id: 'hi2', subject: 'Ancient Rome', card_count: 61 }, { id: 'hi3', subject: 'African History', card_count: 48 }, { id: 'hi4', subject: 'Cold War', card_count: 39 }, { id: 'hi5', subject: 'Medieval Europe', card_count: 44 }],
  literature:  [{ id: 'l1', subject: 'Shakespeare', card_count: 43 }, { id: 'l2', subject: 'Poetry Analysis', card_count: 36 }, { id: 'l3', subject: 'African Literature', card_count: 29 }, { id: 'l4', subject: 'Essay Writing', card_count: 32 }, { id: 'l5', subject: 'Grammar Mastery', card_count: 55 }],
  languages:   [{ id: 'la1', subject: 'French Basics', card_count: 80 }, { id: 'la2', subject: 'Spanish A1', card_count: 75 }, { id: 'la3', subject: 'Swahili Vocab', card_count: 60 }, { id: 'la4', subject: 'Kinyarwanda', card_count: 50 }, { id: 'la5', subject: 'Mandarin Intro', card_count: 45 }],
  law:         [{ id: 'lw1', subject: 'Constitutional Law', card_count: 58 }, { id: 'lw2', subject: 'Contract Law', card_count: 46 }, { id: 'lw3', subject: 'Criminal Law', card_count: 52 }, { id: 'lw4', subject: 'Human Rights', card_count: 39 }, { id: 'lw5', subject: 'International Law', card_count: 43 }],
  arts:        [{ id: 'a1', subject: 'Music Theory', card_count: 48 }, { id: 'a2', subject: 'Art History', card_count: 55 }, { id: 'a3', subject: 'Design Principles', card_count: 37 }, { id: 'a4', subject: 'Photography', card_count: 29 }, { id: 'a5', subject: 'Film Studies', card_count: 33 }],
  psychology:  [{ id: 'p1', subject: 'Cognitive Psychology', card_count: 62 }, { id: 'p2', subject: 'Developmental Psych', card_count: 54 }, { id: 'p3', subject: 'Abnormal Psychology', card_count: 47 }, { id: 'p4', subject: 'Social Psychology', card_count: 59 }, { id: 'p5', subject: 'Neuroscience', card_count: 43 }],
  engineering: [{ id: 'en1', subject: 'Mechanics', card_count: 67 }, { id: 'en2', subject: 'Thermodynamics', card_count: 54 }, { id: 'en3', subject: 'Circuit Analysis', card_count: 48 }, { id: 'en4', subject: 'Structural Engineering', card_count: 41 }, { id: 'en5', subject: 'Materials Science', card_count: 36 }],
  geography:   [{ id: 'ge1', subject: 'Physical Geography', card_count: 52 }, { id: 'ge2', subject: 'Human Geography', card_count: 45 }, { id: 'ge3', subject: 'Climate & Weather', card_count: 38 }, { id: 'ge4', subject: 'Countries & Capitals', card_count: 196 }, { id: 'ge5', subject: 'Geopolitics', card_count: 33 }],
  other:       [{ id: 'o1', subject: 'General Knowledge', card_count: 100 }, { id: 'o2', subject: 'Critical Thinking', card_count: 45 }, { id: 'o3', subject: 'Study Skills', card_count: 30 }],
};

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [gamification, setGamification] = useState<any>(null);
  const [feedDecks, setFeedDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user && !user.onboarding_completed) setShowOnboarding(true);
      Promise.all([
        gamificationAPI.getStats().catch(() => null),
        socialAPI.getPersonalizedFeed(50).catch(() => []),
      ]).then(([gam, feed]) => {
        setGamification(gam || {});
        setFeedDecks((feed as Deck[]) || []);
      }).finally(() => setLoading(false));
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

  // No default — user must tap a card to see content

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          await checkAuth();
          router.push('/dashboard');
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

  const userSubjects: string[] = user?.subjects?.length ? user.subjects : ['gospel', 'business', 'economics'];
  const allSubjectKeys = Object.keys(SUBJECT_META).filter(k => k !== 'other');

  const meta = activeSubject ? (SUBJECT_META[activeSubject] || SUBJECT_META.other) : null;
  const displayDecks = activeSubject
    ? (() => {
        const m = SUBJECT_META[activeSubject] || SUBJECT_META.other;
        const matched = feedDecks.filter(d => {
          const hay = `${d.subject} ${d.title} ${d.topic} ${d.description}`.toLowerCase();
          return m.keywords.some(kw => hay.includes(kw));
        });
        return matched.length > 0 ? matched.slice(0, 6) : (FALLBACK_DECKS[activeSubject] || FALLBACK_DECKS.other);
      })()
    : [];

  const addSubject = async (key: string) => {
    if (userSubjects.includes(key)) return;
    const updated = [...userSubjects, key];
    try {
      const { authAPI } = await import('@/lib/api');
      await authAPI.updateProfile({ subjects: updated });
      await checkAuth();
    } catch {}
    setShowSubjectPicker(false);
  };

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

          {/* Subject cards — one scrolling row, pentagon shaped */}
          <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {userSubjects.map((subjectKey: string) => {
              const m = SUBJECT_META[subjectKey] || SUBJECT_META.other;
              const isActive = activeSubject === subjectKey;
              return (
                <button
                  key={subjectKey}
                  onClick={() => setActiveSubject(isActive ? null : subjectKey)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                  {/* Pentagon cover */}
                  <div
                    className={`w-32 h-36 bg-gradient-to-br ${m.gradient} flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      isActive ? 'scale-110 brightness-110' : 'opacity-75 group-hover:opacity-95 group-hover:scale-105'
                    }`}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <span className="text-3xl">{m.icon}</span>
                  </div>
                  {/* Label below */}
                  <p className={`text-xs font-semibold text-center leading-tight max-w-[90px] transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    {m.label}
                  </p>
                </button>
              );
            })}

            {/* Add subject */}
            <button
              onClick={() => setShowSubjectPicker(true)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div
                className="w-32 h-36 bg-zinc-900 border-2 border-dashed border-zinc-700 group-hover:border-zinc-500 flex items-center justify-center transition-colors"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <svg className="w-6 h-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-zinc-600 group-hover:text-zinc-400 transition-colors">Add</p>
            </button>
          </div>

          {/* Topics — only visible after tapping a card */}
          {activeSubject && meta && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <p className="text-base font-bold text-white">{meta.label}</p>
                </div>
                <button
                  onClick={() => router.push('/create-cards')}
                  className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                >
                  + Add cards
                </button>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {displayDecks.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => {
                      const topic = encodeURIComponent(deck.subject || deck.title || '');
                      router.push(`/explore?topic=${topic}`);
                    }}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                      {(deck.subject || deck.title || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{deck.subject || deck.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {deck.author_username ? `@${deck.author_username} · ` : ''}{deck.card_count ?? 0} cards
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject picker modal */}
          {showSubjectPicker && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubjectPicker(false)} />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[75vh] flex flex-col">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
                  <p className="text-base font-bold text-white">Add a subject</p>
                  <button onClick={() => setShowSubjectPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {allSubjectKeys.filter(k => !userSubjects.includes(k)).map(key => {
                      const m = SUBJECT_META[key];
                      return (
                        <button
                          key={key}
                          onClick={() => addSubject(key)}
                          className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
                        >
                          <span className="text-2xl">{m.icon}</span>
                          <p className="text-sm font-semibold text-zinc-300">{m.label}</p>
                        </button>
                      );
                    })}
                    {allSubjectKeys.filter(k => !userSubjects.includes(k)).length === 0 && (
                      <p className="col-span-2 text-sm text-zinc-600 text-center py-6">You've added all available subjects.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ask Ariel */}
          <ArielSpotlight />

        </div>
      </div>
      <BottomNav />
    </>
  );
}
