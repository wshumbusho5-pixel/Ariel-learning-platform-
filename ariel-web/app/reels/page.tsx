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


// Subject keywords map — same logic as dashboard
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  gospel:      ['bible', 'gospel', 'faith', 'theology', 'scripture', 'church', 'religion'],
  business:    ['business', 'marketing', 'finance', 'management', 'accounting', 'sales', 'entrepreneurship'],
  economics:   ['economics', 'gdp', 'inflation', 'trade', 'monetary', 'fiscal', 'economy', 'micro', 'macro'],
  technology:  ['programming', 'software', 'coding', 'javascript', 'python', 'ai', 'data', 'tech', 'computer'],
  health:      ['health', 'medicine', 'anatomy', 'nutrition', 'fitness', 'psychology', 'pharma', 'biology'],
  mathematics: ['mathematics', 'calculus', 'algebra', 'geometry', 'statistics', 'math', 'maths'],
  sciences:    ['biology', 'chemistry', 'physics', 'science', 'lab', 'ecology', 'genetics'],
  history:     ['history', 'historical', 'civilization', 'war', 'ancient', 'medieval'],
  literature:  ['literature', 'english', 'writing', 'poetry', 'novel', 'essay'],
  languages:   ['language', 'french', 'spanish', 'swahili', 'grammar', 'vocabulary', 'kinyarwanda'],
  law:         ['law', 'legal', 'constitution', 'rights', 'court', 'criminal', 'contract'],
  arts:        ['art', 'music', 'design', 'creative', 'paint', 'film', 'photography'],
  psychology:  ['psychology', 'mental', 'behavior', 'cognitive', 'therapy', 'neuroscience'],
  engineering: ['engineering', 'mechanical', 'electrical', 'civil', 'structure', 'circuit', 'thermodynamics'],
  geography:   ['geography', 'map', 'climate', 'continent', 'country', 'geopolitics'],
};

