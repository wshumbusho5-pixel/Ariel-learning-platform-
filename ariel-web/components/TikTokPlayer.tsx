'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

export interface TikTokReel {
  id: string;
  video_url?: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
  category?: string;
  creator_id: string;
  creator_username: string;
  creator_profile_picture?: string;
  creator_verified?: boolean;
  creator_badge_type?: 'teacher' | 'student' | 'expert';
  following_creator?: boolean;
  saved_to_deck?: boolean;
  view_count?: number;
}

function proxyUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return u.pathname + u.search;
  } catch {}
  return url.replace(/^https?:\/\/[^/]+(?=\/)/, '');
}

function formatViews(n?: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function TikTokPlayer({
  reels,
  startIndex,
  onClose,
  onSave,
  onFollow,
  onComment,
  onDMShare,
}: {
  reels: TikTokReel[];
  startIndex: number;
  onClose: () => void;
  onSave: (id: string) => void;
  onFollow: (creatorId: string) => void;
  onComment: (id: string) => void;
  onDMShare?: (reel: TikTokReel) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mutedRef = useRef(true);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  // Optimistic saved state — seed from initial reel data
  const [savedReels, setSavedReels] = useState<Set<string>>(
    () => new Set(reels.filter(r => r.saved_to_deck).map(r => r.id))
  );

  // Hide swipe hint after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowSwipeHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = startIndex * containerRef.current.clientHeight;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          const video = videoRefs.current[idx];
          if (entry.isIntersecting) {
            setActiveIndex(idx);
            setProgress(0);
            setPaused(false);
            if (video) {
              video.muted = mutedRef.current;
              video.play().catch(() => {});
            }
          } else {
            video?.pause();
          }
        }
      },
      { root: container, threshold: 0.8 }
    );
    Array.from(container.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [reels.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const video = videoRefs.current[activeIndex];
    if (video) video.muted = next;
  };

  const togglePlay = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const video = videoRefs.current[activeIndex];
    if (!video) return;
    if (video.paused) { video.play(); setPaused(false); }
    else { video.pause(); setPaused(true); }
  };

  const handleSave = (e: React.MouseEvent, reelId: string) => {
    e.stopPropagation();
    setSavedReels(prev => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
    onSave(reelId);
  };

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>, index: number) => {
    if (index !== activeIndex) return;
    const video = e.currentTarget;
    if (video.duration) setProgress(video.currentTime / video.duration);
  }, [activeIndex]);

  const hasMore = activeIndex < reels.length - 1;

  return (
    <div className="fixed inset-0 z-[300] bg-black">

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-12 left-4 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mute */}
      <button
        onClick={toggleMute}
        className="absolute top-12 right-4 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        {muted ? (
          <svg className="w-[18px] h-[18px] text-white/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6L5.586 9H4a1 1 0 00-1 1v4a1 1 0 001 1h1.586L12 18V6z" />
          </svg>
        )}
      </button>

      {/* Vertical snap scroll */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {reels.map((reel, index) => {
          const isSaved = savedReels.has(reel.id);

          return (
            <div
              key={reel.id}
              data-index={String(index)}
              className="relative w-full flex-shrink-0"
              style={{ height: '100dvh', scrollSnapAlign: 'start' }}
              onClick={togglePlay}
            >
              {/* Video */}
              <video
                ref={el => { videoRefs.current[index] = el; }}
                src={proxyUrl(reel.video_url)}
                className="absolute inset-0 w-full h-full object-cover bg-black"
                loop
                playsInline
                muted
                poster={proxyUrl(reel.thumbnail_url)}
                onTimeUpdate={e => handleTimeUpdate(e, index)}
              />

              {/* Cinematic gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/20 pointer-events-none" />

              {/* Pause indicator */}
              {paused && activeIndex === index && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Bottom-left: creator + info */}
              <div className="absolute bottom-[130px] left-4 right-[76px] z-20">

                {/* Creator row */}
                <div className="flex items-center gap-2.5 mb-3">
                  {reel.creator_profile_picture ? (
                    <img
                      src={proxyUrl(reel.creator_profile_picture)}
                      alt={reel.creator_username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-500/40 border-2 border-violet-400/30 flex items-center justify-center text-violet-200 font-black text-sm flex-shrink-0">
                      {reel.creator_username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <p className="text-white font-bold text-[14px] drop-shadow leading-tight">@{reel.creator_username}</p>
                    {reel.view_count ? (
                      <p className="text-white/40 text-[11px] leading-tight">{formatViews(reel.view_count)} views</p>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onFollow(reel.creator_id); }}
                    className={`flex-shrink-0 ml-1 px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
                      reel.following_creator
                        ? 'border-white/20 text-white/50 bg-transparent'
                        : 'border-white text-white bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    {reel.following_creator ? 'Following' : 'Follow'}
                  </button>
                </div>

                <p className="text-white font-bold text-[15px] leading-snug drop-shadow line-clamp-2 mb-1">{reel.title}</p>
                {reel.description && (
                  <p className="text-white/60 text-[13px] leading-relaxed line-clamp-2 drop-shadow">{reel.description}</p>
                )}
                {reel.category && (
                  <span className="inline-block mt-2 text-[10px] font-bold bg-black/30 backdrop-blur-sm text-white/70 px-2.5 py-1 rounded-full">
                    {reel.category}
                  </span>
                )}
              </div>

              {/* Right-side action buttons */}
              <div className="absolute bottom-[140px] right-3 z-20 flex flex-col items-center gap-5">

                {/* Discuss */}
                <button onClick={(e) => { e.stopPropagation(); onComment(reel.id); }} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <span className="text-white/70 text-[10px] font-semibold">Discuss</span>
                </button>

                {/* Save — optimistic */}
                <button onClick={e => handleSave(e, reel.id)} className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${isSaved ? 'bg-violet-500/40' : 'bg-white/10'}`}>
                    <svg
                      className={`w-[22px] h-[22px] transition-colors ${isSaved ? 'text-violet-300' : 'text-white'}`}
                      fill={isSaved ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={1.75}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className={`text-[10px] font-semibold ${isSaved ? 'text-violet-300' : 'text-white/70'}`}>
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </button>

                {/* Send */}
                {onDMShare && (
                  <button onClick={(e) => { e.stopPropagation(); onDMShare(reel); }} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-white/70 text-[10px] font-semibold">Send</span>
                  </button>
                )}
              </div>

              {/* Swipe-up hint — fades out after 2.5s, only shows if there's a next clip */}
              {activeIndex === index && hasMore && (
                <div
                  className="absolute bottom-[18px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
                  style={{
                    opacity: showSwipeHint ? 1 : 0,
                    transition: 'opacity 0.6s ease',
                  }}
                >
                  <svg
                    className="w-4 h-4 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    style={{ animation: 'swipeBounce 1.2s ease-in-out infinite' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-white/35 text-[10px] font-medium tracking-wide">swipe up</span>
                </div>
              )}

              {/* Progress bar */}
              {activeIndex === index && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30 pointer-events-none">
                  <div
                    className="h-full bg-white/60 rounded-full"
                    style={{ width: `${progress * 100}%`, transition: 'width 0.25s linear' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes swipeBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
