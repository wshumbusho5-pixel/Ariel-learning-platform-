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
  const router = useRouter();
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
    <div className="flex flex-col">
      {/* 3D flip container */}
      <div
        className="relative w-full cursor-pointer"
        style={{ aspectRatio: '1/1', perspective: '700px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Front face — Question */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800 rounded-3xl overflow-hidden border border-zinc-700/40"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {card.subject && (
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm">
                <span className="text-white text-[10px] font-semibold">{card.subject}</span>
              </div>
            )}
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[9px] font-black text-white">Q</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-5">
              <p className="text-white font-semibold text-sm text-center leading-snug line-clamp-5 drop-shadow">
                {card.question}
              </p>
            </div>
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center">
              <span className="text-[9px] text-white/30 font-medium">tap for answer</span>
            </div>
          </div>

          {/* Back face — Answer */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl overflow-hidden border border-zinc-700/40"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 bg-sky-500/5" />
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[9px] font-black text-white">A</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-5">
              <p className="text-white font-semibold text-sm text-center leading-snug line-clamp-5 drop-shadow">
                {card.answer || 'No answer provided.'}
              </p>
            </div>
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center">
              <span className="text-[9px] text-white/30 font-medium">tap for question</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata + actions below thumbnail */}
      <div className="mt-2 px-0.5">
        <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{card.question}</p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded-full bg-zinc-700 flex-shrink-0" />
            <p className="text-[11px] text-zinc-500 truncate">
              {card.author_username ? `@${card.author_username}` : meta.short}
              {card.created_at ? ` · ${timeAgo(card.created_at)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button onClick={handleLike} className="flex items-center gap-1">
              <svg className={`w-4 h-4 transition-colors ${liked ? 'text-red-500' : 'text-zinc-600'}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && <span className="text-[10px] text-zinc-600">{likeCount}</span>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onComment(card.id); }}>
              <svg className="w-4 h-4 text-zinc-600 hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button onClick={handleSave}>
              <svg className={`w-4 h-4 transition-colors ${saved ? 'text-sky-400' : 'text-zinc-600 hover:text-zinc-400'}`} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
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
    <div className="col-span-2 sm:col-span-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <span className="text-sm font-bold text-white">Clips</span>
        </div>
        <button onClick={() => onNavigate('/reels')} className="text-xs text-zinc-500 hover:text-sky-400 transition-colors font-medium">
          See all →
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {/* "See all" entry tile */}
        <button
          onClick={() => onNavigate('/reels')}
          className="flex-shrink-0 w-[160px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
          style={{ aspectRatio: '9/16' }}
        >
          <div className="h-full flex flex-col items-center justify-center gap-2 p-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold text-center leading-tight">Watch<br />Clips</p>
          </div>
        </button>

        {hasReal
          ? reels.slice(0, 7).map((reel) => (
              <button
                key={reel.id}
                onClick={() => onNavigate('/reels')}
                className="flex-shrink-0 w-[160px] rounded-3xl overflow-hidden relative bg-zinc-900"
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
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {/* Play icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                {/* Title + creator */}
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <p className="text-xs font-bold text-white leading-tight line-clamp-2">{reel.title}</p>
                  <p className="text-[10px] text-white/50 mt-0.5 truncate">@{reel.creator_username}</p>
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
                    <span className="text-lg">{meta.icon}</span>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{topic}</p>
                      <p className="text-[9px] text-white/50 mt-0.5">{meta.short}</p>
                    </div>
                  </div>
                </button>
              );
            })
        }
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="w-full rounded-3xl bg-zinc-800" style={{ aspectRatio: '1/1' }} />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-2.5 bg-zinc-800 rounded-full w-4/5" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-3/5" />
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
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
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
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      cards = cards.filter(c =>
        c.question?.toLowerCase().includes(q) ||
        c.answer?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.topic?.toLowerCase().includes(q) ||
        c.author_username?.toLowerCase().includes(q)
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
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px] pb-24">

        {/* ── Sticky header: brand + search only ───────────────────────────── */}
        <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/60">
          {/* Row 1: brand | icons */}
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-lg font-black text-white tracking-tight">ariel</span>
            <div className="flex items-center">
              <button onClick={() => router.push('/messages')} className="relative w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-sky-500 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white leading-none px-0.5">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                  </span>
                )}
              </button>
              <button onClick={() => router.push('/notifications')} className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: full-width search bar */}
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-700/60 rounded-full px-4 h-9 gap-2 focus-within:border-sky-500/60 transition-colors">
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
                      <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-xl transition-all duration-200 ring-2 ring-offset-[3px] ring-offset-zinc-950 ${isActive ? 'bg-gradient-to-br from-sky-600 to-indigo-600 ring-sky-400 scale-105' : 'bg-zinc-800 ring-zinc-700 opacity-80 hover:opacity-100'}`}>
                        {m.icon}
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
          {searchQuery && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-zinc-400">
                <span className="font-bold text-white">{displayCards.length}</span> result{displayCards.length !== 1 ? 's' : ''} for "<span className="text-sky-400">{searchQuery}</span>"
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

          {/* Card grid with inline reels row */}
          {dataLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : displayCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-7">
              {displayCards.slice(0, 40).map((card, i) => (
                <>
                  <CardTile key={card.id} card={card} onComment={openComments} />
                  {/* Reels row after 2nd card (spans both columns) */}
                  {i === 1 && !activeTopic && (
                    <ReelsRow key="reels" reels={reels} fallbackTopics={reelTopics} onNavigate={router.push} />
                  )}
                </>
              ))}
            </div>
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

          {/* Reels row at bottom if feed shorter than insert point */}
          {!dataLoading && displayCards.length > 0 && displayCards.length <= 1 && !activeTopic && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <ReelsRow reels={reels} fallbackTopics={reelTopics} onNavigate={router.push} />
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
