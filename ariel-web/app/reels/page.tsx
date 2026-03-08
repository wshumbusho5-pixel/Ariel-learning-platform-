"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import api, { socialAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useComments } from '@/lib/commentsContext';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Reel {
  id: string;
  kind?: 'video' | 'card';
  video_url?: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_username: string;
  creator_profile_picture?: string;
  creator_verified?: boolean;
  creator_badge_type?: 'teacher' | 'student' | 'expert';
  category?: string;
  saved_to_deck?: boolean;
  following_creator?: boolean;
  view_count?: number;
  like_count?: number;
  created_at?: string;
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  gospel:      ['bible','gospel','faith','theology','scripture','church','religion'],
  business:    ['business','marketing','finance','management','accounting','sales','entrepreneurship'],
  economics:   ['economics','gdp','inflation','trade','monetary','fiscal','economy','micro','macro'],
  technology:  ['programming','software','coding','javascript','python','ai','data','tech','computer'],
  health:      ['health','medicine','anatomy','nutrition','fitness','psychology','pharma','biology'],
  mathematics: ['mathematics','calculus','algebra','geometry','statistics','math','maths'],
  sciences:    ['biology','chemistry','physics','science','lab','ecology','genetics'],
  history:     ['history','historical','civilization','war','ancient','medieval'],
  literature:  ['literature','english','writing','poetry','novel','essay'],
  languages:   ['language','french','spanish','swahili','grammar','vocabulary','kinyarwanda'],
  law:         ['law','legal','constitution','rights','court','criminal','contract'],
  arts:        ['art','music','design','creative','paint','film','photography'],
  psychology:  ['psychology','mental','behavior','cognitive','therapy','neuroscience'],
  engineering: ['engineering','mechanical','electrical','civil','structure','circuit','thermodynamics'],
  geography:   ['geography','map','climate','continent','country','geopolitics'],
};

const SUBJECT_LABELS: Record<string, string> = {
  gospel: 'Gospel & Theology',
  business: 'Business',
  economics: 'Economics',
  technology: 'Technology',
  health: 'Health & Medicine',
  mathematics: 'Mathematics',
  sciences: 'Sciences',
  history: 'History',
  literature: 'Literature',
  languages: 'Languages',
  law: 'Law',
  arts: 'Arts & Music',
  psychology: 'Psychology',
  engineering: 'Engineering',
  geography: 'Geography',
};

function reelMatchesSubject(reel: Reel, subjectKey: string): boolean {
  const keywords = SUBJECT_KEYWORDS[subjectKey] ?? [];
  const hay = `${reel.title} ${reel.description ?? ''} ${reel.category ?? ''}`.toLowerCase();
  return keywords.some(kw => hay.includes(kw));
}

function proxyUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return u.pathname + u.search;
    }
  } catch {}
  return url;
}

function groupReels(
  reels: Reel[],
  userSubjects: string[]
): Array<{ key: string; label: string; reels: Reel[]; isUserTopic: boolean }> {
  const sections: Array<{ key: string; label: string; reels: Reel[]; isUserTopic: boolean }> = [];
  const used = new Set<string>();

  // User's own subjects first (highlighted)
  for (const subjectKey of userSubjects) {
    if (!SUBJECT_LABELS[subjectKey]) continue;
    const matched = reels.filter(r => !used.has(r.id) && reelMatchesSubject(r, subjectKey));
    if (matched.length >= 1) {
      matched.forEach(r => used.add(r.id));
      sections.push({ key: subjectKey, label: SUBJECT_LABELS[subjectKey], reels: matched, isUserTopic: true });
    }
  }

  // Other subjects
  for (const [key, label] of Object.entries(SUBJECT_LABELS)) {
    if (userSubjects.includes(key)) continue;
    const matched = reels.filter(r => !used.has(r.id) && reelMatchesSubject(r, key));
    if (matched.length >= 1) {
      matched.forEach(r => used.add(r.id));
      sections.push({ key, label, reels: matched, isUserTopic: false });
    }
  }

  // Uncategorized remainder
  const rest = reels.filter(r => !used.has(r.id));
  if (rest.length > 0) {
    sections.push({ key: 'other', label: 'General', reels: rest, isUserTopic: false });
  }

  return sections;
}

