'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import api, { gamificationAPI, cardsAPI, messagesAPI, notificationsAPI, commentsAPI } from '@/lib/api';
import { useAriel } from '@/lib/arielContext';
import { useComments } from '@/lib/commentsContext';
import BottomNav, { drawerItems } from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import Onboarding from '@/components/Onboarding';
import ArielIcon from '@/components/ArielIcon';
import ArielWordmark from '@/components/ArielWordmark';
import ArielLoader from '@/components/ArielLoader';
import SubjectIcon from '@/components/SubjectIcon';
import { SUBJECT_META, TOPICS_BY_SUBJECT, getTopics, getSubjectKey as getSubjectKeyFromLib } from '@/lib/subjects';

// ─── Types ────────────────────────────────────────────────────────────────────

const STRIP_COLOR: Record<string, string> = {
  gospel: 'via-amber-400', business: 'via-sky-400', economics: 'via-violet-400',
  technology: 'via-zinc-400', health: 'via-rose-400', mathematics: 'via-indigo-400',
  sciences: 'via-emerald-400', history: 'via-amber-400', literature: 'via-orange-400',
  languages: 'via-teal-400', law: 'via-slate-400', arts: 'via-fuchsia-400',
  psychology: 'via-cyan-400', engineering: 'via-yellow-400', geography: 'via-lime-400',
  other: 'via-zinc-400',
};

// Solid hex values for left border — avoids Tailwind purge issues with dynamic class names
const SUBJECT_COLOR: Record<string, string> = {
  gospel: '#fbbf24', business: '#38bdf8', economics: '#a78bfa',
  technology: '#a1a1aa', health: '#fb7185', mathematics: '#818cf8',
  sciences: '#34d399', history: '#f59e0b', literature: '#fb923c',
  languages: '#2dd4bf', law: '#94a3b8', arts: '#e879f9',
  psychology: '#22d3ee', engineering: '#facc15', geography: '#a3e635',
  other: '#a1a1aa',
};

