'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

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

const FALLBACK_REEL: Reel = {
  id: 'seed-1',
  kind: 'card',
  title: 'Why chlorophyll matters',
  description: 'Chlorophyll captures light energy; without it, photosynthesis stalls.',
  creator_id: 'ariel',
  creator_username: 'Ariel AI',
  creator_verified: true,
  creator_badge_type: 'expert',
  category: 'Biology • Photosynthesis',
  saved_to_deck: false,
};

const FALLBACK_REEL_2: Reel = {
  id: 'seed-2',
  kind: 'card',
  title: 'Trig in one line',
  description: 'SOH-CAH-TOA: sine = opposite/hypotenuse, cosine = adjacent/hypotenuse, tangent = opposite/adjacent.',
  creator_id: 'ariel',
  creator_username: 'Ariel AI',
  creator_verified: true,
  creator_badge_type: 'expert',
  category: 'Math • Trigonometry',
  saved_to_deck: false,
};

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState<Record<string, boolean>>({});
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [tab] = useState<'foryou' | 'following'>('foryou'); // kept for future API calls
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReels();
  }, [tab]);

  useEffect(() => {
    // Play current video, pause others
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === currentIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint =
        tab === 'foryou'
          ? 'http://localhost:8003/api/reels/feed'
          : 'http://localhost:8003/api/reels/following';

      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = data.map((item: Reel) => ({
          ...item,
          saved_to_deck: item.saved_to_deck ?? false,
        }));
        setReels(normalized.length > 0 ? normalized : [FALLBACK_REEL, FALLBACK_REEL_2]);
      } else {
        setReels([FALLBACK_REEL, FALLBACK_REEL_2]);
      }
    } catch (error) {
      console.error('Failed to load reels:', error);
      setReels([FALLBACK_REEL, FALLBACK_REEL_2]);
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

  const handleSaveToDeck = (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId ? { ...reel, saved_to_deck: !reel.saved_to_deck } : reel
      )
    );
  };

  const handleFollow = async (creatorId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`http://localhost:8003/api/social/users/${creatorId}/follow`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReels((prev) =>
        prev.map((reel) =>
          reel.creator_id === creatorId
            ? { ...reel, following_creator: !reel.following_creator }
            : reel
        )
      );
    } catch (error) {
      console.error('Failed to follow creator:', error);
    }
  };

  const handleRemix = () => alert('Remix into flashcards coming soon.');
  const handleDiscuss = () => alert('Discuss coming soon.');

  const getBadgeIcon = (badgeType?: string) => {
    switch (badgeType) {
      case 'teacher':
        return '👨‍🏫';
      case 'student':
        return '🎓';
      case 'expert':
        return '⭐';
      default:
        return null;
    }
  };

  const toggleReveal = (reelId: string) => {
    setRevealed((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-gradient-to-br from-emerald-600/80 via-blue-600/70 to-indigo-700/70 rounded-3xl p-6 shadow-2xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl text-white animate-float-soft">
            🧬
          </div>
          <h3 className="text-white text-xl font-semibold mt-4">Loading your first 20s explainer…</h3>
          <p className="text-white/80 text-sm mt-2">
            We’ll start with a clear concept so you’re learning in under a second.
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-1/2 bg-white/70 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Pure feed header */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-start justify-between px-4 pt-4 text-white/80">
          <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
            Pure Feed · Learn in 20s
          </span>
          <span className="text-xs text-white/60">Save · Remix · Discuss</span>
        </div>
      </header>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.length === 0 ? (
          <div className="h-screen flex items-center justify-center snap-start px-4">
            <div className="max-w-md w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl text-white animate-float-soft">
                🧠
              </div>
              <h3 className="text-xl font-semibold text-white mt-4">Learn something in 20 seconds</h3>
              <p className="text-sm text-gray-300 mt-2">
                Short explainers and flashcards matched to what you’re studying.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={loadReels}
                  className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-slate-100 transition"
                >
                  Start learning
                </button>
                <button
                  onClick={() => router.push('/reels/upload')}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Create a learning clip
                </button>
              </div>
              <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl animate-float-soft">
                    🌿
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Why chlorophyll matters</p>
                    <p className="text-white/70 text-xs">Chlorophyll captures light energy for photosynthesis.</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-white/60 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="relative h-screen w-full snap-start snap-always"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />

              {reel.kind !== 'card' && reel.video_url ? (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={reel.video_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                  poster={reel.thumbnail_url}
                  onLoadedData={() => setVideoReady((prev) => ({ ...prev, [reel.id]: true }))}
                  onError={() => setVideoFailed((prev) => ({ ...prev, [reel.id]: true }))}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleReveal(reel.id)}
                  className="absolute inset-0 w-full h-full flex items-center justify-center px-6 focus:outline-none"
                  aria-label={revealed[reel.id] ? 'Hide answer' : 'Reveal answer'}
                >
                  <div className="max-w-md w-full rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/35 via-blue-600/25 to-indigo-700/30 p-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10 text-white">
                        {reel.category || 'Pure Feed'}
                      </span>
                      <span className="text-xs text-white/70">{revealed[reel.id] ? 'Tap to reset' : 'Tap to reveal'}</span>
                    </div>

                    <div className="mt-5">
                      <p className="text-white text-2xl font-bold leading-tight">{reel.title}</p>
                      {reel.description && (
                        <p className="text-white/80 text-sm mt-2">{reel.description}</p>
                      )}
                    </div>

                    <div className="mt-6 rounded-2xl bg-black/25 border border-white/10 p-4 text-left">
                      {reel.id === 'seed-1' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">🌿</div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold">Question</p>
                              <p className="text-white/70 text-sm truncate">What does chlorophyll do?</p>
                            </div>
                          </div>
                          {revealed[reel.id] ? (
                            <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                              <p className="text-emerald-100 font-semibold text-sm">Answer</p>
                              <p className="text-white text-sm mt-1">It captures light energy to power photosynthesis.</p>
                            </div>
                          ) : (
                            <div className="h-12 rounded-xl bg-white/5 border border-white/10 shimmer" />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">📐</div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold">Quick check</p>
                              <p className="text-white/70 text-sm truncate">What is sine?</p>
                            </div>
                          </div>
                          {revealed[reel.id] ? (
                            <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                              <p className="text-emerald-100 font-semibold text-sm">Answer</p>
                              <p className="text-white text-sm mt-1">Opposite ÷ Hypotenuse.</p>
                            </div>
                          ) : (
                            <div className="h-12 rounded-xl bg-white/5 border border-white/10 shimmer" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs text-white/70">
                      <span>Swipe for the next concept</span>
                      <span className="font-semibold text-white/80">Pure Feed</span>
                    </div>
                  </div>
                </button>
              )}

              {/* Contrast overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Placeholder visual when not ready or failed */}
              {reel.kind !== 'card' && reel.video_url && (!videoReady[reel.id] || videoFailed[reel.id]) && (
                <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
                  <div className="max-w-md w-full bg-gradient-to-br from-emerald-600/70 via-blue-600/60 to-indigo-700/60 rounded-3xl p-5 border border-white/10 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl text-white animate-float-soft">
                      🌿
                    </div>
                    <h4 className="text-white text-lg font-semibold mt-3">{reel.title}</h4>
                    {reel.description && (
                      <p className="text-white/80 text-sm mt-1 line-clamp-2">{reel.description}</p>
                    )}
                    <div className="mt-3 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div className="h-full w-2/3 bg-white/60 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject / badge */}
              <div className="absolute top-14 left-0 right-0 px-4 z-30 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-white/15 px-3 py-1 rounded-full border border-white/10">
                    {reel.category || 'General'}
                  </span>
                  {reel.creator_verified && (
                    <span className="text-xs bg-white/15 px-2 py-1 rounded-full border border-white/10">
                      {getBadgeIcon(reel.creator_badge_type)} Educator
                    </span>
                  )}
                </div>
              </div>

              {/* Minimal metadata */}
              <div className="absolute bottom-28 left-0 right-0 px-4 z-30 pointer-events-none">
                <p className="text-white font-semibold text-base line-clamp-2">{reel.title}</p>
                {reel.description && (
                  <p className="text-white/80 text-sm line-clamp-2 mt-1">{reel.description}</p>
                )}
              </div>

              {/* Right-side actions */}
              <div className="absolute bottom-24 right-3 z-30 flex flex-col gap-5">
                <button
                  onClick={() => handleSaveToDeck(reel.id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/10 transition ${
                      reel.saved_to_deck ? 'ring-2 ring-emerald-400/60' : ''
                    }`}
                  >
                    <span className="text-xl">❤️</span>
                  </div>
                  <span className="text-[11px] mt-1">Save</span>
                </button>

                <button
                  onClick={handleRemix}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/10">
                    <span className="text-xl">🔁</span>
                  </div>
                  <span className="text-[11px] mt-1">Remix</span>
                </button>

                <button
                  onClick={handleDiscuss}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-xl">💬</span>
                  </div>
                  <span className="text-[11px] mt-1">Discuss</span>
                </button>

                <button
                  onClick={() => handleFollow(reel.creator_id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-xl">➕</span>
                  </div>
                  <span className="text-[11px] mt-1">
                    {reel.following_creator ? 'Following' : 'Follow'}
                  </span>
                </button>
              </div>

              {/* Bottom CTA */}
              <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold line-clamp-1">{reel.title}</p>
                    {reel.description && (
                      <p className="text-white/70 text-xs line-clamp-1">{reel.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveToDeck(reel.id)}
                    className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-slate-100 transition whitespace-nowrap"
                  >
                    Add to my deck
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-float-soft {
          animation: floatSoft 3.5s ease-in-out infinite;
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.16), rgba(255,255,255,0.06));
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes floatSoft {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
