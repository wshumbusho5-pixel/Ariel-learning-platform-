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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center lg:pl-[72px] w-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-zinc-500 font-medium">Loading streams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full">
      <SideNav />
      <div className="min-h-screen bg-zinc-950 pb-20 lg:pl-[72px] w-full">
        {/* Header */}
        <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white">Live</h1>
            <button
              onClick={() => router.push('/live/create')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Go Live
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('live')}
              className={`pb-2 px-1 text-sm font-semibold transition-all border-b-2 ${
                filter === 'live'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500'
              }`}
            >
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Now ({liveStreams.length})
              </span>
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`pb-2 px-1 text-sm font-semibold transition-all border-b-2 ${
                filter === 'upcoming'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500'
              }`}
            >
              Upcoming ({upcomingStreams.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 px-1 text-sm font-semibold transition-all border-b-2 ${
                filter === 'all'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500'
              }`}
            >
              All
            </button>
          </div>
        </div>
        </header>

        {/* Streams Grid */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {streams.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🎥</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'live' ? 'No live streams right now' : 'No upcoming streams'}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">Be the first to go live!</p>
            <button
              onClick={() => router.push('/live/create')}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg transition-colors"
            >
              Create Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => router.push(`/live/${stream.id}`)}
                className="group relative bg-black rounded-xl overflow-hidden hover:shadow-md transition-shadow"
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
                    <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      LIVE
                    </div>
                  )}

                  {/* Viewers Count */}
                  {stream.status === 'live' && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      {formatViewers(stream.viewers_count)}
                    </div>
                  )}

                  {/* Scheduled Time */}
                  {stream.status === 'scheduled' && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded">
                      {formatTime(stream.scheduled_start)}
                    </div>
                  )}
                </div>

                {/* Stream Info */}
                <div className="p-3 bg-zinc-900">
                  <div className="flex gap-2 mb-2">
                    {/* Streamer Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center">
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
                      <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {stream.streamer_username}
                        {stream.streamer_verified && ' ✓'}
                      </p>
                      {stream.subject && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {stream.subject}
                        </p>
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