function reelMatchesSubject(reel: Reel, subjectKey: string): boolean {
  const keywords = SUBJECT_KEYWORDS[subjectKey] ?? [];
  const hay = `${reel.title} ${reel.description ?? ''} ${reel.category ?? ''}`.toLowerCase();
  return keywords.some((kw) => hay.includes(kw));
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
      const endpoint = tab === 'foryou' ? '/api/reels/feed' : '/api/reels/following';
      const response = await api.get(endpoint);
      const data: Reel[] = response.data;

      // Keep only video reels
      const videoOnly = data
        .filter((item) => item.video_url && item.kind !== 'card')
        .map((item) => ({ ...item, saved_to_deck: item.saved_to_deck ?? false }));

      // Sort: user's subjects first, then everything else
      const userSubjects: string[] = user?.subjects ?? [];
      const prioritized = videoOnly.filter((r) =>
        userSubjects.some((s) => reelMatchesSubject(r, s))
      );
      const rest = videoOnly.filter(
        (r) => !userSubjects.some((s) => reelMatchesSubject(r, s))
      );

      setReels([...prioritized, ...rest]);
    } catch (error) {
      console.error('Failed to load reels:', error);
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
      setReels((prev) =>
        prev.map((reel) =>
          reel.id === reelId ? { ...reel, saved_to_deck: !reel.saved_to_deck } : reel
        )
      );
    } catch (error) {
      console.error('Failed to save reel:', error);
    }
  };

  const handleFollow = async (creatorId: string) => {
    const currentReel = reels.find((r) => r.creator_id === creatorId);
    try {
      if (currentReel?.following_creator) {
        await socialAPI.unfollowUser(creatorId);
      } else {
        await socialAPI.followUser(creatorId);
      }
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

  const handleRemix = (reelId: string) => {
    router.push(`/create-cards?from_reel=${reelId}`);
  };

  const handleDiscuss = (reelId: string) => {
    openComments(reelId);
  };

  const handleShare = async (reelId: string) => {
    try {
      const shareUrl = `${window.location.origin}/reels/${reelId}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this reel on Ariel',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

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

  if (loading) {
    return (
      <>
        <SideNav />
        <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center lg:pl-[72px]">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <div className="lg:hidden"><BottomNav /></div>
      </>
    );
  }

  return (
    <>
      <SideNav />
      <div className="fixed inset-0 bg-zinc-950 overflow-hidden lg:pl-[72px]">
        {/* Header */}
        <header className="fixed top-0 left-0 lg:left-[72px] right-0 z-40 pointer-events-none">
          <div className="flex items-center justify-between px-4 pt-4 pointer-events-auto">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full p-0.5">
              <button
                onClick={() => setTab('foryou')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  tab === 'foryou' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setTab('following')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  tab === 'following' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                Following
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push('/reels/upload')}
              className="text-xs font-semibold text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full hover:text-white transition-colors border border-white/10"
            >
              + Upload
            </button>
          </div>
        </header>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          height: '100dvh'
        } as React.CSSProperties}
      >
        {reels.length === 0 ? (
          <div className="h-screen flex items-center justify-center snap-start px-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
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
                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Upload a reel
              </button>
            </div>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="relative w-full snap-start snap-always"
              style={{ height: '100dvh' } as React.CSSProperties}
            >
              <div className="absolute inset-0 bg-black" />

              {/* Video */}
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={reel.video_url}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                loop
                playsInline
                muted
                poster={reel.thumbnail_url}
                onLoadedData={() => setVideoReady((prev) => ({ ...prev, [reel.id]: true }))}
                onError={() => setVideoFailed((prev) => ({ ...prev, [reel.id]: true }))}
              />

              {/* Contrast overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Placeholder visual when not ready or failed */}
              {reel.kind !== 'card' && reel.video_url && (!videoReady[reel.id] || videoFailed[reel.id]) && (
                <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
                  <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {/* Subject / badge */}
              <div className="absolute top-16 left-0 right-0 px-4 z-30 pointer-events-none">
                <div className="flex items-center gap-2 flex-wrap">
                  {reel.category && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      (user?.subjects ?? []).some((s) => reelMatchesSubject(reel, s))
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/15 border-white/10 text-white'
                    }`}>
                      {reel.category}
                    </span>
                  )}
                  {(user?.subjects ?? []).some((s) => reelMatchesSubject(reel, s)) && (
                    <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Your topic
                    </span>
                  )}
                  {reel.creator_verified && (
                    <span className="text-xs bg-white/15 px-2 py-1 rounded-full border border-white/10 text-white">
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
                    <svg className="w-5 h-5" fill={reel.saved_to_deck ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-[11px] mt-1">Save</span>
                </button>

                <button
                  onClick={() => handleRemix(reel.id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-[11px] mt-1">Remix</span>
                </button>

                <button
                  onClick={() => handleDiscuss(reel.id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-[11px] mt-1">Discuss</span>
                </button>

                <button
                  onClick={() => handleShare(reel.id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-[11px] mt-1">Share</span>
                </button>

                <button
                  onClick={() => handleFollow(reel.creator_id)}
                  className="flex flex-col items-center text-white/80 hover:text-white transition"
                >
                  <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={reel.following_creator ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
                    </svg>
                  </div>
                  <span className="text-[11px] mt-1">
                    {reel.following_creator ? 'Following' : 'Follow'}
                  </span>
                </button>
              </div>

              {/* Bottom CTA */}
              <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
                <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold line-clamp-1">{reel.title}</p>
                    {reel.description && (
                      <p className="text-white/60 text-xs line-clamp-1 mt-0.5">{reel.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveToDeck(reel.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      reel.saved_to_deck ? 'bg-zinc-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {reel.saved_to_deck ? 'Saved' : 'Save to deck'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Upload Reel */}
      <button
        onClick={() => router.push('/reels/upload')}
        className="fixed bottom-20 right-4 lg:right-6 lg:bottom-6 w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg z-40 hover:bg-emerald-500 transition-colors"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="lg:hidden">
        <BottomNav />
      </div>

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
    </>
  );
}
