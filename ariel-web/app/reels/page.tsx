'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ShareModal from '@/components/ShareModal';

interface Reel {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_username: string;
  creator_profile_picture?: string;
  creator_verified?: boolean;
  creator_badge_type?: 'teacher' | 'student' | 'expert';
  likes: number;
  comments_count: number;
  shares_count: number;
  views: number;
  created_at: string;
  liked_by_current_user?: boolean;
  following_creator?: boolean;
  category?: string;
  hashtags?: string[];
}

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    loadReels();
  }, [tab]);

  useEffect(() => {
    // Play current video, pause others
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(e => console.log('Play error:', e));
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = tab === 'foryou'
        ? 'http://localhost:8003/api/reels/feed'
        : 'http://localhost:8003/api/reels/following';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReels(data);
      }
    } catch (error) {
      console.error('Failed to load reels:', error);
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

  const handleLike = async (reelId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReels(reels.map(reel =>
          reel.id === reelId
            ? {
                ...reel,
                likes: reel.liked_by_current_user ? reel.likes - 1 : reel.likes + 1,
                liked_by_current_user: !reel.liked_by_current_user
              }
            : reel
        ));
      }
    } catch (error) {
      console.error('Failed to like reel:', error);
    }
  };

  const handleFollow = async (creatorId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/api/social/users/${creatorId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReels(reels.map(reel =>
          reel.creator_id === creatorId
            ? { ...reel, following_creator: !reel.following_creator }
            : reel
        ));
      }
    } catch (error) {
      console.error('Failed to follow creator:', error);
    }
  };

  const handleShare = async (reel: Reel) => {
    setShareData({
      title: reel.title,
      url: `/reels/${reel.id}`
    });
    setShareModalOpen(true);
  };

  const handleComment = (reelId: string) => {
    // TODO: Open comments modal
    alert('Comments coming soon!');
  };

  const getBadgeIcon = (badgeType?: string) => {
    switch (badgeType) {
      case 'teacher': return '👨‍🏫';
      case 'student': return '🎓';
      case 'expert': return '⭐';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-white font-medium">Loading Reels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header - TikTok Style */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-8 pt-3 pb-2">
          <button
            onClick={() => setTab('following')}
            className={`text-base font-semibold transition-all ${
              tab === 'following'
                ? 'text-white scale-110'
                : 'text-gray-400'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setTab('foryou')}
            className={`text-base font-semibold transition-all ${
              tab === 'foryou'
                ? 'text-white scale-110'
                : 'text-gray-400'
            }`}
          >
            For You
          </button>
        </div>
      </header>

      {/* Video Container - Snap Scroll */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.length === 0 ? (
          <div className="h-screen flex items-center justify-center snap-start">
            <div className="text-center px-4">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-6xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No reels yet</h3>
              <p className="text-sm text-gray-400">
                {tab === 'following'
                  ? 'Follow creators to see their reels'
                  : 'Be the first to create a reel!'}
              </p>
            </div>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="relative h-screen w-full snap-start snap-always"
            >
              {/* Video Player */}
              <video
                ref={el => videoRefs.current[index] = el}
                src={reel.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted={false}
                poster={reel.thumbnail_url}
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

              {/* Creator Info - Bottom Left */}
              <div className="absolute bottom-20 left-0 right-20 px-4 z-30">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => router.push(`/profile/${reel.creator_id}`)}
                    className="flex-shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center ring-2 ring-white">
                      {reel.creator_profile_picture ? (
                        <img
                          src={reel.creator_profile_picture}
                          alt={reel.creator_username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {reel.creator_username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/profile/${reel.creator_id}`)}
                        className="font-bold text-white text-base hover:opacity-80"
                      >
                        {reel.creator_username}
                      </button>
                      {reel.creator_verified && (
                        <span className="text-lg">
                          {getBadgeIcon(reel.creator_badge_type)}
                        </span>
                      )}
                    </div>
                  </div>

                  {!reel.following_creator && (
                    <button
                      onClick={() => handleFollow(reel.creator_id)}
                      className="px-4 py-1.5 bg-white text-black font-bold text-sm rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Follow
                    </button>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">
                  {reel.title}
                </h3>
                {reel.description && (
                  <p className="text-white text-sm mb-2 line-clamp-2 opacity-90">
                    {reel.description}
                  </p>
                )}

                {/* Hashtags */}
                {reel.hashtags && reel.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reel.hashtags.map((tag, i) => (
                      <span key={i} className="text-white text-sm font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons - Right Side */}
              <div className="absolute bottom-24 right-3 z-30 flex flex-col gap-6">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(reel.id)}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    reel.liked_by_current_user
                      ? 'bg-red-500 scale-110'
                      : 'bg-gray-800/70 backdrop-blur-sm'
                  }`}>
                    <svg
                      className={`w-7 h-7 transition-all ${
                        reel.liked_by_current_user
                          ? 'fill-white text-white'
                          : 'fill-none text-white'
                      }`}
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold mt-1">
                    {reel.likes > 0 ? (reel.likes >= 1000 ? `${(reel.likes / 1000).toFixed(1)}K` : reel.likes) : ''}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => handleComment(reel.id)}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800/70 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold mt-1">
                    {reel.comments_count > 0 ? (reel.comments_count >= 1000 ? `${(reel.comments_count / 1000).toFixed(1)}K` : reel.comments_count) : ''}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleShare(reel)}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800/70 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold mt-1">
                    {reel.shares_count > 0 ? (reel.shares_count >= 1000 ? `${(reel.shares_count / 1000).toFixed(1)}K` : reel.shares_count) : ''}
                  </span>
                </button>

                {/* Creator Profile (Animated) */}
                <button
                  onClick={() => router.push(`/profile/${reel.creator_id}`)}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center ring-2 ring-white animate-spin-slow">
                    {reel.creator_profile_picture ? (
                      <img
                        src={reel.creator_profile_picture}
                        alt={reel.creator_username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-xs">
                        {reel.creator_username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Button - Floating */}
      <button
        onClick={() => router.push('/reels/upload')}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />

      {/* Share Modal */}
      {shareData && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title={shareData.title}
          url={shareData.url}
          type="reel"
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
