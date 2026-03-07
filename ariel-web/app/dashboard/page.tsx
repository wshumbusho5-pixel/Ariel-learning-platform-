'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import api, { gamificationAPI, cardsAPI, messagesAPI } from '@/lib/api';
import { useAriel } from '@/lib/arielContext';
import { useComments } from '@/lib/commentsContext';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedCard {
  id: string;
  question: string;
  answer?: string;
  subject?: string;
  topic?: string;
  likes?: number;
  author_username?: string;
  created_at?: string;
}

interface DueCard { id: string; question: string; subject?: string; }

interface Reel {
  id: string;
  kind?: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  creator_username: string;
  category?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUBJECT_META: Record<string, {
  label: string; short: string; icon: string;
  gradient: string; ring: string; keywords: string[];
}> = {
  gospel:      { label: 'Gospel & Faith',   short: 'Gospel',     icon: '✝️',  gradient: 'from-amber-700 to-yellow-600',  ring: 'ring-amber-500',   keywords: ['bible','gospel','faith','theology','scripture','church','religion'] },
  business:    { label: 'Business',          short: 'Business',   icon: '💼',  gradient: 'from-sky-700 to-blue-600',      ring: 'ring-sky-500',     keywords: ['business','marketing','finance','management','accounting','sales'] },
  economics:   { label: 'Economics',         short: 'Economics',  icon: '📈',  gradient: 'from-violet-700 to-purple-600', ring: 'ring-violet-500',  keywords: ['economics','gdp','inflation','trade','monetary','fiscal','economy'] },
  technology:  { label: 'Technology',        short: 'Tech',       icon: '💻',  gradient: 'from-zinc-600 to-zinc-500',     ring: 'ring-zinc-400',    keywords: ['programming','software','coding','javascript','python','ai','data'] },
  health:      { label: 'Health & Medicine', short: 'Health',     icon: '🧬',  gradient: 'from-rose-700 to-pink-600',     ring: 'ring-rose-500',    keywords: ['health','medicine','anatomy','nutrition','fitness','psychology'] },
  mathematics: { label: 'Mathematics',       short: 'Maths',      icon: '📐',  gradient: 'from-indigo-700 to-indigo-500', ring: 'ring-indigo-500',  keywords: ['mathematics','calculus','algebra','geometry','statistics','math'] },
  sciences:    { label: 'Sciences',          short: 'Sciences',   icon: '🔬',  gradient: 'from-emerald-700 to-green-600', ring: 'ring-emerald-500', keywords: ['biology','chemistry','physics','science','lab'] },
  history:     { label: 'History',           short: 'History',    icon: '🏛️',  gradient: 'from-stone-600 to-stone-500',   ring: 'ring-stone-400',   keywords: ['history','historical','civilization','war','ancient'] },
  literature:  { label: 'Literature',        short: 'Lit',        icon: '📚',  gradient: 'from-orange-700 to-orange-600', ring: 'ring-orange-500',  keywords: ['literature','english','writing','poetry','novel'] },
  languages:   { label: 'Languages',         short: 'Languages',  icon: '🌍',  gradient: 'from-teal-700 to-teal-500',     ring: 'ring-teal-500',    keywords: ['language','french','spanish','swahili','grammar','vocabulary'] },
  law:         { label: 'Law',               short: 'Law',        icon: '⚖️',  gradient: 'from-gray-700 to-gray-500',     ring: 'ring-gray-400',    keywords: ['law','legal','constitution','rights','court'] },
  arts:        { label: 'Arts & Music',      short: 'Arts',       icon: '🎨',  gradient: 'from-fuchsia-700 to-pink-600',  ring: 'ring-fuchsia-500', keywords: ['art','music','design','creative','paint'] },
  psychology:  { label: 'Psychology',        short: 'Psych',      icon: '🧠',  gradient: 'from-cyan-700 to-cyan-500',     ring: 'ring-cyan-500',    keywords: ['psychology','mental','behavior','cognitive','therapy'] },
  engineering: { label: 'Engineering',       short: 'Eng.',       icon: '⚙️',  gradient: 'from-yellow-700 to-yellow-600', ring: 'ring-yellow-500',  keywords: ['engineering','mechanical','electrical','civil','structure'] },
  geography:   { label: 'Geography',         short: 'Geography',  icon: '🗺️',  gradient: 'from-lime-700 to-lime-500',     ring: 'ring-lime-500',    keywords: ['geography','map','climate','continent','country'] },
  other:       { label: 'General',           short: 'General',    icon: '✨',  gradient: 'from-zinc-700 to-zinc-600',     ring: 'ring-zinc-600',    keywords: [] },
};

const TOPICS_BY_SUBJECT: Record<string, Record<string, string[]>> = {
  gospel:      { default: ['Bible Stories','New Testament','Psalms & Proverbs','Theology Basics','Church History','The Life of Jesus'] },
  business:    { 'high-school': ['Entrepreneurship','Personal Finance','Business Ethics','Marketing Basics'], university: ['Financial Accounting','Business Strategy','Marketing 101','Operations Management','Corporate Finance'], professional: ['Leadership','Strategic Management','Corporate Finance','Business Analytics'], default: ['Marketing 101','Financial Accounting','Entrepreneurship','Business Strategy'] },
  economics:   { 'high-school': ['Supply & Demand','GDP Basics','Personal Finance'], university: ['Macroeconomics','Microeconomics','Global Trade','Monetary Policy','Stock Market Basics'], professional: ['Monetary Policy','Fiscal Policy','Investment Theory'], default: ['Macroeconomics','Microeconomics','Global Trade','Monetary Policy'] },
  technology:  { 'high-school': ['Python Basics','Web Development','Digital Literacy'], university: ['Data Structures','Algorithms','Machine Learning','Web Development','Database Systems','Cybersecurity'], professional: ['System Design','Machine Learning','Cloud Computing','DevOps'], default: ['Python Basics','Data Structures','Web Development','Machine Learning'] },
  health:      { 'high-school': ['Human Anatomy','Nutrition Science','First Aid'], university: ['Human Anatomy','Pharmacology','Nutrition Science','Mental Health','Physiology'], professional: ['Pharmacology','Clinical Skills','Medical Ethics','Pathology'], default: ['Human Anatomy','Nutrition Science','Mental Health','Pharmacology'] },
  mathematics: { 'high-school': ['Algebra','Geometry','Trigonometry','Statistics'], university: ['Calculus','Linear Algebra','Statistics','Differential Equations','Discrete Math'], professional: ['Statistics','Linear Algebra','Optimization'], default: ['Calculus','Algebra','Statistics','Geometry'] },
  sciences:    { 'high-school': ['Biology Basics','Chemistry Basics','Physics Basics'], university: ['Biology','Chemistry','Physics','Genetics','Ecology','Organic Chemistry'], professional: ['Research Methods','Genetics','Biochemistry'], default: ['Biology','Chemistry','Physics','Ecology'] },
  history:     { default: ['World War II','Ancient Rome','African History','Cold War','Medieval Europe','The French Revolution'] },
  literature:  { default: ['Shakespeare','Poetry Analysis','African Literature','Essay Writing','Grammar Mastery','Literary Devices'] },
  languages:   { default: ['French Basics','Spanish A1','Swahili Vocab','Kinyarwanda','Mandarin Intro','English Grammar'] },
  law:         { 'high-school': ['Human Rights','Constitutional Law Basics'], university: ['Constitutional Law','Contract Law','Criminal Law','Human Rights','International Law'], professional: ['Corporate Law','Litigation','Constitutional Law'], default: ['Constitutional Law','Contract Law','Criminal Law','Human Rights'] },
  arts:        { default: ['Music Theory','Art History','Design Principles','Photography','Film Studies','Colour Theory'] },
  psychology:  { 'high-school': ['Intro to Psychology','Emotional Intelligence'], university: ['Cognitive Psychology','Developmental Psychology','Abnormal Psychology','Social Psychology'], professional: ['Organisational Psychology','Neuroscience','Therapy Models'], default: ['Cognitive Psychology','Developmental Psychology','Social Psychology','Neuroscience'] },
  engineering: { 'high-school': ['Engineering Basics','Simple Machines'], university: ['Mechanics','Thermodynamics','Circuit Analysis','Structural Engineering','Materials Science'], professional: ['Structural Engineering','Systems Design','Thermodynamics'], default: ['Mechanics','Thermodynamics','Circuit Analysis','Structural Engineering'] },
  geography:   { default: ['Physical Geography','Human Geography','Climate & Weather','Countries & Capitals','Geopolitics'] },
  other:       { default: ['General Knowledge','Critical Thinking','Study Skills'] },
};

function getTopics(key: string, level?: string): string[] {
  const s = TOPICS_BY_SUBJECT[key] || TOPICS_BY_SUBJECT.other;
  return s[level ?? 'default'] ?? s.default ?? [];
}

function getSubjectKey(card: FeedCard): string {
  const hay = `${card.subject ?? ''} ${card.topic ?? ''}`.toLowerCase();
  return (
    Object.entries(SUBJECT_META).find(([k, v]) => k !== 'other' && v.keywords.some(kw => hay.includes(kw)))?.[0] ?? 'other'
  );
}

function timeAgo(d?: string) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Card Tile (square, 1:1) ─────────────────────────────────────────────────

function CardTile({ card, onComment }: { card: FeedCard; onComment: (id: string) => void }) {
  const [flipped, setFlipped] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(card.likes ?? 0);
  const [saved, setSaved] = useState(false);

  const key = getSubjectKey(card);
  const meta = SUBJECT_META[key];

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    if (next) cardsAPI.likeCard(card.id).catch(() => {});
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!saved) cardsAPI.saveCardToDeck(card.id).catch(() => {});
    setSaved(s => !s);
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0`}>
          <span className="text-sm">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {card.author_username ? `@${card.author_username}` : meta.short}
            </span>
            {card.subject && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-semibold flex-shrink-0">
                {card.subject}{card.topic ? ` · ${card.topic}` : ''}
              </span>
            )}
          </div>
          {card.created_at && (
            <p className="text-[11px] text-zinc-600 mt-0.5">{timeAgo(card.created_at)}</p>
          )}
        </div>
        {/* Q / A indicator */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${flipped ? 'bg-sky-500' : 'bg-zinc-800'}`}>
          <span className="text-[11px] font-black text-white">{flipped ? 'A' : 'Q'}</span>
        </div>
      </div>

      {/* 3D flip area — full width, fixed height */}
      <div
        className="mb-0 cursor-pointer"
        style={{ perspective: '900px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          style={{
            position: 'relative',
            minHeight: '210px',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Front — Question */}
          <div
            className="absolute inset-0 bg-white flex flex-col items-center justify-center p-5"
            style={{ backfaceVisibility: 'hidden', minHeight: '210px', position: 'relative' }}
          >
            <p className="text-zinc-900 font-semibold text-[15px] text-center leading-snug">
              {card.question}
            </p>
            <span className="absolute bottom-3 text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              tap to flip
            </span>
          </div>

          {/* Back — Answer */}
          <div
            className="absolute inset-0 bg-sky-50 flex flex-col items-center justify-center p-5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', minHeight: '210px' }}
          >
            <p className="text-zinc-900 font-semibold text-[15px] text-center leading-snug">
              {card.answer || 'No answer provided.'}
            </p>
            <span className="absolute bottom-3 text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              tap to flip
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 pb-3 border-t border-zinc-800 pt-2.5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center ${liked ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount > 0 ? likeCount : 'Like'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onComment(card.id); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-1 justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center ${saved ? 'text-sky-400 bg-sky-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Reels Row (real thumbnails) ─────────────────────────────────────────────

function ReelsRow({ reels, fallbackTopics, onNavigate }: {
  reels: Reel[];
  fallbackTopics: { topic: string; subjectKey: string }[];
  onNavigate: (path: string) => void;
}) {
  // Show real reels if available, otherwise show topic placeholders
  const hasReal = reels.length > 0;

  return (
    <div className="-mx-4">
      {/* Wrapped section */}
      <div className="bg-zinc-900 py-4 my-2">
        {/* Header — inside padding */}
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-black text-white tracking-widest uppercase">Clips</span>
          </div>
          <button onClick={() => onNavigate('/reels')} className="text-xs text-zinc-500 hover:text-sky-400 transition-colors font-medium px-4">
            See all →
          </button>
        </div>

      {/* Full-bleed scroll strip */}
      <div className="flex gap-2.5 overflow-x-auto pl-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {hasReal
          ? reels.slice(0, 8).map((reel) => (
              <button
                key={reel.id}
                onClick={() => onNavigate('/reels')}
                className="flex-shrink-0 w-[160px] rounded-2xl overflow-hidden relative bg-zinc-800"
                style={{ aspectRatio: '9/16' }}
              >
                {reel.thumbnail_url ? (
                  <img
                    src={reel.thumbnail_url.replace(/^https?:\/\/localhost(:\d+)?/, '')}
                    alt={reel.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute top-2 left-2">
                  <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">{reel.title}</p>
                  <p className="text-[9px] text-white/50 mt-0.5 truncate">@{reel.creator_username}</p>
                </div>
              </button>
            ))
          : fallbackTopics.map(({ topic, subjectKey }, i) => {
              const meta = SUBJECT_META[subjectKey] || SUBJECT_META.other;
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(`/topic/${encodeURIComponent(topic)}?subject=${encodeURIComponent(meta.label)}`)}
                  className={`flex-shrink-0 w-[160px] rounded-2xl overflow-hidden bg-gradient-to-b ${meta.gradient} relative`}
                  style={{ aspectRatio: '9/16' }}
                >
                  <div className="h-full flex flex-col justify-between p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{topic}</p>
                      <p className="text-[9px] text-white/50 mt-0.5">{meta.short}</p>
                    </div>
                  </div>
                </button>
              );
            })
        }
        {/* Right padding spacer */}
        <div className="flex-shrink-0 w-4" />
      </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded-full w-2/5" />
          <div className="h-2.5 bg-zinc-800 rounded-full w-1/4" />
        </div>
      </div>
      {/* Card body */}
      <div className="h-[210px] bg-zinc-800" />
      {/* Action bar */}
      <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-zinc-800">
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const { openAriel } = useAriel();
  const { openComments } = useComments();

  const [gamification, setGamification] = useState<any>(null);
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FeedCard[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      if (!isLoading) setDataLoading(false);
      return;
    }
    if (user && !user.onboarding_completed) { setShowOnboarding(true); return; }
    messagesAPI.getUnreadCount().then((d: any) => setUnreadMessages(d?.unread_count ?? 0)).catch(() => {});

    Promise.all([
      gamificationAPI.getStats().catch(() => null),
      cardsAPI.getDueCards(5).catch(() => []),
      cardsAPI.getPersonalizedFeed(40).catch(() => []),
      api.get('/api/reels/feed').catch(() => ({ data: [] })),
    ]).then(([gam, due, feed, reelsRes]) => {
      setGamification(gam || {});
      setDueCards((due as DueCard[]) || []);
      setFeedCards((feed as FeedCard[]) || []);
      const allReels: Reel[] = (reelsRes as any).data ?? [];
      setReels(allReels.filter(r => r.video_url && r.kind !== 'card'));
    }).finally(() => setDataLoading(false));
  }, [isAuthenticated, isLoading, user]);

  // Debounced backend search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await cardsAPI.search(searchQuery.trim(), 30);
        setSearchResults(data);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addSubject = useCallback(async (key: string) => {
    if (!user?.subjects) return;
    try {
      const { authAPI } = await import('@/lib/api');
      await authAPI.updateProfile({ subjects: [...(user.subjects as string[]), key] });
      await checkAuth();
    } catch {}
    setShowSubjectPicker(false);
  }, [user, checkAuth]);

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (showOnboarding) {
    return (
      <Onboarding onComplete={async () => { setShowOnboarding(false); await checkAuth(); router.push('/dashboard'); }} />
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-base font-semibold text-white">Sign in to continue</p>
          <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-zinc-800 text-sm font-semibold text-zinc-200">Go to login</button>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const streakDays = gamification?.streak ?? 0;
  const level = gamification?.level_info?.current_level ?? 1;
  const userSubjects: string[] = user?.subjects?.length ? (user.subjects as string[]) : ['gospel', 'business', 'economics'];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user as any)?.full_name?.split(' ')[0] || user?.username || '';
  const allSubjectKeys = Object.keys(SUBJECT_META).filter(k => k !== 'other');

  // Topic chips for active subject (or all subjects combined)
  const topicChips: string[] = activeTopic
    ? []
    : activeSubject
    ? getTopics(activeSubject, user?.education_level)
    : userSubjects.flatMap(s => getTopics(s, user?.education_level).slice(0, 2));

  // Filter feed
  const displayCards: FeedCard[] = (() => {
    if (searchQuery.trim().length >= 2) {
      // Use backend results when searching
      return searchResults;
    }
    let cards = feedCards;
    if (activeSubject) {
      const m = SUBJECT_META[activeSubject];
      cards = cards.filter(c => {
        const hay = `${c.subject ?? ''} ${c.topic ?? ''}`.toLowerCase();
        return m?.keywords.some(kw => hay.includes(kw));
      });
    }
    if (activeTopic) {
      const tl = activeTopic.toLowerCase();
      cards = cards.filter(c =>
        c.topic?.toLowerCase().includes(tl) || c.question?.toLowerCase().includes(tl)
      );
    }
    return cards;
  })();

  // Reels row topics
  const reelTopics = userSubjects
    .flatMap(s => getTopics(s, user?.education_level).slice(0, 2).map(t => ({ topic: t, subjectKey: s })))
    .slice(0, 7);

  const handleStoryTap = (key: string) => {
    setActiveTopic(null);
    setActiveSubject(prev => prev === key ? null : key);
  };

  const handleChipTap = (chip: string) => {
    setActiveTopic(prev => prev === chip ? null : chip);
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-black lg:pl-[72px] pb-24">

        {/* ── Sticky header: brand + search only ───────────────────────────── */}
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-800/60">
          <div className="h-[2px] bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500" />
          {/* Row 1: brand | icons */}
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">ariel</span>
            <div className="flex items-center">
              <button onClick={() => router.push('/messages')} className="relative w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-sky-500 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white leading-none px-0.5">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                  </span>
                )}
              </button>
              <button onClick={() => router.push('/notifications')} className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: full-width search bar */}
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-700/60 rounded-full px-4 h-10 gap-2 focus-within:border-sky-500/60 transition-colors">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                placeholder="Search cards, topics..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }} className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Feed ──────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pb-4">

          {/* Greeting + stats */}
          {!searchQuery && (
            <div className="pt-4 pb-3">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">{greeting}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h1 className="text-xl font-black text-white leading-none">{firstName || 'there'}</h1>
                {!dataLoading && streakDays > 0 && (
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">🔥 {streakDays}d streak</span>
                )}
              </div>
            </div>
          )}

          {/* Subject stories */}
          {!searchQuery && (
            <div className="pb-4">
              <div className="flex items-center gap-3.5 overflow-x-auto px-1 py-1" style={{ scrollbarWidth: 'none' }}>
                {userSubjects.map(key => {
                  const m = SUBJECT_META[key] || SUBJECT_META.other;
                  const isActive = activeSubject === key;
                  return (
                    <button key={key} onClick={() => handleStoryTap(key)} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <div className={`p-[2.5px] rounded-full transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-sky-400 via-indigo-500 to-sky-400 scale-105' : 'bg-zinc-800'}`}>
                        <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl ${isActive ? 'bg-black' : 'bg-zinc-800'}`}>
                          {m.icon}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold transition-colors truncate w-[54px] text-center ${isActive ? 'text-white' : 'text-zinc-600'}`}>{m.short}</span>
                    </button>
                  );
                })}
                <button onClick={() => setShowSubjectPicker(true)} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                  <div className="w-[54px] h-[54px] rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-700">Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Topic chips */}
          {topicChips.length > 0 && !searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => { setActiveTopic(null); setActiveSubject(null); }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${!activeSubject && !activeTopic ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                All
              </button>
              {topicChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChipTap(chip)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${activeTopic === chip ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Search results label */}
          {searchQuery.trim().length >= 2 && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                {searching ? (
                  <span className="w-3.5 h-3.5 border border-zinc-600 border-t-sky-400 rounded-full animate-spin inline-block" />
                ) : (
                  <span className="font-bold text-white">{displayCards.length}</span>
                )}
                {!searching && <> result{displayCards.length !== 1 ? 's' : ''} for "<span className="text-sky-400">{searchQuery}</span>"</>}
                {searching && <span className="text-zinc-500">Searching...</span>}
              </p>
              <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Clear</button>
            </div>
          )}

          {/* Ariel entry card */}
          {!searchQuery && (
            <button
              onClick={openAriel}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/30 active:scale-[0.98] transition-all text-left mb-4"
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-sky-500/20">
                  A
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">Ariel</p>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">now</span>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  Hey {firstName}! What are we studying today? 👋
                </p>
              </div>
              {dueCards.length > 0 && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{dueCards.length}</span>
                </div>
              )}
            </button>
          )}

          {/* Active subject header */}
          {activeSubject && (
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{SUBJECT_META[activeSubject]?.icon}</span>
                <h2 className="text-base font-bold text-white">{SUBJECT_META[activeSubject]?.label}</h2>
              </div>
              <button
                onClick={() => setActiveSubject(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear ×
              </button>
            </div>
          )}

          {/* Card feed — full-width posts */}
          {dataLoading ? (
            <div className="-mx-4">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : displayCards.length > 0 ? (
            <>
              {/* First 2 cards */}
              <div className="-mx-4">
                {displayCards.slice(0, 2).map(card => (
                  <CardTile key={card.id} card={card} onComment={openComments} />
                ))}
              </div>

              {/* Clips row */}
              {!activeTopic && (
                <ReelsRow reels={reels} fallbackTopics={reelTopics} onNavigate={router.push} />
              )}

              {/* Next 4 cards */}
              {displayCards.length > 2 && (
                <div className="-mx-4">
                  {displayCards.slice(2, 6).map(card => (
                    <CardTile key={card.id} card={card} onComment={openComments} />
                  ))}
                </div>
              )}

              {/* Due for review */}
              {dueCards.length > 0 && !searchQuery && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">Due for review</span>
                    <span className="text-xs text-zinc-500">{dueCards.length} card{dueCards.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {dueCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => router.push('/cram')}
                        className="flex-shrink-0 w-44 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/30 text-left transition-colors"
                      >
                        <p className="text-xs font-semibold text-white line-clamp-3 leading-snug">{card.question}</p>
                        {card.subject && (
                          <p className="text-[10px] text-zinc-600 mt-2 truncate">{card.subject}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deck CTA */}
              {!searchQuery && (
                <button
                  onClick={openAriel}
                  className="mt-5 w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/30 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Build your study deck</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Create cards on anything you're learning</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-base font-semibold text-zinc-300">
                {activeSubject || activeTopic ? 'No cards for this yet' : 'Your feed is empty'}
              </p>
              <p className="text-sm text-zinc-600 mt-1">
                {activeSubject || activeTopic ? 'Be the first to create cards here' : 'Ask Ariel to generate your first cards'}
              </p>
              <button onClick={openAriel} className="mt-5 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors">
                Ask Ariel
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Subject picker modal ───────────────────────────────────────────── */}
      {showSubjectPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSubjectPicker(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[75vh] flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <p className="text-base font-bold text-white">Add a subject</p>
              <button onClick={() => setShowSubjectPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                {allSubjectKeys.filter(k => !userSubjects.includes(k)).map(key => {
                  const m = SUBJECT_META[key];
                  return (
                    <button key={key} onClick={() => addSubject(key)} className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-800 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all text-left">
                      <span className="text-2xl">{m.icon}</span>
                      <p className="text-sm font-semibold text-zinc-300">{m.label}</p>
                    </button>
                  );
                })}
                {allSubjectKeys.filter(k => !userSubjects.includes(k)).length === 0 && (
                  <p className="col-span-2 text-sm text-zinc-600 text-center py-6">You've added all subjects.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
