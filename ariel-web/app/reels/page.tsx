"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import api, { socialAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useComments } from '@/lib/commentsContext';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import TikTokPlayer from '@/components/TikTokPlayer';
import ShareSheet from '@/components/ShareSheet';

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
  onDMShare,
}: {
  reel: Reel;
  onTap: () => void;
  isNew?: boolean;
  onDMShare?: (reel: Reel) => void;
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

        {/* DM share button — top-right */}
        {onDMShare && (
          <button
            onClick={e => { e.stopPropagation(); onDMShare(reel); }}
            className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            title="Send in DM"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        )}
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
  onDMShare,
}: {
  label: string;
  subjectKey: string;
  reels: Reel[];
  isUserTopic: boolean;
  isNew?: boolean;
  heroLayout?: boolean;
  onTap: (reel: Reel) => void;
  onDMShare?: (reel: Reel) => void;
}) {
  const router = useRouter();

  return (
    <section className="mb-1">
      {/* YouTube-style section header: bold label left, See all right, generous air above */}
      <div className="px-4 pt-7 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-black text-white leading-none">{label}</h2>
          {isUserTopic && (
            <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full">
              For you
            </span>
          )}
          {isFreshSection && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <button
          onClick={() => router.push(`/reels/subject/${subjectKey}`)}
          className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors flex items-center gap-0.5"
        >
          See all
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {heroLayout && reels.length > 0 ? (
        <>
          {/* Hero — full-width 16:9 */}
          <HeroCard reel={reels[0]} onTap={() => onTap(reels[0])} />

          {/* Shelf — more in this section */}
          {reels.length > 1 && (
            <div className="mt-1">
              <div
                className="flex gap-3 overflow-x-auto px-4 pt-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
              >
                {reels.slice(1).map(reel => (
                  <div key={reel.id} className="flex-shrink-0 w-36">
                    <ReelCard reel={reel} onTap={() => onTap(reel)} onDMShare={onDMShare} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto px-4 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {reels.map(reel => (
            <div key={reel.id} className="flex-shrink-0 w-36">
              <ReelCard reel={reel} onTap={() => onTap(reel)} onDMShare={onDMShare} />
            </div>
          ))}
        </div>
      )}

      {/* Section divider */}
      <div className="mx-4 mt-4 border-t border-zinc-800/50" />
    </section>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
// (TikTokPlayer imported from @/components/TikTokPlayer)
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
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [shareReel, setShareReel] = useState<Reel | null>(null);
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
        <main className="lg:pl-[72px] min-h-screen bg-[#09090b]">
          <header className="sticky top-0 z-30 bg-[#09090b] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
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

      {/* TikTok player */}
      {activeReel && (
        <TikTokPlayer
          reels={reels}
          startIndex={Math.max(0, reels.findIndex(r => r.id === activeReel.id))}
          onClose={() => setActiveReel(null)}
          onSave={handleSaveToDeck}
          onFollow={handleFollow}
          onShare={handleShare}
          onComment={(id) => { setActiveReel(null); openComments(id); }}
          onDMShare={(reel) => { setActiveReel(null); setShareReel(reels.find(r => r.id === reel.id) || null); }}
        />
      )}

      <main className="lg:pl-[72px] min-h-screen bg-[#09090b] page-enter">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#09090b] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
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
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-500 hover:bg-violet-400 active:scale-95 transition-all px-3.5 py-2 rounded-full shadow-md shadow-violet-500/25"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Clip
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
                  onDMShare={setShareReel}
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
                  onDMShare={setShareReel}
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

      {/* DM Share Sheet */}
      {shareReel && (
        <ShareSheet
          target={{
            type: 'reel',
            id: shareReel.id,
            title: shareReel.title,
            subtitle: `@${shareReel.creator_username}`,
            thumbnail: shareReel.thumbnail_url,
          }}
          onClose={() => setShareReel(null)}
        />
      )}

      <style jsx global>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