// Rich diagonal gradients per subject — psychologically chosen to attract & retain
const CARD_GRADIENT: Record<string, string> = {
  gospel:      'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',   // gold → deep red — faith, warmth
  business:    'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',   // sky → navy — trust, ambition
  economics:   'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',   // violet → indigo — wealth, depth
  technology:  'linear-gradient(135deg, #334155 0%, #0f172a 100%)',   // slate — precision, dark tech
  health:      'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',   // emerald → cyan — vitality, fresh
  mathematics: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',   // indigo → deep — logic, deep space
  sciences:    'linear-gradient(135deg, #06b6d4 0%, #0d9488 100%)',   // cyan → teal — discovery, nature
  history:     'linear-gradient(135deg, #b45309 0%, #7c2d12 100%)',   // amber → brown — ancient, earthy
  literature:  'linear-gradient(135deg, #f97316 0%, #be123c 100%)',   // orange → crimson — passion, story
  languages:   'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',   // teal → sky — flow, communication
  law:         'linear-gradient(135deg, #475569 0%, #1e293b 100%)',   // slate — authority, formal
  arts:        'linear-gradient(135deg, #d946ef 0%, #7c3aed 100%)',   // fuchsia → violet — creativity, wild
  psychology:  'linear-gradient(135deg, #7c3aed 0%, #1d4ed8 100%)',   // deep violet → blue — mind, depth
  engineering: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',   // amber — construction, energy
  geography:   'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',   // green → teal — earth, life
  other:       'linear-gradient(135deg, #52525b 0%, #27272a 100%)',
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
  caption?: string;
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

// ─── Data — imported from lib/subjects (single source of truth) ───────────────

function getSubjectKey(card: FeedCard): string {
  return getSubjectKeyFromLib({ subject: card.subject, topic: card.topic });
}

function timeAgo(d?: string) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// Time-aware seeded view count — grows with post age, capped at 5k, varies per card
function seedViews(cardId: string, createdAt?: string): string {
  // Deterministic 0–1 variation factor from card ID
  let h = 0;
  for (let i = 0; i < cardId.length; i++) {
    h = (Math.imul(31, h) + cardId.charCodeAt(i)) | 0;
  }
  const v = (Math.abs(h) % 1000) / 1000; // 0.000 – 0.999

  let n: number;
  if (createdAt) {
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
    if      (ageDays < 0.04) n = Math.floor(5   + v * 30);    //  < 1 hr:  5–35
    else if (ageDays < 1)    n = Math.floor(30  + v * 120);   //  < 1 day: 30–150
    else if (ageDays < 3)    n = Math.floor(150 + v * 500);   //  1–3 d:   150–650
    else if (ageDays < 7)    n = Math.floor(500 + v * 1000);  //  3–7 d:   500–1500
    else if (ageDays < 30)   n = Math.floor(1200 + v * 2000); //  1–4 wk:  1.2k–3.2k
    else                     n = Math.floor(3000 + v * 2000); //  1+ mo:   3k–5k
  } else {
    n = Math.floor(200 + v * 800); // fallback: 200–1000
  }

  n = Math.min(n, 5000);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function renderWithMentions(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-violet-400 font-semibold">{part}</span>
      : part
  );
}

function AuthorAvatar({ card, meta }: { card: FeedCard; meta: any }) {
  const [broken, setBroken] = useState(false);
  if (card.author_profile_picture && !broken) {
    return (
      <img
        src={card.author_profile_picture}
        alt={card.author_username}
        className="w-10 h-10 rounded-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
      <span className="text-sm font-bold text-white">
        {card.author_username?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

// ─── Card Tile (square, 1:1) ─────────────────────────────────────────────────

function CardTile({ card, onComment, flush = false }: { card: FeedCard; onComment: (id: string) => void; flush?: boolean }) {
  const { user } = useAuth();
  const [flipped, setFlipped] = useState(false);
  const [liked, setLiked] = useState(() => {
    if ((card as any).is_liked || card.is_liked_by_user) return true;
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
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string; username: string} | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(`ariel_clikes_${card.id}`) || '{}'); } catch { return {}; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsAPI.getCardComments(card.id, 50);
      let localLikes: Record<string, boolean> = {};
      try { localLikes = JSON.parse(localStorage.getItem(`ariel_clikes_${card.id}`) || '{}'); } catch {}
      const merged = data.map((c: any) =>
        localLikes[c.id] ? { ...c, likes: Math.max((c.likes || 0), 1) } : c
      );
      setCardComments(merged);
      if (data.length > 0) setCommentCount(prev => Math.max(prev, data.length));
    } catch {}
    setCommentsLoaded(true);
  }, [card.id]);

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    fetchComments();
  }, [commentsLoaded, fetchComments]);

  const submitComment = async () => {
    const text = commentInput.trim();
    if (!text || postingComment) return;
    setPostingComment(true);
    try {
      const content = replyingTo ? `@${replyingTo.username} ${text}` : text;
      const newComment = await commentsAPI.postCardComment(card.id, content);
      setCardComments(prev => [newComment, ...prev]);
      setCommentInput('');
      setReplyingTo(null);
      setCommentCount(c => c + 1);
    } catch {}
    setPostingComment(false);
  };

  const handleCommentLike = (commentId: string) => {
    const alreadyLiked = !!likedComments[commentId];
    // Optimistic update
    const updated = { ...likedComments, [commentId]: !alreadyLiked };
    setLikedComments(updated);
    try { localStorage.setItem(`ariel_clikes_${card.id}`, JSON.stringify(updated)); } catch {}
    setCardComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 0) + (alreadyLiked ? -1 : 1)) } : c
    ));
    // Fire and forget — optimistic state stays regardless
    commentsAPI.toggleLike(commentId)
      .then((res: any) => {
        if (typeof res?.likes === 'number') {
          setCardComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: res.likes } : c));
        }
      })
      .catch(() => { /* keep optimistic state */ });
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
    }
    cardsAPI.likeCard(card.id).catch(() => {
      // Revert on failure
      setLiked(!next);
      setLikeCount(c => next ? Math.max(0, c - 1) : c + 1);
    });
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

  // Load comments on mount + poll every 15s for new comments
  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 15000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  return (
    <div className="relative py-4">
      {/* Toasts */}
      {(saveToast || shareToast) && (
        <div className="animate-toast absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white whitespace-nowrap pointer-events-none">
          {saveToast ? 'Saved to deck ✓' : 'Link copied ✓'}
        </div>
      )}

      <div className="flex gap-3">
        {/* ── Left column: avatar ── */}
        <div className="flex-shrink-0 pt-0.5">
          <AuthorAvatar card={card} meta={meta} />
        </div>

        {/* ── Right column: everything ── */}
        <div className="flex-1 min-w-0">

          {/* Author row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[15px] font-bold leading-none truncate" style={{ color: '#e7e9ea' }}>
                {card.author_full_name || card.author_username || 'Ariel User'}
              </span>
              <span className="text-[13px]" style={{ color: '#4a5058' }}>·</span>
              <span className="text-[13px] truncate" style={{ color: '#8b9099' }}>{card.subject ?? meta.short}</span>
              {card.created_at && (
                <>
                  <span className="text-[13px]" style={{ color: '#4a5058' }}>·</span>
                  <span className="text-[13px] flex-shrink-0" style={{ color: '#8b9099' }}>{timeAgo(card.created_at)}</span>
                </>
              )}
            </div>
          </div>

          {/* ── Caption ── */}
          {card.caption && (
            <p className="text-[15px] leading-relaxed mt-2" style={{ color: '#e7e9ea' }}>
              {renderWithMentions(card.caption)}
            </p>
          )}

          {/* ── Card face ── */}
          <div
            className="cursor-pointer overflow-hidden rounded-2xl mt-2 relative flex"
            style={{
              minHeight: '120px',
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 2px 20px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 8px 24px rgba(0,0,0,0.07), inset 0 -4px 12px rgba(0,0,0,0.04)',
            }}
            onClick={() => setFlipped(f => !f)}
          >
            {/* Glassy edge vignette */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.04) 100%)',
            }} />

            {/* Left subject accent line */}
            <div
              className="w-[3px] flex-shrink-0 rounded-l-2xl"
              style={{ background: flipped ? '#8b5cf6' : (SUBJECT_COLOR[key] ?? '#a1a1aa') }}
            />

            {/* Content */}
            <div className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
              {/* Top: label + subject chip */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: flipped ? '#8b5cf6' : (SUBJECT_COLOR[key] ?? '#a1a1aa') }}
                >
                  {flipped ? 'Answer' : 'Question'}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                  <SubjectIcon subject={key} size={11} />{meta.short}
                </span>
              </div>

              {/* Main text */}
              <div className="py-2">
                <p className={`font-bold leading-snug ${flipped ? 'text-violet-900' : 'text-zinc-900'} ${
                  (flipped ? card.answer ?? '' : card.question).length > 130
                    ? 'text-[14px]'
                    : (flipped ? card.answer ?? '' : card.question).length > 75
                    ? 'text-[17px]'
                    : 'text-[22px]'
                }`}>
                  {flipped ? (card.answer || 'No answer provided.') : card.question}
                </p>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-2 mt-1 border-t"
                style={{ borderColor: flipped ? 'rgba(139,92,246,0.12)' : 'rgba(0,0,0,0.06)' }}
              >
                {card.community_reviews != null && card.community_reviews > 0 ? (
                  <span className="text-[10px] text-zinc-400">{card.community_reviews} studied · {card.community_pct_correct}% correct</span>
                ) : <span />}
                <span className="text-[10px]" style={{ color: flipped ? 'rgba(139,92,246,0.45)' : 'rgba(0,0,0,0.22)' }}>
                  {flipped ? 'tap to close ↺' : 'tap to reveal →'}
                </span>
              </div>
            </div>
          </div>


          {/* ── Action bar ── */}
          <div className="flex items-center justify-between pt-2">
            {/* Like */}
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <svg className={`w-[19px] h-[19px] transition-transform active:scale-125 ${liked ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-200'} ${likeAnim ? 'animate-heart-pop' : ''}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && <span className={`text-[13px] font-normal ${liked ? 'text-red-400' : ''}`} style={!liked ? { color: '#8b9099' } : {}}>{likeCount}</span>}
            </button>

            {/* Comment */}
            <button onClick={(e) => { e.stopPropagation(); onComment(card.id); }} className="flex items-center gap-1.5 group">
              <svg className="w-[19px] h-[19px] text-zinc-400 group-hover:text-zinc-200 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount > 0 && <span className="text-[13px] font-normal" style={{ color: '#8b9099' }}>{commentCount}</span>}
            </button>

            {/* Share */}
            <button onClick={handleShare} className="group">
              <svg className="w-[19px] h-[19px] text-zinc-400 group-hover:text-zinc-200 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>

            {/* Views — eye */}
            <div className="flex items-center gap-1.5">
              <svg className="w-[17px] h-[17px] text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-[13px] font-normal" style={{ color: '#8b9099' }}>{seedViews(card.id, card.created_at)}</span>
            </div>

            {/* Save */}
            <button onClick={handleSave} className="flex items-center gap-1.5 group">
              {saveCount > 0 && <span className={`text-[13px] font-normal ${saved ? 'text-violet-400' : ''}`} style={!saved ? { color: '#8b9099' } : {}}>{saveCount}</span>}
              <svg className={`w-[19px] h-[19px] transition-colors ${saved ? 'text-violet-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          {/* ── Comments ── */}
          {cardComments.length > 0 && (
            <div className="mt-3 pt-1">
              {/* Scrollable container when expanded */}
              <div
                className="overflow-y-auto transition-all duration-300"
                style={{
                  maxHeight: showAllComments ? '320px' : 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {(showAllComments ? cardComments : cardComments.slice(0, 3)).map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-start gap-2.5 ${i > 0 ? 'mt-4' : ''}`}
                  >
                    {/* Avatar */}
                    <button onClick={() => c.user_id && window.location.assign(`/profile/${c.user_id}`)} className="flex-shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {c.author_profile_picture ? (
                          <img
                            src={c.author_profile_picture}
                            className="w-7 h-7 object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style'); }}
                          />
                        ) : null}
                        <span className="text-[11px] font-bold text-zinc-400" style={c.author_profile_picture ? { display: 'none' } : {}}>
                          {(c.author_username || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    </button>

                    {/* Username + text */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setReplyingTo({ id: c.id, username: c.author_username || 'user' }); setTimeout(() => inputRef.current?.focus(), 50); }}
                        className="text-[15px] font-bold leading-none mb-1 block"
                        style={{ color: '#e7e9ea' }}
                      >
                        {c.author_username || 'user'}
                      </button>
                      <p className="text-[15px] leading-relaxed break-words" style={{ color: '#e7e9ea' }}>
                        {renderWithMentions(c.content)}
                      </p>
                    </div>

                    {/* Like button — right side, thumbs up, violet */}
                    <button
                      onClick={() => handleCommentLike(c.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5 min-w-[28px]"
                    >
                      <svg
                        className={`w-4 h-4 transition-colors ${likedComments[c.id] ? 'text-violet-400' : 'text-zinc-600'}`}
                        fill={likedComments[c.id] ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={1.75}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                      </svg>
                      {c.likes > 0 && (
                        <span className={`text-[10px] font-semibold leading-none ${likedComments[c.id] ? 'text-violet-400' : 'text-zinc-600'}`}>
                          {c.likes}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              {cardComments.length > 3 && (
                <button
                  onClick={() => setShowAllComments(v => !v)}
                  className="text-[13px] mt-2.5 block transition-colors"
                  style={{ color: '#8b9099' }}
                >
                  {showAllComments ? 'Show less' : `View all ${cardComments.length} replies ↓`}
                </button>
              )}
            </div>
          )}

          {/* ── Input ── */}
          <div className="flex items-center gap-2 mt-3">
            {/* Current user avatar */}
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-zinc-400">
                  {(user?.full_name?.[0] || user?.username?.[0] || 'Y').toUpperCase()}
                </span>
              )}
            </div>
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
                placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : "What's your take…"}
                className="w-full bg-transparent text-[15px] placeholder:text-[#3f4447] focus:outline-none" style={{ color: '#e7e9ea' }}
              />
            </div>
            {commentInput.trim() && (
              <button onClick={submitComment} disabled={postingComment} className="text-[12px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0">
                {postingComment ? '…' : 'Post'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Full-bleed post separator — runs edge to edge, breaks out of px-4 parent */}
      <div className="-mx-4 mt-3 h-px" style={{ background: '#2f3336' }} />
    </div>
  );
}

// ─── Stories Row ─────────────────────────────────────────────────────────────

function StoriesRow({ users, onUserTap }: {
  users: { id: string; username: string; full_name?: string; profile_picture?: string }[];
  onUserTap: (userId: string) => void;
}) {
  if (users.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto py-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onUserTap(user.id)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full ring-2 ring-violet-500/60 ring-offset-2 ring-offset-[#000000] overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <span className="text-sm font-bold text-white" style={user.profile_picture ? { display: 'none' } : {}}>
              {(user.username || 'U')[0].toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium truncate max-w-[56px]">
            {user.username}
          </span>
        </button>
      ))}
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
      className="flex-shrink-0 w-[110px] rounded-2xl overflow-hidden relative bg-zinc-900"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {/* Centered play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-[12px] font-bold text-white leading-tight line-clamp-2">{reel.title}</p>
        <p className="text-[10px] text-white/50 mt-1 truncate">@{reel.creator_username}</p>
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
      <div style={{ background: '#000000', borderTop: '1px solid #2f3336', borderBottom: '1px solid #2f3336' }} className="py-5 my-0">
        {/* Header — inside padding */}
        <div className="flex items-start justify-between mb-4 px-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm-7 8l-5 3V8l5 3z" />
              </svg>
              <span className="text-[13px] font-black text-white tracking-tight">Clips</span>
            </div>
            <p className="text-[11px] text-zinc-500">Short videos from the community</p>
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
                  className={`flex-shrink-0 w-[180px] rounded-3xl overflow-hidden bg-gradient-to-b ${meta.gradient} relative`}
                  style={{ aspectRatio: '9/16' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Centered play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-[12px] font-bold text-white leading-tight">{topic}</p>
                    <p className="text-[10px] text-white/50 mt-1">{meta.short}</p>
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
  const { openComments, cardId: commentsCardId, closeComments } = useComments();
  const [sheetComments, setSheetComments] = useState<any[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [sheetPosting, setSheetPosting] = useState(false);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!commentsCardId) { setSheetComments([]); setSheetInput(''); return; }
    setSheetLoading(true);
    import('@/lib/api').then(({ commentsAPI }) => {
      commentsAPI.getCardComments(commentsCardId, 50)
        .then(data => setSheetComments(data))
        .catch(() => {})
        .finally(() => setSheetLoading(false));
    });
  }, [commentsCardId]);

  const submitSheetComment = async () => {
    const text = sheetInput.trim();
    if (!text || sheetPosting || !commentsCardId) return;
    setSheetPosting(true);
    try {
      const { commentsAPI } = await import('@/lib/api');
      const newComment = await commentsAPI.postCardComment(commentsCardId, text);
      setSheetComments(prev => [newComment, ...prev]);
      setSheetInput('');
    } catch {}
    setSheetPosting(false);
  };

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
  const [followingUsers, setFollowingUsers] = useState<{id: string; username: string; full_name?: string; profile_picture?: string}[]>([]);
  const [headerScrolled, setHeaderScrolled] = useState(false);
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
      import('@/lib/api').then(m => m.socialAPI.getFollowing(String(user?.id ?? ''))).catch(() => []),
    ]).then(([gam, due, feed, reelsRes, following]) => {
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
      setFollowingUsers(((following as any[]) || []).slice(0, 12));
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

  useEffect(() => {
    let prev = window.scrollY;
    let autoShowTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      const curr = window.scrollY;
      if (autoShowTimer) clearTimeout(autoShowTimer);
      if (curr > prev && curr > 60) {
        setHeaderScrolled(true);
        // Auto-restore header after 3s of no scrolling
        autoShowTimer = setTimeout(() => setHeaderScrolled(false), 3000);
      } else if (curr < prev) {
        setHeaderScrolled(false);
      }
      prev = curr;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (autoShowTimer) clearTimeout(autoShowTimer);
    };
  }, []);

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
    return <div className="min-h-screen bg-[#000000] flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-600 border-t-violet-300 rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#000000] lg:pl-[72px] pb-24 page-enter">

        {/* ── Sticky header ─────────────────────────────────────────────────── */}
        <header className={`sticky top-0 z-40 bg-[#000000] border-b border-zinc-800 transition-transform duration-300 ease-in-out ${headerScrolled ? '-translate-y-full' : 'translate-y-0'}`}>

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
                      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none bg-[#000000] rounded-full px-0.5">🔥</span>
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
                    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.5 2a8.5 8.5 0 105.374 15.12l3.75 3.753a1 1 0 001.415-1.414l-3.751-3.752A8.5 8.5 0 0010.5 2zm-6.5 8.5a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
                    </svg>
                  </button>
                  <button onClick={() => router.push('/messages')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.836 1.359 5.373 3.497 7.07L4.5 22l4.193-1.668A10.7 10.7 0 0012 20.486c5.523 0 10-4.144 10-9.243S17.523 2 12 2z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white leading-none px-0.5">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                      </span>
                    )}
                  </button>
                  <button onClick={() => router.push('/notifications')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a7 7 0 00-7 7v3.17c0 .46-.18.9-.51 1.23L3 15h18l-1.49-1.6A1.74 1.74 0 0119 12.17V9a7 7 0 00-7-7zm0 20a3 3 0 003-3H9a3 3 0 003 3z" />
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
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all ${!activeSubject ? 'bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
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
                        className={`flex-shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                          isActive ? 'bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <SubjectIcon subject={key} size={11} />
                        <span>{m.short}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowSubjectPicker(true)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold text-zinc-600 hover:text-zinc-400 transition-all"
                  >
                    +{allSubjectKeys.filter(k => !userSubjects.includes(k)).length}
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        {/* ── Feed ──────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pb-4">

          {/* Stories — people you follow */}
          {!searchQuery && followingUsers.length > 0 && (
            <StoriesRow
              users={followingUsers}
              onUserTap={id => router.push(`/profile/${id}`)}
            />
          )}

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
            <div className="flex items-center gap-6 mt-3 mb-1 px-1 border-b border-[#2f3336]">
              {([
                { key: 'foryou', label: 'For You' },
                { key: 'following', label: 'Following' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFeedTab(tab.key)}
                  className={`relative text-[15px] font-bold tracking-tight transition-all pb-3 ${feedTab === tab.key ? '' : 'hover:text-zinc-400'}`}
                  style={{ color: feedTab === tab.key ? '#e7e9ea' : '#8b9099' }}
                >
                  {tab.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-violet-400 rounded-full transition-all duration-200 ${feedTab === tab.key ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
                </button>
              ))}
              <button
                onClick={() => router.push('/reels')}
                className="relative text-[15px] font-bold tracking-tight pb-3 hover:text-zinc-400 transition-colors"
                style={{ color: '#8b9099' }}
              >
                Clips
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="relative text-[15px] font-bold tracking-tight pb-3 hover:text-zinc-400 transition-colors"
                style={{ color: '#8b9099' }}
              >
                Explore
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
                  <div key={card.id}>
                    <CardTile card={card} onComment={openComments} flush={i === 0} />
                  </div>
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
              {/* Due for review — compact nudge banner */}
              {dueCards.length > 0 && !searchQuery && (
                <div className="mt-4 mb-4">
                  {/* Banner */}
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white leading-none mb-0.5">{dueCards.length} cards due for review</p>
                        <p className="text-[11px] text-zinc-500">Keep your streak going</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/deck')}
                      className="flex-shrink-0 bg-violet-500 hover:bg-violet-400 text-white text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors"
                    >
                      Study
                    </button>
                  </div>

                  {/* Dark compact chips */}
                  <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
                    {dueCards.slice(0, 10).map(card => {
                      const subjectKey = card.subject?.toLowerCase().split(' ')[0] ?? 'other';
                      return (
                        <button
                          key={card.id}
                          onClick={() => router.push('/deck')}
                          className="flex-shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full pl-2 pr-3 py-1.5 active:scale-95 transition-all"
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SUBJECT_COLOR[subjectKey] ?? '#a1a1aa' }} />
                          <p className="text-[11px] font-semibold text-zinc-300 max-w-[100px] truncate">{card.question}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Continuous feed — no artificial end */}
              <div className="mt-2">
                {displayCards.map((card, i) => (
                  <div key={card.id}>
                    <CardTile card={card} onComment={openComments} />
                    {/* Create cards prompt every 5 cards */}
                    {!searchQuery && i === 4 && (
                      <div className="-mx-4 mb-5">
                        <button onClick={() => router.push('/create-cards')} className="w-full text-left border-t border-b border-zinc-900 p-4" style={{ background: '#111113' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0d0d18] border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-none">Create a card</p>
                              <p className="text-xs text-zinc-500 mt-0.5">Share what you're studying with the community</p>
                            </div>
                            <span className="ml-auto text-xs font-bold text-violet-400 flex-shrink-0">Start →</span>
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
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-base font-bold text-white">
                {activeSubject || activeTopic ? 'Nothing here yet' : 'The feed is empty'}
              </p>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-[240px]">
                {activeSubject || activeTopic
                  ? 'No cards in this area yet — be the first to add some.'
                  : 'Be the first to post. Create a card and share what you know.'}
              </p>
              <button
                onClick={() => router.push('/create-cards')}
                className="mt-6 px-6 py-2.5 rounded-full bg-violet-500 active:scale-95 text-white text-sm font-bold transition-all"
              >
                Create a card
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
                      <SubjectIcon subject={key} size={22} />
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

      {/* ── Comments bottom sheet ── */}
      {commentsCardId && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end" onClick={closeComments}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative flex flex-col rounded-t-3xl border-t border-zinc-800 max-h-[80vh]"
            style={{ background: '#000000' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-zinc-800">
              <span className="text-[15px] font-bold" style={{ color: '#e7e9ea' }}>Replies</span>
              <button onClick={closeComments} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
              {sheetLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : sheetComments.length === 0 ? (
                <p className="text-center py-8 text-[14px]" style={{ color: '#8b9099' }}>No replies yet. Be the first.</p>
              ) : (
                <div className="space-y-5">
                  {sheetComments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {c.author_profile_picture
                          ? <img src={c.author_profile_picture.replace(/^https?:\/\/[^/]+/, '')} className="w-9 h-9 object-cover" />
                          : <span className="text-[12px] font-bold text-zinc-400">{(c.author_username || 'U')[0].toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[14px] font-bold" style={{ color: '#e7e9ea' }}>{c.author_username || 'user'}</span>
                          {c.created_at && <span className="text-[12px]" style={{ color: '#8b9099' }}>{timeAgo(c.created_at)}</span>}
                        </div>
                        <p className="text-[15px] leading-relaxed break-words" style={{ color: '#e7e9ea' }}>
                          {renderWithMentions(c.content)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              <input
                ref={sheetInputRef}
                value={sheetInput}
                onChange={e => setSheetInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitSheetComment()}
                placeholder="Add a reply…"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-[15px] focus:outline-none focus:border-zinc-600 transition-colors"
                style={{ color: '#e7e9ea' }}
              />
              <button
                onClick={submitSheetComment}
                disabled={!sheetInput.trim() || sheetPosting}
                className="w-9 h-9 rounded-full bg-violet-500 disabled:bg-zinc-800 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                {sheetPosting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
