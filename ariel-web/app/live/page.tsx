'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface LiveStream {
  id: string;
  streamer_id: string;
  streamer_username: string;
  streamer_profile_picture?: string;
  streamer_verified: boolean;
  title: string;
  description?: string;
  category: string;
  subject?: string;
  topic?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  playback_url?: string;
  thumbnail_url?: string;
  scheduled_start?: string;
  actual_start?: string;
  duration_minutes: number;
  viewers_count: number;
  peak_viewers: number;
  likes_count: number;
  comments_count: number;
  is_liked_by_current_user: boolean;
  is_following_streamer: boolean;
  created_at: string;
}

export default function LivePage() {
  const router = useRouter();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'live' | 'upcoming' | 'all'>('live');

  useEffect(() => {
    loadStreams();
  }, [filter]);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status_filter: filter } : {};
      const response = await api.get('/api/livestream/discover', { params });
      setStreams(response.data);
    } catch (error) {
      console.error('Failed to load streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study_session': return '📚';
      case 'lecture': return '🎓';
      case 'q_and_a': return '❓';
      case 'tutorial': return '💡';
      case 'exam_prep': return '📝';
      case 'discussion': return '💬';
      default: return '🎥';
    }
  };

  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    const minutes = Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

    if (diff > 0) {
      if (hours > 24) {
        return `in ${Math.floor(hours / 24)}d`;
      } else if (hours > 0) {
        return `in ${hours}h`;
      } else {
        return `in ${minutes}m`;
      }
    } else {
      if (hours > 0) {
        return `${hours}h ago`;
      } else {
        return `${minutes}m ago`;
      }
    }
  };

  const liveStreams = streams.filter(s => s.status === 'live');
  const upcomingStreams = streams.filter(s => s.status === 'scheduled');

  if (loading) {
    return (
      <div className="flex w-full">
        <SideNav />
        <div className="min-h-screen bg-[#09090b] lg:pl-[72px] w-full">
          {/* Skeleton header */}
          <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
            <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="h-7 w-16 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse mt-1.5" />
                </div>
                <div className="h-9 w-24 bg-zinc-800 rounded-xl animate-pulse" />
              </div>
              <div className="flex gap-3">
                {[80, 96, 52].map((w, i) => (
                  <div key={i} className={`h-7 w-[${w}px] bg-zinc-800 rounded-full animate-pulse`} />
                ))}
              </div>
            </div>
          </header>

          {/* Skeleton cards */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-[#1e1e22] animate-pulse mb-3 overflow-hidden">
                  <div className="aspect-video bg-zinc-800 rounded" />
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 rounded flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-zinc-800 rounded w-4/5" />
                        <div className="h-3 bg-zinc-800 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full">
      <SideNav />
      <div className="min-h-screen bg-[#09090b] pb-20 lg:pl-[72px] w-full page-enter">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Live</h1>
                <p className="text-[11px] text-zinc-500 mt-0.5">Join live study sessions</p>
              </div>
              <button
                onClick={() => router.push('/live/create')}
                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-violet-500/20 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Go Live
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('live')}
                className={`px-3 py-1 text-sm font-semibold transition-all rounded-full ${
                  filter === 'live'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Live Now
                  <span className={filter === 'live' ? 'text-violet-400' : 'text-zinc-600'}>
                    ({liveStreams.length})
                  </span>
                </span>
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1 text-sm font-semibold transition-all rounded-full ${
                  filter === 'upcoming'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Upcoming
                <span className={filter === 'upcoming' ? ' text-violet-400' : ' text-zinc-600'}>
                  {' '}({upcomingStreams.length})
                </span>
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm font-semibold transition-all rounded-full ${
                  filter === 'all'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </header>

        {/* Streams Grid */}
        <div className="max-w-6xl mx-auto px-4 py-6">

          {/* Section heading */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
              <h2 className="text-base font-black text-white">
                {filter === 'live' ? 'Live Now' : filter === 'upcoming' ? 'Upcoming Streams' : 'All Streams'}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 ml-4">
              {filter === 'live'
                ? 'Join a session happening right now'
                : filter === 'upcoming'
                ? 'Sessions starting soon — set a reminder'
                : 'Browse all available and upcoming sessions'}
            </p>
          </div>

          <div className="border-t border-zinc-800/60 my-4" />

          {streams.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] px-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2">No live sessions right now</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">Be the first to go live and study with others in real time.</p>
              <button
                onClick={() => router.push('/live/create')}
                className="px-6 py-3 bg-violet-500 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
              >
                Start a session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => router.push(`/live/${stream.id}`)}
                  className="group relative bg-[#1e1e22] border border-zinc-800 rounded-xl overflow-hidden hover:shadow-md hover:shadow-violet-900/20 transition-shadow text-left"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-zinc-900">
                    {stream.thumbnail_url ? (
                      <img
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {getCategoryIcon(stream.category)}
                      </div>
                    )}

                    {/* Live Badge */}
                    {stream.status === 'live' && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    )}

                    {/* Viewers Count */}
                    {stream.status === 'live' && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded flex items-center gap-1">
                        <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span className="text-violet-400 font-bold text-xs">{formatViewers(stream.viewers_count)}</span>
                      </div>
                    )}

                    {/* Scheduled Time */}
                    {stream.status === 'scheduled' && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-violet-300 text-xs font-semibold rounded">
                        {formatTime(stream.scheduled_start)}
                      </div>
                    )}
                  </div>

                  {/* Stream Info */}
                  <div className="p-3">
                    <div className="flex gap-2 mb-2">
                      {/* Streamer Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        {stream.streamer_profile_picture ? (
                          <img
                            src={stream.streamer_profile_picture}
                            alt={stream.streamer_username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {stream.streamer_username[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-[15px] line-clamp-2 mb-0.5 leading-snug">
                          {stream.title}
                        </h3>
                        <p className="text-zinc-400 text-xs font-medium">
                          {stream.streamer_username}
                          {stream.streamer_verified && (
                            <span className="ml-1 text-violet-400">✓</span>
                          )}
                        </p>
                        {stream.subject && (
                          <span className="inline-block mt-1.5 bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {stream.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
