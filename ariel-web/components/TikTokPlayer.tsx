'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  following_creator?: boolean;
  saved_to_deck?: boolean;
  view_count?: number;
  like_count?: number;
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
  onShare,
  onComment,
}: {
  reels: TikTokReel[];
  startIndex: number;
  onClose: () => void;
  onSave: (id: string) => void;
  onFollow: (creatorId: string) => void;
  onShare: (id: string) => void;
  onComment: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mutedRef = useRef(true);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[300] bg-black">

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <span className="text-white/40 text-xs font-medium">{activeIndex + 1} / {reels.length}</span>
      </div>

      {/* Mute */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        {muted ? (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-index={String(index)}
            className="relative w-full flex-shrink-0"
            style={{ height: '100dvh', scrollSnapAlign: 'start' }}
            onClick={togglePlay}
          >
            <video
              ref={el => { videoRefs.current[index] = el; }}
              src={proxyUrl(reel.video_url)}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              loop
              playsInline
              muted
              poster={proxyUrl(reel.thumbnail_url)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent pointer-events-none" />

            {paused && activeIndex === index && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Bottom-left: creator + info */}
            <div className="absolute bottom-[88px] left-4 right-[80px] z-20">
              <div className="flex items-center gap-2.5 mb-2.5">
                {reel.creator_profile_picture ? (
                  <img
                    src={proxyUrl(reel.creator_profile_picture)}
                    alt={reel.creator_username}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-500/40 border-2 border-violet-400/30 flex items-center justify-center text-violet-200 font-black text-sm flex-shrink-0">
                    {reel.creator_username[0]?.toUpperCase()}
                  </div>
                )}
                <p className="text-white font-bold text-sm drop-shadow">@{reel.creator_username}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onFollow(reel.creator_id); }}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    reel.following_creator
                      ? 'border-white/30 text-white/60 bg-white/5'
                      : 'border-white text-white bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  {reel.following_creator ? 'Following' : 'Follow'}
                </button>
              </div>
              <p className="text-white font-semibold text-sm leading-snug drop-shadow line-clamp-2">{reel.title}</p>
              {reel.description && (
                <p className="text-white/55 text-xs mt-1 line-clamp-2 drop-shadow">{reel.description}</p>
              )}
              {reel.category && (
                <span className="inline-block mt-2 text-[10px] font-bold bg-black/30 backdrop-blur-sm text-white/60 px-2 py-0.5 rounded">
                  {reel.category}
                </span>
              )}
            </div>

            {/* Right-side actions */}
            <div className="absolute bottom-[120px] right-3 z-20 flex flex-col items-center gap-5">
              <button onClick={(e) => { e.stopPropagation(); onSave(reel.id); }} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm ${reel.saved_to_deck ? 'bg-violet-500/40' : 'bg-white/10'}`}>
                  <svg
                    className={`w-5 h-5 ${reel.saved_to_deck ? 'text-violet-300' : 'text-white'}`}
                    fill={reel.saved_to_deck ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <span className="text-white/50 text-[10px] font-medium">Save</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); onComment(reel.id); }} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-white/50 text-[10px] font-medium">Comment</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); onShare(reel.id); }} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                </div>
                <span className="text-white/50 text-[10px] font-medium">Share</span>
              </button>
            </div>

            {(reel.view_count || reel.like_count) && (
              <div className="absolute top-[72px] right-4 z-20 pointer-events-none">
                <span className="text-white/35 text-[10px] font-medium">
                  {reel.view_count ? `${formatViews(reel.view_count)} views` : `${formatViews(reel.like_count)} likes`}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