function formatViews(n?: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ─── Hero card (full-width 16:9, YouTube-style layout) ────────────────────────
function HeroCard({ reel, onTap }: { reel: Reel; onTap: () => void }) {
  const hasStats = reel.view_count || reel.like_count || reel.created_at;
  return (
    <button
      onClick={onTap}
      className="w-full group text-left active:scale-[0.99] transition-transform duration-150"
    >
      {/* Thumbnail — full bleed, 16:9, clean (no text overlay) */}
      <div className="relative w-full overflow-hidden bg-zinc-900" style={{ aspectRatio: '16/9' }}>
        {reel.thumbnail_url ? (
          <img
            src={proxyUrl(reel.thumbnail_url)}
            alt={reel.title}
            className="absolute inset-0 w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        )}

        {/* Hover: darken + play */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        </div>

        {/* Category pill — top right only */}
        {reel.category && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded">
              {reel.category}
            </span>
          </div>
        )}
      </div>

      {/* YouTube-style info row below thumbnail */}
      <div className="flex gap-3 px-4 mt-3 pb-1">
        {/* Creator avatar */}
        <div className="w-9 h-9 rounded-full bg-violet-400/20 border border-violet-400/30 flex items-center justify-center text-violet-300 font-black text-sm flex-shrink-0 mt-0.5">
          {reel.creator_username[0]?.toUpperCase()}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[15px] font-black leading-snug line-clamp-2">{reel.title}</p>
          {reel.description && (
            <p className="text-zinc-400 text-xs mt-1 line-clamp-1 leading-relaxed">{reel.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-zinc-400 text-xs font-semibold">@{reel.creator_username}</span>
            {(reel.view_count || reel.like_count || reel.created_at) && (
              <span className="text-violet-700 text-[10px]">·</span>
            )}
            {reel.view_count ? (
              <span className="text-zinc-500 text-xs">{formatViews(reel.view_count)} views</span>
            ) : null}
            {reel.view_count && reel.like_count ? (
              <span className="text-violet-700 text-[10px]">·</span>
            ) : null}
            {reel.like_count ? (
              <span className="text-zinc-500 text-xs">{formatViews(reel.like_count)} likes</span>
            ) : null}
            {(reel.view_count || reel.like_count) && reel.created_at ? (
              <span className="text-violet-700 text-[10px]">·</span>
            ) : null}
            {reel.created_at ? (
              <span className="text-zinc-500 text-xs">{formatDate(reel.created_at)}</span>
            ) : null}
            {!hasStats && (
              <span className="text-zinc-600 text-xs">Just uploaded</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Thumbnail card ────────────────────────────────────────────────────────────
function ReelCard({
  reel,
  onTap,
  isNew,
}: {
  reel: Reel;
  onTap: () => void;
  isNew?: boolean;
}) {
  const hasStats = reel.view_count || reel.like_count || reel.created_at;

  return (
    <button
      onClick={onTap}
      className="w-full group text-left active:scale-[0.97] transition-transform duration-150"
    >
      {/* Ariel card shape — chamfered bottom-right corner */}
      <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
        {/* Main card surface — clipped shape */}
        <div
          className="absolute inset-0 overflow-hidden bg-zinc-900 group-hover:bg-zinc-800 transition-colors duration-200"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)' }}
        >
          {reel.thumbnail_url ? (
            <img
              src={proxyUrl(reel.thumbnail_url)}
              alt={reel.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
            </div>
          </div>

          {/* Violet top accent bar — the Ariel signature */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />

          {/* New badge */}
          {isNew && (
            <div className="absolute top-3 left-2 z-10">
              <span className="text-[9px] font-black bg-violet-500 text-white px-1.5 py-0.5 tracking-widest uppercase">
                NEW
              </span>
            </div>
          )}
        </div>

        {/* Chamfer notch accent — violet triangle fills the cut corner */}
        <div
          className="absolute bottom-0 right-0 w-[22px] h-[22px] pointer-events-none"
          style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(139, 92, 246, 0.55) 50%)' }}
        />
      </div>

      {/* Text below */}
      <div className="mt-2.5 px-0.5">
        <p className="text-white text-[13px] font-bold line-clamp-2 leading-snug">{reel.title}</p>
        <p className="text-zinc-500 text-[11px] font-medium mt-1 truncate">@{reel.creator_username}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {reel.view_count ? (
            <span className="text-zinc-600 text-[10px] font-medium">{formatViews(reel.view_count)} views</span>
          ) : null}
          {reel.like_count ? (
            <span className="text-zinc-600 text-[10px] font-medium">{formatViews(reel.like_count)} likes</span>
          ) : null}
          {reel.created_at ? (
            <span className="text-zinc-600 text-[10px] font-medium">{formatDate(reel.created_at)}</span>
          ) : null}
          {!hasStats && (
            <span className="text-zinc-700 text-[10px] font-medium">Just uploaded</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────
function SectionRow({
  label,
  subjectKey,
  reels,
  isUserTopic,
  isNew: isFreshSection,
  heroLayout,
  onTap,
}: {
  label: string;
  subjectKey: string;
  reels: Reel[];
  isUserTopic: boolean;
  isNew?: boolean;
  heroLayout?: boolean;
  onTap: (reel: Reel) => void;
}) {
  const router = useRouter();

  return (
    <section className="mb-10">
      {/* Section header — no panel, just typography + violet accent */}
      <div className="px-4 mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Thin violet accent bar */}
          <div className={`w-[3px] rounded-full flex-shrink-0 mt-1 self-stretch ${isFreshSection || isUserTopic ? 'bg-violet-400' : 'bg-zinc-700'}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white leading-tight">{label}</h2>
              {(isUserTopic || isFreshSection) && (
                <span className="text-[10px] font-bold text-violet-400 border border-violet-400/30 px-1.5 py-0.5 rounded-sm">
                  {isFreshSection ? 'New' : 'Your topic'}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              <span className="text-violet-400 font-bold">{reels.length}</span>
              {isFreshSection
                ? ` clip${reels.length !== 1 ? 's' : ''} this week`
                : ` clip${reels.length !== 1 ? 's' : ''} in ${label}`}
            </p>
          </div>
        </div>
        {!isFreshSection && (
          <button
            onClick={() => router.push(`/reels/subject/${subjectKey}`)}
            className="text-xs text-zinc-500 hover:text-violet-300 font-semibold transition-colors flex items-center gap-1 flex-shrink-0 mt-1"
          >
            See all
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {heroLayout && reels.length > 0 ? (
        <>
          {/* Hero — full-width 16:9 */}
          <HeroCard reel={reels[0]} onTap={() => onTap(reels[0])} />

          {/* Remaining — Netflix horizontal shelf */}
          {reels.length > 1 && (
            <div className="mt-4">
              <p className="text-xs text-zinc-600 font-semibold px-4 mb-3 uppercase tracking-wider">More in this section</p>
              <div
                className="flex gap-3 overflow-x-auto px-4 pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
              >
                {reels.slice(1).map(reel => (
                  <div key={reel.id} className="flex-shrink-0 w-36">
                    <ReelCard reel={reel} onTap={() => onTap(reel)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Netflix horizontal shelf */
        <div
          className="flex gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {reels.map(reel => (
            <div key={reel.id} className="flex-shrink-0 w-36">
              <ReelCard reel={reel} onTap={() => onTap(reel)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Full-screen player modal ──────────────────────────────────────────────────
function PlayerModal({
  reel,
  allReels,
  onClose,
  onNav,
  onSave,
  onFollow,
  onShare,
  onComment,
  muted,
  onToggleMute,
}: {
  reel: Reel;
  allReels: Reel[];
  onClose: () => void;
  onNav: (reel: Reel) => void;
  onSave: (id: string) => void;
  onFollow: (creatorId: string) => void;
  onShare: (id: string) => void;
  onComment: (id: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const currentIdx = allReels.findIndex(r => r.id === reel.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allReels.length - 1;

  useEffect(() => {
    setVideoReady(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [reel.id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNav(allReels[currentIdx - 1]);
      if (e.key === 'ArrowRight' && hasNext) onNav(allReels[currentIdx + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, currentIdx, allReels, onClose, onNav]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col lg:flex-row">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mute */}
      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        {muted ? (
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L5.586 9H4a1 1 0 00-1 1v4a1 1 0 001 1h1.586L12 18V6z" />
          </svg>
        )}
      </button>

      {/* Video area */}
      <div className="relative flex-1 flex items-center justify-center bg-black">
        {!videoReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          src={proxyUrl(reel.video_url)}
          className="w-full h-full object-contain"
          loop
          playsInline
          muted={muted}
          poster={proxyUrl(reel.thumbnail_url)}
          onLoadedData={() => setVideoReady(true)}
        />
        {/* Bottom gradient + info overlay (mobile) */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
        <div className="lg:hidden absolute bottom-[80px] left-4 right-20 z-20">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {reel.creator_username[0]?.toUpperCase()}
            </div>
            <p className="text-white text-sm font-semibold flex-1 truncate">@{reel.creator_username}</p>
            <button
              onClick={() => onFollow(reel.creator_id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                reel.following_creator
                  ? 'border-white/30 text-white/60'
                  : 'border-white text-white'
              }`}
            >
              {reel.following_creator ? 'Following' : 'Follow'}
            </button>
          </div>
          <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{reel.title}</p>
          {reel.description && (
            <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{reel.description}</p>
          )}
        </div>

        {/* Mobile right-side actions */}
        <div className="lg:hidden absolute bottom-[160px] right-4 z-20 flex flex-col gap-5">
          <button onClick={() => onSave(reel.id)}>
            <svg
              className={`w-7 h-7 drop-shadow-lg transition-colors ${reel.saved_to_deck ? 'text-violet-300' : 'text-white'}`}
              fill={reel.saved_to_deck ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button onClick={() => onComment(reel.id)}>
            <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button onClick={() => onShare(reel.id)}>
            <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>

        {/* Prev / next arrows */}
        {hasPrev && (
          <button
            onClick={() => onNav(allReels[currentIdx - 1])}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => onNav(allReels[currentIdx + 1])}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 lg:hidden">
          <span className="text-white/40 text-xs">{currentIdx + 1} / {allReels.length}</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-[320px] flex-shrink-0 bg-zinc-950 border-l border-zinc-800 overflow-y-auto">

        {/* Creator block */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {reel.creator_username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">@{reel.creator_username}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {reel.creator_verified ? 'Verified Educator' : 'Creator'}
              </p>
            </div>
            <button
              onClick={() => onFollow(reel.creator_id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                reel.following_creator
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  : 'bg-white text-zinc-950 hover:bg-zinc-200'
              }`}
            >
              {reel.following_creator ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Title + description + stats */}
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-white font-black text-lg leading-snug">{reel.title}</h3>
          {reel.description && (
            <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{reel.description}</p>
          )}
          {reel.category && (
            <span className="inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {reel.category}
            </span>
          )}
          {/* Stats row */}
          {(reel.view_count || reel.like_count || reel.created_at) && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
              {reel.view_count ? (
                <div>
                  <p className="text-base font-black text-white leading-none">{formatViews(reel.view_count)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">Views</p>
                </div>
              ) : null}
              {reel.like_count ? (
                <div>
                  <p className="text-base font-black text-white leading-none">{formatViews(reel.like_count)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">Likes</p>
                </div>
              ) : null}
              {reel.created_at ? (
                <div>
                  <p className="text-base font-black text-white leading-none">{formatDate(reel.created_at)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">Uploaded</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-5 border-b border-zinc-800">
          <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider mb-3">
            {currentIdx + 1} of {allReels.length} clips
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => hasPrev && onNav(allReels[currentIdx - 1])}
              disabled={!hasPrev}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
            >
              ← Previous
            </button>
            <button
              onClick={() => hasNext && onNav(allReels[currentIdx + 1])}
              disabled={!hasNext}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 space-y-3">
          <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider mb-1">Actions</p>

          {/* Save to deck — primary */}
          <button
            onClick={() => onSave(reel.id)}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              reel.saved_to_deck
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-violet-400 hover:bg-violet-500 text-white'
            }`}
          >
            {reel.saved_to_deck ? '✓ Saved to deck' : 'Save to deck'}
          </button>
          <p className="text-[11px] text-zinc-600 text-center -mt-1">
            {reel.saved_to_deck ? 'This clip is in your study materials' : 'Add this clip to your study materials'}
          </p>

          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
            <button
              onClick={() => onComment(reel.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Join the discussion</p>
                <p className="text-[11px] text-zinc-500">Leave a comment or question</p>
              </div>
            </button>
            <button
              onClick={() => onShare(reel.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Share this clip</p>
                <p className="text-[11px] text-zinc-500">Copy link or send to someone</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openComments } = useComments();

  const [reels, setReels] = useState<Reel[]>([]);
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [muted, setMuted] = useState(true);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // Reset and reload when tab changes
  useEffect(() => {
    setReels([]);
    setOffset(0);
    setHasMore(true);
    loadReels(0, true);
  }, [tab]);

  const loadReels = async (currentOffset: number, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const endpoint = tab === 'foryou' ? '/api/reels/feed' : '/api/reels/following';
      const response = await api.get(`${endpoint}?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const data: Reel[] = response.data;
      const videoOnly = data
        .filter(item => item.video_url && item.kind !== 'card')
        .map(item => ({ ...item, saved_to_deck: item.saved_to_deck ?? false }));

      if (videoOnly.length < PAGE_SIZE) setHasMore(false);

      const userSubjects: string[] = user?.subjects ?? [];
      if (reset) {
        const prioritized = videoOnly.filter(r => userSubjects.some(s => reelMatchesSubject(r, s)));
        const rest = videoOnly.filter(r => !userSubjects.some(s => reelMatchesSubject(r, s)));
        setReels([...prioritized, ...rest]);
      } else {
        // Append, deduplicating by id
        setReels(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const fresh = videoOnly.filter(r => !existingIds.has(r.id));
          return [...prev, ...fresh];
        });
      }
      setOffset(currentOffset + videoOnly.length);
    } catch {
      if (reset) setReels([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite scroll — fire when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadReels(offset);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [offset, hasMore, loadingMore, loading, tab]);

  const handleSaveToDeck = useCallback(async (reelId: string) => {
    const reel = reels.find(r => r.id === reelId);
    const update = (list: Reel[]) =>
      list.map(r => r.id === reelId ? { ...r, saved_to_deck: !r.saved_to_deck } : r);
    setReels(prev => update(prev));
    if (activeReel?.id === reelId) setActiveReel(prev => prev ? { ...prev, saved_to_deck: !prev.saved_to_deck } : prev);
    try {
      const res = await api.post(`/api/reels/${reelId}/save`);
      showToast(res.data.saved ? 'Saved to deck' : 'Removed from deck');
    } catch {
      const revert = (list: Reel[]) =>
        list.map(r => r.id === reelId ? { ...r, saved_to_deck: reel?.saved_to_deck } : r);
      setReels(prev => revert(prev));
      if (activeReel?.id === reelId) setActiveReel(prev => prev ? { ...prev, saved_to_deck: reel?.saved_to_deck } : prev);
      showToast('Failed to save');
    }
  }, [reels, activeReel]);

  const handleFollow = useCallback(async (creatorId: string) => {
    if (!creatorId) return;
    const reel = reels.find(r => r.creator_id === creatorId);
    const isFollowing = reel?.following_creator;
    const update = (list: Reel[]) =>
      list.map(r => r.creator_id === creatorId ? { ...r, following_creator: !isFollowing } : r);
    setReels(prev => update(prev));
    if (activeReel?.creator_id === creatorId) setActiveReel(prev => prev ? { ...prev, following_creator: !isFollowing } : prev);
    try {
      if (isFollowing) { await socialAPI.unfollowUser(creatorId); showToast('Unfollowed'); }
      else { await socialAPI.followUser(creatorId); showToast(`Following @${reel?.creator_username}`); }
    } catch {
      const revert = (list: Reel[]) =>
        list.map(r => r.creator_id === creatorId ? { ...r, following_creator: isFollowing } : r);
      setReels(prev => revert(prev));
      if (activeReel?.creator_id === creatorId) setActiveReel(prev => prev ? { ...prev, following_creator: isFollowing } : prev);
      showToast('Something went wrong');
    }
  }, [reels, activeReel]);

  const handleShare = useCallback(async (reelId: string) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Check out this clip on Ariel', url });
      else { await navigator.clipboard.writeText(url); showToast('Link copied'); }
    } catch {
      try { await navigator.clipboard.writeText(url); showToast('Link copied'); }
      catch { showToast('Could not share'); }
    }
  }, []);

  const sections = groupReels(reels, user?.subjects ?? []);

  // "New this week" — reels uploaded in the last 7 days, shown pinned at top
  const newThisWeek = reels.filter(r => {
    if (!r.created_at) return false;
    const diffDays = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });

  // ── Skeletons ──
  if (loading) {
    return (
      <>
        <SideNav />
        <main className="lg:pl-[72px] min-h-screen bg-[#0f0f0f]">
          <header className="sticky top-0 z-30 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="h-8 w-40 bg-zinc-800 rounded-full animate-pulse" />
            <div className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
          </header>
          <div className="py-6">
            {/* Hero skeleton */}
            <div className="mb-10">
              <div className="px-4 mb-4 flex items-center gap-2.5">
                <div className="w-[3px] h-10 bg-violet-400/30 rounded-full flex-shrink-0 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-zinc-800 rounded-full animate-pulse" />
                  <div className="h-3 w-20 bg-zinc-800/60 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="w-full bg-zinc-800 animate-pulse" style={{ aspectRatio: '16/9' }} />
              <div className="px-4 mt-3 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-zinc-800/60 rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="flex gap-3 px-4 mt-4 overflow-hidden">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="flex-shrink-0 w-36">
                    <div className="rounded-md bg-zinc-800 animate-pulse w-full" style={{ aspectRatio: '9/16' }} />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-full" />
                      <div className="h-2 bg-zinc-800/60 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Shelf skeletons */}
            {[0, 1].map(i => (
              <div key={i} className="mb-10">
                <div className="px-4 mb-4 flex items-center gap-2.5">
                  <div className="w-[3px] h-8 bg-zinc-700/50 rounded-full flex-shrink-0 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-zinc-800 rounded-full animate-pulse" />
                    <div className="h-3 w-16 bg-zinc-800/60 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-3 px-4 overflow-hidden">
                  {[0, 1, 2, 3].map(j => (
                    <div key={j} className="flex-shrink-0 w-36">
                      <div className="rounded-md bg-zinc-800 animate-pulse w-full" style={{ aspectRatio: '9/16' }} />
                      <div className="mt-2 space-y-1.5">
                        <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-full" />
                        <div className="h-2 bg-zinc-800/60 rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
        <div className="lg:hidden"><BottomNav /></div>
      </>
    );
  }

  return (
    <>
      <SideNav />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 bg-zinc-800/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* Player modal */}
      {activeReel && (
        <PlayerModal
          reel={activeReel}
          allReels={reels}
          onClose={() => setActiveReel(null)}
          onNav={setActiveReel}
          onSave={handleSaveToDeck}
          onFollow={handleFollow}
          onShare={handleShare}
          onComment={(id) => { setActiveReel(null); openComments(id); }}
          muted={muted}
          onToggleMute={() => setMuted(m => !m)}
        />
      )}

      <main className="lg:pl-[72px] min-h-screen bg-[#0f0f0f] page-enter">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-0.5">
            {(['foryou', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  tab === t ? 'bg-violet-400/20 text-violet-200 border border-violet-400/30' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'foryou' ? 'For You' : 'Following'}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/reels/upload')}
            className="text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full hover:text-white hover:border-zinc-600 transition-colors"
          >
            + Upload
          </button>
        </header>

        {/* Content */}
        <div className="py-3 pb-28 lg:pb-8">
          {reels.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4 px-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">No clips yet</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {tab === 'following'
                      ? 'Follow educators to see their clips here.'
                      : 'Be the first to share a learning clip.'}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/reels/upload')}
                  className="px-5 py-2.5 bg-violet-400 text-white text-sm font-semibold rounded-xl hover:bg-violet-500 transition-colors"
                >
                  Upload a clip
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Page intro */}
              <div className="px-4 pt-3 pb-5 border-b border-zinc-800/60">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50" />
                  <div className="w-1 h-1 rounded-full bg-violet-400/25" />
                </div>
                <h1 className="text-2xl font-black text-white leading-tight">Short Clips</h1>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Quick learning videos from educators across all subjects.
                  {reels.length > 0 && (
                    <span className="text-violet-300 font-bold"> {reels.length} clips</span>
                  )} loaded — scroll down for more.
                </p>
              </div>

              {/* Pinned: New this week — always hero */}
              {newThisWeek.length > 0 && (
                <SectionRow
                  key="new-this-week"
                  label="New This Week"
                  subjectKey="new"
                  reels={newThisWeek}
                  isUserTopic={false}
                  isNew
                  heroLayout
                  onTap={setActiveReel}
                />
              )}
              {/* Subject sections — user topics get hero, others get grid */}
              {sections.map(section => (
                <SectionRow
                  key={section.key}
                  label={section.label}
                  subjectKey={section.key}
                  reels={section.reels}
                  isUserTopic={section.isUserTopic}
                  heroLayout={section.isUserTopic}
                  onTap={setActiveReel}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                </div>
              )}
              {!hasMore && reels.length > 0 && (
                <p className="text-center text-zinc-700 text-xs py-6">You've seen everything</p>
              )}
            </>
          )}
        </div>
      </main>

      <div className="lg:hidden"><BottomNav /></div>

      <style jsx global>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
