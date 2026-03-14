'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CardFeed from '@/components/CardFeed';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/useAuth';
import { cardsAPI, reelsAPI } from '@/lib/api';
import api, { socialAPI } from '@/lib/api';
import SideNav from '@/components/SideNav';
import TikTokPlayer, { type TikTokReel } from '@/components/TikTokPlayer';
import { useComments } from '@/lib/commentsContext';

interface DeckStats {
  total_cards: number;
  new_cards: number;
  due_today: number;
  mastered: number;
  by_subject: Record<string, number>;
  by_topic: Record<string, number>;
}

function proxyThumb(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\/[^/]+(?=\/)/, '');
}

export default function DeckPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const { openComments } = useComments();
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'clips'>('cards');

  // Clips state
  const [clips, setClips] = useState<TikTokReel[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [clipsLoaded, setClipsLoaded] = useState(false);
  const [activeClip, setActiveClip] = useState<TikTokReel | null>(null);
  const [toast, setToast] = useState<string | null>(null);


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  // Load clips when tab first becomes active
  useEffect(() => {
    if (activeTab === 'clips' && !clipsLoaded) {
      loadClips();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await cardsAPI.getDeckStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  };


  const loadClips = async () => {
    setClipsLoading(true);
    try {
      const data = await reelsAPI.getSaved();
      // Map backend field names to TikTokReel shape
      const mapped: TikTokReel[] = (data || []).map((r: any) => ({
        id: r.id,
        video_url: r.video_url,
        thumbnail_url: r.thumbnail_url,
        title: r.title,
        description: r.description,
        category: r.category,
        creator_id: r.creator_id,
        creator_username: r.creator_username,
        creator_profile_picture: r.creator_profile_picture,
        following_creator: r.following_creator ?? false,
        saved_to_deck: true,
        view_count: r.views,
        like_count: r.likes,
      }));
      setClips(mapped);
      setClipsLoaded(true);
    } catch {
      setClips([]);
    } finally {
      setClipsLoading(false);
    }
  };

  const handleUnsave = useCallback(async (reelId: string) => {
    setClips(prev => prev.map(c => c.id === reelId ? { ...c, saved_to_deck: !c.saved_to_deck } : c));
    try {
      const res = await api.post(`/api/reels/${reelId}/save`);
      if (!res.data.saved) {
        // Was unsaved — remove from list after a brief moment
        setTimeout(() => setClips(prev => prev.filter(c => c.id !== reelId)), 600);
        showToast('Removed from deck');
      } else {
        showToast('Saved');
      }
    } catch {
      setClips(prev => prev.map(c => c.id === reelId ? { ...c, saved_to_deck: true } : c));
      showToast('Failed');
    }
  }, []);

  const handleFollow = useCallback(async (creatorId: string) => {
    const clip = clips.find(c => c.creator_id === creatorId);
    const isFollowing = clip?.following_creator;
    setClips(prev => prev.map(c => c.creator_id === creatorId ? { ...c, following_creator: !isFollowing } : c));
    try {
      if (isFollowing) { await socialAPI.unfollowUser(creatorId); showToast('Unfollowed'); }
      else { await socialAPI.followUser(creatorId); showToast(`Following @${clip?.creator_username}`); }
    } catch {
      setClips(prev => prev.map(c => c.creator_id === creatorId ? { ...c, following_creator: isFollowing } : c));
      showToast('Something went wrong');
    }
  }, [clips]);

  const handleShare = useCallback(async (reelId: string) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Check out this clip on Ariel', url });
      else { await navigator.clipboard.writeText(url); showToast('Link copied'); }
    } catch {
      try { await navigator.clipboard.writeText(url); showToast('Link copied'); } catch {}
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen lg:pl-[72px] bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Create an account to save and review your flashcards</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-violet-400 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const subjects = stats ? Object.keys(stats.by_subject || {}) : [];
  const startIndex = activeClip ? Math.max(0, clips.findIndex(c => c.id === activeClip.id)) : 0;

  return (
    <>
      <SideNav />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 bg-zinc-800/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* TikTok player for saved clips */}
      {activeClip && (
        <TikTokPlayer
          reels={clips}
          startIndex={startIndex}
          onClose={() => setActiveClip(null)}
          onSave={handleUnsave}
          onFollow={handleFollow}
          onComment={(id) => { openComments(id); }}
        />
      )}

      {/* Cards feed — only rendered on cards tab */}
      {activeTab === 'cards' && (
        <CardFeed type="my-deck" subjectFilter={subjectFilter} snapScroll headerOffset={subjects.length > 0 ? 148 : 108} />
      )}

      {/* Clips grid — rendered on clips tab */}
      {activeTab === 'clips' && (
        <div className="lg:pl-[72px] min-h-screen bg-black">
          <div className="pt-[152px] pb-28 px-4">
            {clipsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="w-full bg-zinc-800 animate-pulse rounded-xl" style={{ aspectRatio: '9/16' }} />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-3 bg-zinc-800 animate-pulse rounded w-3/4" />
                      <div className="h-2.5 bg-zinc-800/60 animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : clips.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">No saved clips yet</h3>
                  <p className="text-sm text-zinc-500 mt-1">When you save a clip on the reels page, it appears here.</p>
                </div>
                <button
                  onClick={() => router.push('/reels')}
                  className="px-5 py-2.5 bg-violet-500 text-white text-sm font-semibold rounded-xl hover:bg-violet-400 transition-colors"
                >
                  Browse clips
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {clips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => setActiveClip(clip)}
                    className="text-left group active:scale-[0.97] transition-transform duration-150"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full overflow-hidden rounded-xl bg-zinc-900" style={{ aspectRatio: '9/16' }}>
                      {clip.thumbnail_url ? (
                        <img
                          src={proxyThumb(clip.thumbnail_url)}
                          alt={clip.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                          </svg>
                        </div>
                      </div>
                      {/* Saved badge */}
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/70 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="mt-2 px-0.5">
                      <p className="text-white text-[13px] font-bold line-clamp-2 leading-snug">{clip.title}</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5 truncate">@{clip.creator_username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay header — floats above everything */}
      <div className="fixed top-0 left-0 right-0 lg:left-[72px] z-40 pointer-events-none">
        <div className={`px-4 pt-3 pb-3 ${activeTab === 'cards' ? 'bg-gradient-to-b from-black/70 via-black/30 to-transparent' : 'bg-black/90 backdrop-blur-xl border-b border-[#2f3336]'}`}>

          {/* Title row */}
          <div className="flex items-center justify-between mb-3 pointer-events-auto">
            <h1 className="text-lg font-bold text-white drop-shadow">My Deck</h1>
            {stats && stats.due_today > 0 && activeTab === 'cards' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/25 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 text-xs font-bold">{stats.due_today} due</span>
              </div>
            )}
          </div>

          {/* Tabs: Cards | Clips */}
          <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded-full p-0.5 w-fit pointer-events-auto mb-2">
            {(['cards', 'clips'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize ${
                  activeTab === t
                    ? 'bg-violet-400/20 text-violet-200 border border-violet-400/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'clips' && clips.length > 0 ? `Clips · ${clips.length}` : t === 'cards' ? 'Cards' : 'Clips'}
              </button>
            ))}
          </div>

          {/* Subject filter pills — cards tab only */}
          {activeTab === 'cards' && subjects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSubjectFilter('all')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  subjectFilter === 'all'
                    ? 'bg-violet-400 text-white border-violet-300'
                    : 'bg-black/40 backdrop-blur-sm text-white border-white/20 hover:border-white/40'
                }`}
              >
                All
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    subjectFilter === subject
                      ? 'bg-violet-400 text-white border-violet-300'
                      : 'bg-black/40 backdrop-blur-sm text-white border-white/20 hover:border-white/40'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
