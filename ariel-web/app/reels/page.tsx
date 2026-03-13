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
import ArielLoader from '@/components/ArielLoader';

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
  return (
    <button
      onClick={onTap}
      className="w-full group text-left active:scale-[0.99] transition-transform duration-150 px-4"
    >
      <div className="relative w-full rounded-3xl overflow-hidden bg-zinc-900" style={{ aspectRatio: '16/9' }}>
        {reel.thumbnail_url ? (
          <img
            src={proxyUrl(reel.thumbnail_url)}
            alt={reel.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
            <span className="text-white/10 font-black text-8xl">{reel.title[0]?.toUpperCase()}</span>
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {/* Category pill */}
        {reel.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10px] font-bold bg-violet-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
              {reel.category}
            </span>
          </div>
        )}

        {/* Subtle play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 flex items-center justify-center group-hover:bg-black/50 group-hover:scale-105 transition-all duration-200">
            <svg className="w-5 h-5 text-white/80 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Text overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-violet-400/20 border border-violet-400/30 flex items-center justify-center text-violet-300 font-black text-xs flex-shrink-0">
              {reel.creator_username[0]?.toUpperCase()}
            </div>
            <span className="text-white/70 text-xs font-semibold">@{reel.creator_username}</span>
            {reel.view_count ? (
              <span className="text-white/40 text-[10px] ml-auto">{formatViews(reel.view_count)} views</span>
            ) : null}
          </div>
          <p className="text-white text-[17px] font-black leading-snug line-clamp-2">{reel.title}</p>
          {reel.description && (
            <p className="text-white/50 text-xs mt-1 line-clamp-1">{reel.description}</p>
          )}
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
  return (
    <button
      onClick={onTap}
      className="w-full group text-left active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-900" style={{ aspectRatio: '9/16' }}>
        {reel.thumbnail_url ? (
          <img
            src={proxyUrl(reel.thumbnail_url)}
            alt={reel.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${
            reel.category?.toLowerCase().includes('tech') ? 'bg-gradient-to-br from-blue-950 to-zinc-950' :
            reel.category?.toLowerCase().includes('health') || reel.category?.toLowerCase().includes('bio') ? 'bg-gradient-to-br from-emerald-950 to-zinc-950' :
            reel.category?.toLowerCase().includes('math') ? 'bg-gradient-to-br from-violet-950 to-zinc-950' :
            reel.category?.toLowerCase().includes('history') ? 'bg-gradient-to-br from-amber-950 to-zinc-950' :
            reel.category?.toLowerCase().includes('law') ? 'bg-gradient-to-br from-red-950 to-zinc-950' :
            'bg-gradient-to-br from-zinc-800 to-zinc-950'
          }`}>
            <span className="text-white/10 font-black text-5xl">{reel.title[0]?.toUpperCase()}</span>
          </div>
        )}

        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {/* New badge */}
        {isNew && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="text-[9px] font-black bg-violet-500 text-white px-1.5 py-0.5 tracking-widest uppercase rounded-sm">
              NEW
            </span>
          </div>
        )}

        {/* Centered play on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Text overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 p-2.5">
          <p className="text-white text-[11px] font-bold line-clamp-2 leading-snug">{reel.title}</p>
          <p className="text-white/50 text-[10px] mt-0.5 truncate">@{reel.creator_username}</p>
          {reel.view_count ? (
            <p className="text-white/35 text-[9px] mt-0.5">{formatViews(reel.view_count)} views</p>
          ) : null}
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
    <section className="mb-1">
      {/* YouTube-style section header: bold label left, See all right, generous air above */}
      <div className={`px-4 pt-7 pb-3 flex items-center justify-between ${isUserTopic ? 'bg-violet-500/[0.04]' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className={`rounded-full flex-shrink-0 ${isUserTopic ? 'w-1 h-6 bg-violet-400' : 'w-[3px] h-5 bg-zinc-600'}`} />
          <h2 className={`font-black leading-none ${isUserTopic ? 'text-[16px] text-white' : 'text-[15px] text-zinc-200'}`}>{label}</h2>
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
                  <div key={reel.id} className="flex-shrink-0 w-44">
                    <ReelCard reel={reel} onTap={() => onTap(reel)} />
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
            <div key={reel.id} className="flex-shrink-0 w-44">
              <ReelCard reel={reel} onTap={() => onTap(reel)} />
            </div>
          ))}
        </div>
      )}

      {/* Section divider */}
      <div className="mx-4 mt-4 border-t border-zinc-800" />
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
    } catch (err: any) {
      const revert = (list: Reel[]) =>
        list.map(r => r.creator_id === creatorId ? { ...r, following_creator: isFollowing } : r);
      setReels(prev => revert(prev));
      if (activeReel?.creator_id === creatorId) setActiveReel(prev => prev ? { ...prev, following_creator: isFollowing } : prev);
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong';
      console.error('[follow error]', msg, err);
      showToast(msg);
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
                  <div key={j} className="flex-shrink-0 w-44">
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
                    <div key={j} className="flex-shrink-0 w-44">
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
          onComment={(id) => { openComments(id); }}
          onDMShare={(reel) => { setShareReel(reels.find(r => r.id === reel.id) || null); }}
        />
      )}

      <main className="lg:pl-[72px] min-h-screen bg-[#09090b] page-enter">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#09090b] border-b border-zinc-800 px-4 pt-3 pb-0">
          {/* Row 1: title + wordmark + upload */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <h1 className="text-[22px] font-black text-white tracking-tight leading-none">Clips</h1>
              <span className="select-none" style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 16,
                fontWeight: 700,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '0.5px',
              }}>
                <span style={{ color: '#71717a' }}>ar</span>
                <span style={{ color: '#9B7FFF' }}>i</span>
                <span style={{ color: '#71717a' }}>el</span>
              </span>
            </div>
            <button
              onClick={() => router.push('/reels/upload')}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-500 active:scale-95 transition-all px-3.5 py-2 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Clip
            </button>
          </div>
          {/* Row 2: tabs */}
          <div className="flex items-center gap-6">
            {(['foryou', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative text-[14px] font-black tracking-tight transition-all pb-2.5 ${tab === t ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {t === 'foryou' ? 'For You' : 'Following'}
                <span className={`absolute bottom-0 left-0 right-0 h-[3px] bg-violet-400 rounded-full transition-all duration-200 ${tab === t ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="py-3 pb-28 lg:pb-8">
          {reels.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center px-6">
                <ArielLoader size={56} className="mb-5" />
                <p className="text-[15px] font-bold text-white">
                  {tab === 'following' ? 'No clips from people you follow' : 'No clips yet'}
                </p>
                <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed max-w-[220px] mx-auto">
                  {tab === 'following'
                    ? 'Follow educators to see their clips here.'
                    : 'Be the first to share a learning clip.'}
                </p>
                <button
                  onClick={() => router.push('/reels/upload')}
                  className="mt-5 px-5 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)] active:scale-95 transition-all"
                >
                  Upload a clip
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  <ArielLoader size={40} />
                </div>
              )}
              {!hasMore && reels.length > 0 && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <ArielLoader size={36} />
                  <p className="text-zinc-600 text-xs font-semibold">You've seen everything</p>
                </div>
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
