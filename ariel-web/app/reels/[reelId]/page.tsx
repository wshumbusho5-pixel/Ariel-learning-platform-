'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { socialAPI } from '@/lib/api';
import TikTokPlayer from '@/components/TikTokPlayer';
import { useComments } from '@/lib/commentsContext';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import ArielLoader from '@/components/ArielLoader';

interface Reel {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  creator_id: string;
  creator_username: string;
  creator_profile_picture?: string;
  creator_verified?: boolean;
  category?: string;
  saved_to_deck?: boolean;
  following_creator?: boolean;
  view_count?: number;
}

export default function ReelDeepLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { openComments } = useComments();
  const reelId = params.reelId as string;

  const [reel, setReel] = useState<Reel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!reelId) return;
    api.get(`/api/reels/${reelId}`)
      .then(r => setReel(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [reelId]);

  const handleSave = useCallback(async (id: string) => {
    try { await api.post(`/api/reels/${id}/save`); } catch {}
    setReel(prev => prev ? { ...prev, saved_to_deck: !prev.saved_to_deck } : prev);
  }, []);

  const handleFollow = useCallback(async (creatorId: string) => {
    if (!creatorId) return;
    const isFollowing = reel?.following_creator;
    try {
      if (isFollowing) await socialAPI.unfollowUser(creatorId);
      else await socialAPI.followUser(creatorId);
      setReel(prev => prev ? { ...prev, following_creator: !isFollowing } : prev);
    } catch {}
  }, [reel]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <ArielLoader size={48} />
      </div>
    );
  }

  if (notFound || !reel) {
    return (
      <>
        <SideNav />
        <div className="min-h-screen bg-[#09090b] lg:pl-[72px] flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-base font-bold text-white">Clip not found</p>
          <p className="text-sm text-zinc-500">This clip may have been removed or is no longer available.</p>
          <button
            onClick={() => router.push('/reels')}
            className="mt-2 px-5 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-full active:scale-95 transition-all"
          >
            Browse Clips
          </button>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <TikTokPlayer
      reels={[reel]}
      startIndex={0}
      onClose={() => router.push('/reels')}
      onSave={handleSave}
      onFollow={handleFollow}
      onComment={(id) => openComments(id)}
    />
  );
}
