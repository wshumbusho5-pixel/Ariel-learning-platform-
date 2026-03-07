"use client";

import React, { useEffect, useRef, useState } from "react";
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

function reelMatchesSubject(reel: Reel, subjectKey: string): boolean {
  const keywords = SUBJECT_KEYWORDS[subjectKey] ?? [];
  const hay = `${reel.title} ${reel.description ?? ''} ${reel.category ?? ''}`.toLowerCase();
  return keywords.some(kw => hay.includes(kw));
}

// Strip backend origin so uploads proxy through Next.js (avoids CORS)
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

export default function ReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openComments } = useComments();

  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState<Record<string, boolean>>({});
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadReels(); }, [tab]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === currentIndex) video.play().catch(() => {});
      else video.pause();
    });
  }, [currentIndex]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'foryou' ? '/api/reels/feed' : '/api/reels/following';
      const response = await api.get(endpoint);
      const data: Reel[] = response.data;
      const videoOnly = data
        .filter(item => item.video_url && item.kind !== 'card')
        .map(item => ({ ...item, saved_to_deck: item.saved_to_deck ?? false }));
      const userSubjects: string[] = user?.subjects ?? [];
      const prioritized = videoOnly.filter(r => userSubjects.some(s => reelMatchesSubject(r, s)));
      const rest = videoOnly.filter(r => !userSubjects.some(s => reelMatchesSubject(r, s)));
      setReels([...prioritized, ...rest]);
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / viewportHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleSaveToDeck = async (reelId: string) => {
    try {
      await api.post(`/api/reels/${reelId}/save`);
      setReels(prev => prev.map(r => r.id === reelId ? { ...r, saved_to_deck: !r.saved_to_deck } : r));
    } catch {}
  };

  const handleFollow = async (creatorId: string) => {
    const reel = reels.find(r => r.creator_id === creatorId);
    try {
      if (reel?.following_creator) await socialAPI.unfollowUser(creatorId);
      else await socialAPI.followUser(creatorId);
      setReels(prev => prev.map(r => r.creator_id === creatorId ? { ...r, following_creator: !r.following_creator } : r));
    } catch {}
  };

  const handleShare = async (reelId: string) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Check out this reel on Ariel', url });
      else { await navigator.clipboard.writeText(url); }
    } catch {}
  };

  if (loading) {
    return (
      <>
        <SideNav />
        <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center lg:pl-[72px]">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" />
        </div>
        <div className="lg:hidden"><BottomNav /></div>
      </>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <>
      <SideNav />

      {/* Full-page black container */}
      <div className="fixed inset-0 lg:left-[72px] bg-black overflow-hidden flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2 z-40 relative">
          <div className="flex gap-1 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full p-0.5">
            {(['foryou', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  tab === t ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t === 'foryou' ? 'For You' : 'Following'}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/reels/upload')}
            className="text-xs font-semibold text-white/70 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full hover:text-white transition-colors border border-white/10"
          >
            + Upload
          </button>
        </header>

        {/* ── Main area ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* Scroll container */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-scroll snap-y snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {reels.length === 0 ? (
              <div className="h-screen flex items-center justify-center snap-start">
                <div className="text-center space-y-4 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">No reels yet</h3>
                    <p className="text-sm text-zinc-500 mt-1">Be the first to upload a learning clip.</p>
                  </div>
                  <button
                    onClick={() => router.push('/reels/upload')}
                    className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-500 transition-colors"
                  >
                    Upload a reel
                  </button>
                </div>
              </div>
            ) : (
              reels.map((reel, index) => {
                const isUserTopic = (user?.subjects ?? []).some(s => reelMatchesSubject(reel, s));
                return (
                  <div
                    key={reel.id}
                    className="relative snap-start snap-always flex items-center justify-center bg-black"
                    style={{ height: '100dvh' }}
                  >
                    {/* ── MOBILE LAYOUT (full screen video) ─────────────── */}
                    {/* ── DESKTOP LAYOUT (centered portrait + sidebar) ───── */}

                    {/* Video column — full screen mobile, constrained desktop */}
                    <div className="
                      relative w-full h-full
                      lg:w-[390px] lg:flex-shrink-0
                      lg:rounded-2xl lg:overflow-hidden
                      lg:h-[calc(min(88vh,760px))]
                      lg:self-center
                    ">
                      <div className="absolute inset-0 bg-black" />

                      <video
                        ref={el => { videoRefs.current[index] = el; }}
                        src={proxyUrl(reel.video_url)}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                        loop
                        playsInline
                        muted
                        poster={proxyUrl(reel.thumbnail_url)}
                        onLoadedData={() => setVideoReady(prev => ({ ...prev, [reel.id]: true }))}
                        onError={() => setVideoFailed(prev => ({ ...prev, [reel.id]: true }))}
                      />

                      {/* Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      {/* Loading spinner */}
                      {!videoReady[reel.id] && !videoFailed[reel.id] && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Top badges */}
                      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-30 pointer-events-none">
                        {reel.category && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                            isUserTopic
                              ? 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                              : 'bg-white/10 border-white/10 text-white'
                          }`}>
                            {reel.category}
                          </span>
                        )}
                        {isUserTopic && (
                          <span className="text-[10px] font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Your topic
                          </span>
                        )}
                      </div>

                      {/* Mobile: bottom info + right actions */}
                      <div className="lg:hidden">
                        {/* Right-side action buttons */}
                        <div className="absolute bottom-32 right-3 z-30 flex flex-col gap-4">
                          <ActionBtn icon="save" active={reel.saved_to_deck} label="Save" onClick={() => handleSaveToDeck(reel.id)} />
                          <ActionBtn icon="remix" label="Remix" onClick={() => router.push(`/create-cards?from_reel=${reel.id}`)} />
                          <ActionBtn icon="comment" label="Discuss" onClick={() => openComments(reel.id)} />
                          <ActionBtn icon="share" label="Share" onClick={() => handleShare(reel.id)} />
                          <ActionBtn icon={reel.following_creator ? 'following' : 'follow'} label={reel.following_creator ? 'Following' : 'Follow'} onClick={() => handleFollow(reel.creator_id)} />
                        </div>

                        {/* Bottom bar */}
                        <div className="absolute bottom-6 left-4 right-4 z-30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {reel.creator_username[0]?.toUpperCase()}
                            </div>
                            <p className="text-white text-sm font-semibold">@{reel.creator_username}</p>
                            {reel.creator_verified && <span className="text-[10px] text-sky-400 font-semibold">Educator</span>}
                          </div>
                          <p className="text-white font-semibold text-sm line-clamp-2">{reel.title}</p>
                          {reel.description && <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{reel.description}</p>}
                          <button
                            onClick={() => handleSaveToDeck(reel.id)}
                            className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                              reel.saved_to_deck ? 'bg-zinc-700 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
                            }`}
                          >
                            {reel.saved_to_deck ? 'Saved to deck' : 'Save to deck'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Desktop sidebar ──────────────────────────────────── */}
                    <div className="hidden lg:flex flex-col gap-6 w-[300px] flex-shrink-0 px-2 self-center">

                      {/* Creator */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                          {reel.creator_username[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">@{reel.creator_username}</p>
                          {reel.creator_verified && (
                            <p className="text-xs text-sky-400 font-medium">Educator</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleFollow(reel.creator_id)}
                          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            reel.following_creator
                              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                              : 'bg-white text-zinc-950 hover:bg-zinc-200'
                          }`}
                        >
                          {reel.following_creator ? 'Following' : 'Follow'}
                        </button>
                      </div>

                      {/* Title + description */}
                      <div>
                        <p className="text-white font-bold text-base leading-snug">{reel.title}</p>
                        {reel.description && (
                          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{reel.description}</p>
                        )}
                        {reel.category && (
                          <span className={`inline-block mt-2.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isUserTopic
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {reel.category}
                          </span>
                        )}
                      </div>

                      {/* Save to deck — primary CTA */}
                      <button
                        onClick={() => handleSaveToDeck(reel.id)}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                          reel.saved_to_deck
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        {reel.saved_to_deck ? '✓ Saved to deck' : 'Save to deck'}
                      </button>

                      {/* Secondary actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => router.push(`/create-cards?from_reel=${reel.id}`)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-sm font-semibold text-zinc-300">Remix into cards</span>
                        </button>
                        <button
                          onClick={() => openComments(reel.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-semibold text-zinc-300">Discuss</span>
                        </button>
                        <button
                          onClick={() => handleShare(reel.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="text-sm font-semibold text-zinc-300">Share</span>
                        </button>
                      </div>

                      {/* Up/down navigation hints */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <span className="text-xs text-zinc-600">{index + 1} of {reels.length}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (index > 0 && containerRef.current) {
                                containerRef.current.scrollTo({ top: (index - 1) * window.innerHeight, behavior: 'smooth' });
                              }
                            }}
                            disabled={index === 0}
                            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (index < reels.length - 1 && containerRef.current) {
                                containerRef.current.scrollTo({ top: (index + 1) * window.innerHeight, behavior: 'smooth' });
                              }
                            }}
                            disabled={index === reels.length - 1}
                            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upload FAB — mobile only */}
      <button
        onClick={() => router.push('/reels/upload')}
        className="fixed bottom-20 right-4 lg:hidden w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg z-40 hover:bg-sky-500 transition-colors"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="lg:hidden"><BottomNav /></div>

      <style jsx global>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

// ─── Reusable mobile action button ───────────────────────────────────────────

function ActionBtn({ icon, label, active, onClick }: {
  icon: string; label: string; active?: boolean; onClick: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    save: <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    remix: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    comment: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    share: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
    follow: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
    following: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors ${
        active ? 'bg-sky-500/20 border-sky-500/40' : 'bg-white/10 border-white/10'
      }`}>
        {icons[icon]}
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
