'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import api, { gamificationAPI, cardsAPI, messagesAPI, notificationsAPI } from '@/lib/api';
import { useAriel } from '@/lib/arielContext';
import { useComments } from '@/lib/commentsContext';
import BottomNav, { drawerItems } from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';
import ArielIcon from '@/components/ArielIcon';
import ArielWordmark from '@/components/ArielWordmark';
import ArielLoader from '@/components/ArielLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

const STRIP_COLOR: Record<string, string> = {
  gospel: 'via-amber-400', business: 'via-sky-400', economics: 'via-violet-400',
  technology: 'via-zinc-400', health: 'via-rose-400', mathematics: 'via-indigo-400',
  sciences: 'via-emerald-400', history: 'via-amber-400', literature: 'via-orange-400',
  languages: 'via-teal-400', law: 'via-slate-400', arts: 'via-fuchsia-400',
  psychology: 'via-cyan-400', engineering: 'via-yellow-400', geography: 'via-lime-400',
  other: 'via-zinc-400',
};

interface FeedCard {
  id: string;
  question: string;
  answer?: string;
  subject?: string;
  topic?: string;
  likes?: number;
  comments_count?: number;
  saves?: number;
  is_liked_by_user?: boolean;
  is_saved_by_user?: boolean;
  author_username?: string;
  author_full_name?: string;
  author_profile_picture?: string;
  created_at?: string;
  community_reviews?: number;
  community_pct_correct?: number;
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
  gospel:      { label: 'Gospel & Faith',   short: 'Gospel',     icon: '✝️',  gradient: 'from-amber-400 to-transparent',   ring: 'ring-amber-500',   keywords: ['bible','gospel','faith','theology','scripture','church','religion'] },
  business:    { label: 'Business',          short: 'Business',   icon: '💼',  gradient: 'from-sky-400 to-transparent',     ring: 'ring-amber-500',   keywords: ['business','marketing','finance','management','accounting','sales'] },
  economics:   { label: 'Economics',         short: 'Economics',  icon: '📈',  gradient: 'from-violet-400 to-transparent',  ring: 'ring-violet-300',  keywords: ['economics','gdp','inflation','trade','monetary','fiscal','economy'] },
  technology:  { label: 'Technology',        short: 'Tech',       icon: '💻',  gradient: 'from-zinc-500 to-transparent',    ring: 'ring-zinc-400',    keywords: ['programming','software','coding','javascript','python','ai','data'] },
  health:      { label: 'Health & Medicine', short: 'Health',     icon: '🧬',  gradient: 'from-rose-400 to-transparent',    ring: 'ring-rose-500',    keywords: ['health','medicine','anatomy','nutrition','fitness','psychology'] },
  mathematics: { label: 'Mathematics',       short: 'Maths',      icon: '📐',  gradient: 'from-indigo-400 to-transparent',  ring: 'ring-emerald-500', keywords: ['mathematics','calculus','algebra','geometry','statistics','math'] },
  sciences:    { label: 'Sciences',          short: 'Sciences',   icon: '🔬',  gradient: 'from-emerald-400 to-transparent', ring: 'ring-emerald-500', keywords: ['biology','chemistry','physics','science','lab'] },
  history:     { label: 'History',           short: 'History',    icon: '🏛️',  gradient: 'from-amber-400 to-transparent',   ring: 'ring-stone-400',   keywords: ['history','historical','civilization','war','ancient'] },
  literature:  { label: 'Literature',        short: 'Lit',        icon: '📚',  gradient: 'from-orange-400 to-transparent',  ring: 'ring-orange-500',  keywords: ['literature','english','writing','poetry','novel'] },
  languages:   { label: 'Languages',         short: 'Languages',  icon: '🌍',  gradient: 'from-teal-400 to-transparent',    ring: 'ring-teal-500',    keywords: ['language','french','spanish','swahili','grammar','vocabulary'] },
  law:         { label: 'Law',               short: 'Law',        icon: '⚖️',  gradient: 'from-slate-400 to-transparent',   ring: 'ring-gray-400',    keywords: ['law','legal','constitution','rights','court'] },
  arts:        { label: 'Arts & Music',      short: 'Arts',       icon: '🎨',  gradient: 'from-fuchsia-400 to-transparent', ring: 'ring-fuchsia-500', keywords: ['art','music','design','creative','paint'] },
  psychology:  { label: 'Psychology',        short: 'Psych',      icon: '🧠',  gradient: 'from-cyan-400 to-transparent',    ring: 'ring-cyan-500',    keywords: ['psychology','mental','behavior','cognitive','therapy'] },
  engineering: { label: 'Engineering',       short: 'Eng.',       icon: '⚙️',  gradient: 'from-yellow-400 to-transparent',  ring: 'ring-yellow-500',  keywords: ['engineering','mechanical','electrical','civil','structure'] },
  geography:   { label: 'Geography',         short: 'Geography',  icon: '🗺️',  gradient: 'from-lime-400 to-transparent',    ring: 'ring-lime-500',    keywords: ['geography','map','climate','continent','country'] },
  other:       { label: 'General',           short: 'General',    icon: '✨',  gradient: 'from-zinc-500 to-transparent',    ring: 'ring-zinc-600',    keywords: [] },
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

const CARD_HEIGHT = 300;

function CardTile({ card, onComment, flush = false }: { card: FeedCard; onComment: (id: string) => void; flush?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const [liked, setLiked] = useState(() => {
    if (card.is_liked_by_user) return true;
    try { return JSON.parse(localStorage.getItem('ariel_liked') || '[]').includes(card.id); } catch { return false; }
  });
  const [likeCount, setLikeCount] = useState(card.likes ?? 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saved, setSaved] = useState(() => {
    if (card.is_saved_by_user) return true;
    try { return JSON.parse(localStorage.getItem('ariel_saved') || '[]').includes(card.id); } catch { return false; }
  });
  const [saveToast, setSaveToast] = useState(false);
  const [commentCount, setCommentCount] = useState(() => {
    const base = card.comments_count ?? 0;
    try {
      const commented: string[] = JSON.parse(localStorage.getItem('ariel_commented') || '[]');
      return commented.includes(card.id) ? Math.max(base, 1) : base;
    } catch { return base; }
  });
  const [saveCount, setSaveCount] = useState(card.saves ?? 0);

  const [cardComments, setCardComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string; username: string} | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(`ariel_clikes_${card.id}`) || '{}'); } catch { return {}; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<number>(0);

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    try {
      const { commentsAPI } = await import('@/lib/api');
      const data = await commentsAPI.getCardComments(card.id, 5);
      // Merge any locally liked comments so optimistic likes survive remounts
      let localLikes: Record<string, boolean> = {};
      try { localLikes = JSON.parse(localStorage.getItem(`ariel_clikes_${card.id}`) || '{}'); } catch {}
      const merged = data.map((c: any) =>
        localLikes[c.id] ? { ...c, likes: Math.max((c.likes || 0), 1) } : c
      );
      setCardComments(merged);
      if (data.length > 0) setCommentCount(prev => Math.max(prev, data.length));
    } catch {}
    setCommentsLoaded(true);
  }, [card.id, commentsLoaded]);

  const submitComment = async () => {
    const text = commentInput.trim();
    if (!text || postingComment) return;
    setPostingComment(true);
    try {
      const { commentsAPI } = await import('@/lib/api');
      const content = replyingTo ? `@${replyingTo.username} ${text}` : text;
      const newComment = await commentsAPI.postCardComment(card.id, content);
      setCardComments(prev => [newComment, ...prev]);
      setCommentInput('');
      setReplyingTo(null);
      setCommentCount(c => c + 1);
    } catch {}
    setPostingComment(false);
  };

  const handleCommentLongPress = (commentId: string) => {
    if (likedComments[commentId]) return;
    const updated = { ...likedComments, [commentId]: true };
    setLikedComments(updated);
    try { localStorage.setItem(`ariel_clikes_${card.id}`, JSON.stringify(updated)); } catch {}
    setCardComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    ));
    import('@/lib/api').then(({ commentsAPI }) => {
      commentsAPI.toggleLike(commentId).catch(() => {});
    });
  };

  const startLongPress = (commentId: string) => {
    pressStart.current = Date.now();
    longPressTimer.current = setTimeout(() => handleCommentLongPress(commentId), 500);
  };

  const cancelLongPress = (commentId?: string) => {
    // If finger held long enough when released, still trigger (fixes iOS pointercancel)
    if (commentId && Date.now() - pressStart.current >= 480) {
      handleCommentLongPress(commentId);
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const key = getSubjectKey(card);
  const meta = SUBJECT_META[key];

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    if (next) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 400);
      cardsAPI.likeCard(card.id).catch(() => {});
    }
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('ariel_liked') || '[]');
      const updated = next ? [...stored.filter(id => id !== card.id), card.id] : stored.filter(id => id !== card.id);
      localStorage.setItem('ariel_liked', JSON.stringify(updated));
    } catch {}
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !saved;
    if (next) {
      cardsAPI.saveCardToDeck(card.id).catch(() => {});
      setSaveToast(true);
      setSaveCount(c => c + 1);
      setTimeout(() => setSaveToast(false), 1600);
    } else {
      setSaveCount(c => Math.max(0, c - 1));
    }
    setSaved(next);
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('ariel_saved') || '[]');
      const updated = next ? [...stored.filter(id => id !== card.id), card.id] : stored.filter(id => id !== card.id);
      localStorage.setItem('ariel_saved', JSON.stringify(updated));
    } catch {}
  };

  const [shareToast, setShareToast] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cards/${card.id}`;
    const copyFallback = () => {
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 1600);
      } catch {}
    };
    try {
      if (navigator.share) {
        await navigator.share({ title: card.question, text: card.question, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 1600);
      } else {
        copyFallback();
      }
    } catch {
      copyFallback();
    }
  };

  // Load comments on mount
  useEffect(() => { loadComments(); }, []);

  return (
    <div className="mb-5 relative overflow-hidden rounded-2xl">
      {/* Toasts */}
      {(saveToast || shareToast) && (
        <div className="animate-toast absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white whitespace-nowrap pointer-events-none">
          {saveToast ? 'Saved to deck ✓' : 'Link copied ✓'}
        </div>
      )}

      {/* ── Full bleed white card ── */}
      <div
        className="cursor-pointer relative overflow-hidden"
        style={{
          height: `${CARD_HEIGHT}px`,
        }}
        onClick={() => setFlipped(f => !f)}
      >
        {/* Subject accent bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${STRIP_COLOR[key] ?? 'via-zinc-400'} to-transparent z-10`} />

        {/* Q / A pill — top right corner */}
        <div className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${flipped ? 'bg-violet-500' : 'bg-zinc-200'}`}>
          <span className={`text-[11px] font-black ${flipped ? 'text-white' : 'text-zinc-600'}`}>{flipped ? 'A' : 'Q'}</span>
        </div>

        {/* Front — Question */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-200"
          style={{
            background: '#ffffff',
            opacity: flipped ? 0 : 1,
            transform: flipped ? 'scaleX(0.94) scaleY(0.97)' : 'scaleX(1) scaleY(1)',
            pointerEvents: flipped ? 'none' : 'auto',
          }}
        >
          <p className="text-zinc-800 font-bold text-[24px] text-center leading-snug line-clamp-4">
            {card.question}
          </p>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5">
            {card.community_reviews && card.community_reviews > 0 ? (
              <span className="text-[10px] text-zinc-400 font-medium">
                📚 {card.community_reviews} studied · {card.community_pct_correct}% nailed it
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 font-medium">Be the first to study this</span>
            )}
            <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              tap to reveal
            </span>
          </div>
        </div>

        {/* Back — Answer */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 py-6 transition-all duration-200"
          style={{
            background: '#f8f6ff',
            opacity: flipped ? 1 : 0,
            transform: flipped ? 'scaleX(1) scaleY(1)' : 'scaleX(0.94) scaleY(0.97)',
            pointerEvents: flipped ? 'auto' : 'none',
          }}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="w-[3px] self-stretch rounded-full bg-violet-400 flex-shrink-0" />
            <p className="text-zinc-800 font-semibold text-[20px] leading-snug line-clamp-4">
              {card.answer || 'No answer provided.'}
            </p>
          </div>
          <span className="absolute bottom-4 text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            tap to hide
          </span>
        </div>
      </div>

      {/* ── Below card: author + actions on dark background ── */}
      <div className="flex items-center px-4 pt-2.5 pb-1">
        {/* Avatar */}
        <div className="flex-shrink-0 relative mr-2.5">
          {card.author_profile_picture ? (
            <img
              src={card.author_profile_picture.replace(/^https?:\/\/[^/]+/, '')}
              alt={card.author_username}
              className="w-8 h-8 rounded-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
              <span className="text-xs font-bold text-white">
                {card.author_username?.[0]?.toUpperCase() ?? meta.icon}
              </span>
            </div>
          )}
        </div>

        {/* Name + subject */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-bold text-white leading-none truncate">
              {card.author_full_name || card.author_username || 'Ariel User'}
            </span>
            <span className="text-[12px] text-zinc-500">·</span>
            <span className="text-[12px] text-zinc-500 truncate">
              {card.subject ?? meta.short}
            </span>
            {card.created_at && (
              <span className="text-[12px] text-zinc-600">{timeAgo(card.created_at)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3.5 flex-shrink-0 ml-2">
          <button onClick={handleLike} className="flex items-center gap-1 group">
            <svg className={`w-5 h-5 transition-transform active:scale-125 ${liked ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-200'} ${likeAnim ? 'animate-heart-pop' : ''}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likeCount > 0 && <span className={`text-xs font-semibold ${liked ? 'text-red-400' : 'text-zinc-500'}`}>{likeCount}</span>}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              try {
                const commented: string[] = JSON.parse(localStorage.getItem('ariel_commented') || '[]');
                if (!commented.includes(card.id)) {
                  localStorage.setItem('ariel_commented', JSON.stringify([...commented, card.id]));
                  setCommentCount(c => c + 1);
                }
              } catch {}
              onComment(card.id);
            }}
            className="flex items-center gap-1 group"
          >
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-200 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentCount > 0 && <span className="text-xs font-semibold text-zinc-500">{commentCount}</span>}
          </button>

          <button onClick={handleShare} className="group">
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-200 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>

          <button onClick={handleSave} className="flex items-center gap-1 group">
            {saveCount > 0 && <span className={`text-xs font-semibold ${saved ? 'text-violet-400' : 'text-zinc-500'}`}>{saveCount}</span>}
            <svg className={`w-5 h-5 transition-colors ${saved ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-200'}`} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Inline comments ── */}
      <div className="px-4 pb-4">
        {/* Comments — Twitter style */}
        {cardComments.length > 0 && (
          <div className="mb-3">
            {cardComments.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                className={`flex items-start gap-3 ${i > 0 ? 'mt-4' : ''} select-none`}
                onPointerDown={() => startLongPress(c.id)}
                onPointerUp={() => cancelLongPress(c.id)}
                onPointerLeave={() => cancelLongPress()}
                onPointerCancel={() => cancelLongPress(c.id)}
              >
                {/* Avatar → profile */}
                <button onClick={() => c.user_id && window.location.assign(`/profile/${c.user_id}`)} className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center">
                    {c.author_profile_picture ? (
                      <img src={c.author_profile_picture.replace(/^https?:\/\/[^/]+/, '')} className="w-7 h-7 object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-zinc-300">{(c.author_username || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                </button>

                <div className="flex-1 min-w-0">
                  {/* Username on its own line */}
                  <button
                    onClick={() => {
                      setReplyingTo({ id: c.id, username: c.author_username || 'user' });
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="text-[13px] font-bold text-white leading-none mb-1 block"
                  >
                    {c.author_username || 'user'}
                  </button>
                  {/* Comment text on its own line */}
                  <p className="text-[14px] leading-relaxed text-zinc-300 break-words">
                    {c.content}
                    {(c.likes > 0 || likedComments[c.id]) && (
                      <span className="inline-flex items-center gap-0.5 ml-2 align-middle">
                        <svg className="w-3 h-3 text-violet-400 inline" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {c.likes > 0 && <span className="text-[11px] text-violet-400 font-semibold">{c.likes}</span>}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            {commentCount > 5 && (
              <button onClick={() => onComment(card.id)} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mt-2.5 block">
                View all {commentCount} answers
              </button>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 border-b border-zinc-800 focus-within:border-zinc-600 transition-colors pb-1">
            {replyingTo && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[11px] text-violet-400">Replying to @{replyingTo.username}</span>
                <button onClick={() => setReplyingTo(null)} className="text-[11px] text-zinc-600 hover:text-zinc-400 ml-1">✕</button>
              </div>
            )}
            <input
              ref={inputRef}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : 'Add your answer…'}
              className="w-full bg-transparent text-[14px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          {commentInput.trim() && (
            <button
              onClick={submitComment}
              disabled={postingComment}
              className="text-[12px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
            >
              {postingComment ? '…' : 'Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reels Row (autoplay preview) ────────────────────────────────────────────

function ReelCard({ reel, onNavigate }: { reel: Reel; onNavigate: (path: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else { video.pause(); video.currentTime = 0; }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      onClick={() => onNavigate('/reels')}
      className="flex-shrink-0 w-[130px] rounded-2xl overflow-hidden relative bg-zinc-900"
      style={{ aspectRatio: '9/16' }}
    >
      {reel.video_url ? (
        <video
          ref={videoRef}
          src={reel.video_url.replace(/^https?:\/\/localhost(:\d+)?/, '')}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          poster={reel.thumbnail_url ? reel.thumbnail_url.replace(/^https?:\/\/localhost(:\d+)?/, '') : undefined}
        />
      ) : reel.thumbnail_url ? (
        <img
          src={reel.thumbnail_url.replace(/^https?:\/\/localhost(:\d+)?/, '')}
          alt={reel.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-2.5">
        <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">{reel.title}</p>
        <p className="text-[9px] text-white/50 mt-0.5 truncate">@{reel.creator_username}</p>
      </div>
    </button>
  );
}

function ReelsRow({ reels, fallbackTopics, onNavigate }: {
  reels: Reel[];
  fallbackTopics: { topic: string; subjectKey: string }[];
  onNavigate: (path: string) => void;
}) {
  const hasReal = reels.length > 0;

  return (
    <div className="-mx-4">
      {/* Wrapped section */}
      <div style={{ background: '#111115', borderTop: '1px solid #27272a', borderBottom: '1px solid #27272a' }} className="py-5 my-0">
        {/* Header — inside padding */}
        <div className="flex items-start justify-between mb-4 px-4">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              {/* Equalizer bars — Ariel's content indicator */}
              <div className="flex items-end gap-[3px] h-4 flex-shrink-0">
                <div className="w-[3px] rounded-full bg-violet-400" style={{ height: '45%', animation: 'pulse 1.1s ease-in-out infinite' }} />
                <div className="w-[3px] rounded-full bg-violet-400" style={{ height: '100%', animation: 'pulse 1.1s ease-in-out infinite 0.25s' }} />
                <div className="w-[3px] rounded-full bg-violet-500" style={{ height: '65%', animation: 'pulse 1.1s ease-in-out infinite 0.5s' }} />
                <div className="w-[3px] rounded-full bg-violet-400" style={{ height: '85%', animation: 'pulse 1.1s ease-in-out infinite 0.15s' }} />
              </div>
              <span className="text-base font-black text-white tracking-tight">Short Clips</span>
            </div>
            <p className="text-xs text-zinc-400">Quick learning videos from the community</p>
          </div>
          <button onClick={() => onNavigate('/reels')} className="text-xs text-zinc-400 hover:text-white transition-colors font-semibold flex items-center gap-1 mt-0.5 flex-shrink-0">
            See all
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      {/* Full-bleed scroll strip */}
      <div className="flex gap-3 overflow-x-auto pl-4 pb-2 pr-4" style={{ scrollbarWidth: 'none' }}>
        {hasReal
          ? reels.slice(0, 8).map((reel) => (
              <ReelCard key={reel.id} reel={reel} onNavigate={onNavigate} />
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

function CardSkeleton({ height = 210, flush = false }: { height?: number; flush?: boolean }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-zinc-700/60 bg-[#1e1e22] mb-3">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded-full w-2/5" />
          <div className="h-2.5 bg-zinc-800 rounded-full w-1/4" />
        </div>
      </div>
      <div style={{ height: `${height}px`, background: '#d8d8de' }} />
      <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-zinc-800/60">
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
        <div className="flex-1 h-8 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}

function ArielSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1e1e22] border border-zinc-700/60 p-4 mb-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="h-3 bg-zinc-800 rounded-full w-10" />
            <div className="h-3 bg-zinc-800 rounded-full w-5" />
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full w-3/4" />
          <div className="h-2.5 bg-zinc-800 rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-6 w-24 bg-zinc-800 rounded-full" />
        <div className="h-6 w-20 bg-zinc-800 rounded-full" />
        <div className="h-6 w-28 bg-zinc-800 rounded-full" />
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FeedCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou');
  const [followingCards, setFollowingCards] = useState<FeedCard[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
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
    notificationsAPI.getSummary().then((d: any) => setUnreadNotifications(d?.unread_count ?? 0)).catch(() => {});

    Promise.all([
      gamificationAPI.getStats().catch(() => null),
      cardsAPI.getDueCards(50).catch(() => []),
      cardsAPI.getPersonalizedFeed(40).catch(() => []),
      api.get('/api/reels/feed').catch(() => ({ data: [] })),
    ]).then(([gam, due, feed, reelsRes]) => {
      setGamification(gam || {});
      setDueCards((due as DueCard[]) || []);
      // Map created_by fields to author_* fields expected by dashboard
      const mappedFeed = ((feed as any[]) || []).map((card: any) => ({
        ...card,
        author_username: card.author_username || card.created_by?.username,
        author_full_name: card.author_full_name || card.created_by?.full_name,
        author_profile_picture: card.author_profile_picture || card.created_by?.profile_picture,
      }));
      setFeedCards(mappedFeed as FeedCard[]);
      const allReels: Reel[] = (reelsRes as any).data ?? [];
      setReels(allReels.filter(r => r.video_url && r.kind !== 'card'));
    }).finally(() => setDataLoading(false));
  }, [isAuthenticated, isLoading, user]);

  // Fetch following feed when tab selected
  useEffect(() => {
    if (feedTab !== 'following' || !isAuthenticated) return;
    if (followingCards.length > 0) return; // already loaded
    setFollowingLoading(true);
    cardsAPI.getFollowingFeed(40).then((data: any) => {
      const mapped = ((data as any[]) || []).map((card: any) => ({
        ...card,
        author_username: card.author_username || card.created_by?.username,
        author_full_name: card.author_full_name || card.created_by?.full_name,
        author_profile_picture: card.author_profile_picture || card.created_by?.profile_picture,
      }));
      setFollowingCards(mapped);
    }).catch(() => setFollowingCards([])).finally(() => setFollowingLoading(false));
  }, [feedTab, isAuthenticated]);

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
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-600 border-t-violet-300 rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-24 page-enter">

        {/* ── Sticky header ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-900">

          {/* Ariel violet crown line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />

          {showSearch ? (
            /* Search mode */
            <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
              <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 h-10 gap-2 focus-within:border-violet-400/60 transition-colors">
                <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && (setSearchQuery(''), setShowSearch(false))}
                  placeholder="Search cards, topics..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none min-w-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* ── Single row: avatar+name left | icons+ariel right ── */}
              <div className="max-w-3xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
                {/* Left: avatar + name below */}
                <button onClick={() => router.push('/profile')} className="flex flex-col items-start flex-shrink-0">
                  <div className="relative">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.username}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-base font-black text-white">
                          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {streakDays > 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none bg-[#09090b] rounded-full px-0.5">🔥</span>
                    )}
                  </div>
                  {dataLoading ? (
                    <span className="inline-block w-10 h-3 bg-zinc-800 rounded-full animate-pulse mt-1" />
                  ) : (
                    <span className="text-[20px] font-black text-white leading-none tracking-tight mt-1">{firstName || 'there'}</span>
                  )}
                </button>

                {/* Right: ariel wordmark above icons */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="select-none" style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    lineHeight: 1,
                    letterSpacing: '1px',
                  }}>
                    <span style={{ color: '#ffffff' }}>ar</span>
                    <span style={{ color: '#9B7FFF' }}>i</span>
                    <span style={{ color: '#ffffff' }}>el</span>
                  </span>
                  <div className="flex items-center gap-0.5">
                  <button onClick={() => router.push('/search')} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button onClick={() => router.push('/messages')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    {/* Rooms: two overlapping bubbles = group/community */}
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v3l-3-3H9a2 2 0 01-2-2v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H8l-3 3V6z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white leading-none px-0.5">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push('/notifications')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white leading-none px-0.5">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                      </span>
                    )}
                  </button>
                  <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors lg:hidden">
                    {/* Three vertical dots */}
                    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  </div>
                </div>
              </div>

              {/* Subject filter strip */}
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 pt-2" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => { setActiveSubject(null); setActiveTopic(null); }}
                    className={`flex-shrink-0 px-4 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all ${!activeSubject ? 'bg-violet-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    All
                  </button>
                  {userSubjects.map(key => {
                    const m = SUBJECT_META[key] || SUBJECT_META.other;
                    const isActive = activeSubject === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleStoryTap(key)}
                        className={`flex-shrink-0 flex items-center gap-1 px-4 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${
                          isActive ? 'bg-violet-500 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.short}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowSubjectPicker(true)}
                    className="flex-shrink-0 px-4 py-1 rounded-full text-[11px] font-bold text-zinc-600 hover:text-zinc-400 transition-all"
                  >
                    + more
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        {/* ── Feed ──────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pb-4">

          {/* Topic chips — only when a subject is active */}
          {activeSubject && topicChips.length > 0 && !searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1" style={{ scrollbarWidth: 'none' }}>
              {topicChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChipTap(chip)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeTopic === chip
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'

                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}


          {/* ── Feed tabs ── */}
          {!searchQuery && (
            <div className="flex items-center gap-6 mt-5 mb-1 px-1">
              <button
                onClick={() => setFeedTab('foryou')}
                className={`relative text-[15px] font-black tracking-tight transition-all pb-2 ${feedTab === 'foryou' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                For You
                {feedTab === 'foryou' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-400 rounded-full" />}
              </button>
              <button
                onClick={() => setFeedTab('following')}
                className={`relative text-[15px] font-black tracking-tight transition-all pb-2 ${feedTab === 'following' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Following
                {feedTab === 'following' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-400 rounded-full" />}
              </button>
            </div>
          )}

          {/* Search results label */}
          {searchQuery.trim().length >= 2 && (
            <div className="flex items-center justify-between pt-3 mb-4">
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                {searching ? (
                  <span className="w-3.5 h-3.5 border border-zinc-600 border-t-violet-300 rounded-full animate-spin inline-block" />
                ) : (
                  <span className="font-bold text-white">{displayCards.length}</span>
                )}
                {!searching && <> result{displayCards.length !== 1 ? 's' : ''} for "<span className="text-violet-300">{searchQuery}</span>"</>}
                {searching && <span className="text-zinc-400">Searching...</span>}
              </p>
              <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Clear</button>
            </div>
          )}

          {/* Card feed */}
          {feedTab === 'following' && !searchQuery ? (
            followingLoading ? (
              <div className="flex items-center justify-center py-24">
                <ArielLoader size={52} />
              </div>
            ) : followingCards.length > 0 ? (
              <div className="mt-3">
                {followingCards.map((card, i) => (
                  <CardTile key={card.id} card={card} onComment={openComments} flush={i === 0} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-base font-bold text-white">Nothing from your following yet</p>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-[240px]">The people you follow haven't posted public cards yet.</p>
                <button onClick={() => router.push('/explore')} className="mt-5 px-5 py-2.5 rounded-full bg-violet-500 text-white text-sm font-bold active:scale-95 transition-all">
                  Explore people
                </button>
              </div>
            )
          ) : dataLoading ? (
            <div className="flex items-center justify-center py-24">
              <ArielLoader size={52} />
            </div>
          ) : displayCards.length > 0 ? (
            <>
              {/* Due for review — elegant strip */}
              {dueCards.length > 0 && !searchQuery && (
                <div className="mt-5 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Review</span>
                      <span className="text-[11px] font-black text-white bg-zinc-800 px-2 py-0.5 rounded-full">{dueCards.length}</span>
                    </div>
                    <button onClick={() => router.push('/deck')} className="text-[11px] font-bold text-zinc-500 hover:text-white transition-colors tracking-wide">Study all</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
                    {dueCards.slice(0, 10).map(card => (
                      <button
                        key={card.id}
                        onClick={() => router.push('/deck')}
                        className="flex-shrink-0 w-36 p-3 rounded-2xl bg-zinc-900 text-left active:scale-95 transition-all"
                      >
                        <p className="text-[11px] font-semibold text-zinc-300 line-clamp-3 leading-snug">{card.question}</p>
                        {card.subject && <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-wide truncate">{card.subject}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Continuous feed — no artificial end */}
              <div className="mt-2">
                {displayCards.map((card, i) => (
                  <div key={card.id}>
                    <CardTile card={card} onComment={openComments} />
                    {/* Ariel prompt every 5 cards */}
                    {!searchQuery && i === 4 && (
                      <div className="-mx-4 mb-5">
                        <button onClick={openAriel} className="w-full text-left border-t border-b border-zinc-900 p-4" style={{ background: '#111113' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0d0d18] border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 24, color: '#c4b0ff', lineHeight: 1 }}>a</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-none">Ask Ariel</p>
                              <p className="text-xs text-zinc-500 mt-0.5">Generate cards, explain topics, build a study plan</p>
                            </div>
                            <span className="ml-auto text-xs font-bold text-violet-400 flex-shrink-0">Try it →</span>
                          </div>
                        </button>
                      </div>
                    )}
                    {/* Clips row after card 3 */}
                    {!searchQuery && !activeTopic && i === 2 && (
                      <ReelsRow reels={reels} fallbackTopics={reelTopics} onNavigate={router.push} />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              {/* Ariel avatar with sparkle */}
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-violet-400 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">A</span>
                </div>
                <span className="absolute -top-1 -right-1 text-base">✦</span>
              </div>
              <p className="text-base font-bold text-white">
                {activeSubject || activeTopic ? 'Nothing here yet' : 'Your feed is wide open'}
              </p>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-[240px]">
                {activeSubject || activeTopic
                  ? 'No cards in this area yet — be the first to add some.'
                  : "Tell me what you're studying and I'll fill this up for you."}
              </p>
              <button
                onClick={openAriel}
                className="mt-6 px-6 py-2.5 rounded-full bg-violet-400 hover:bg-violet-400 active:scale-95 text-white text-sm font-bold transition-all"
              >
                {activeSubject || activeTopic ? 'Create cards' : 'Start with Ariel'}
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
                    <button key={key} onClick={() => addSubject(key)} className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-800 hover:border-violet-300/40 hover:bg-violet-400/5 transition-all text-left">
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

      {/* More drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black border-t border-zinc-800 rounded-t-3xl pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="grid grid-cols-4 gap-1 px-4">
              {drawerItems.map((item) => {
                const isActive = typeof window !== 'undefined' && (window.location.pathname === item.path || window.location.pathname.startsWith(item.path + '/'));
                return (
                  <button
                    key={item.name}
                    onClick={() => { router.push(item.path); setDrawerOpen(false); }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors ${
                      isActive ? 'bg-zinc-800 text-violet-300' : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
