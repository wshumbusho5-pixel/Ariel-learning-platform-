'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import ErrorView from '@/components/ErrorView';

interface Activity {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
  is_verified?: boolean;
  activity_type: string;
  title: string;
  description?: string;
  icon?: string;
  related_deck_id?: string;
  related_achievement_id?: string;
  related_user_id?: string;
  metadata: {
    count?: number;
    achievement_name?: string;
    streak_days?: number;
    deck_title?: string;
    duration?: number;
    new_level?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
  created_at: string;
  likes: number;
  is_liked_by_current_user?: boolean;
  liked_by?: string[];
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get('/api/activity/feed', { params: { limit: 50 } });
      setActivities(response.data);
    } catch {
      setFetchError('Failed to load feed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    const isCurrentlyLiked = activity?.is_liked_by_current_user || false;

    try {
      await api.post(`/api/activity/${activityId}/like`);
      setActivities(activities.map(a =>
        a.id === activityId
          ? {
              ...a,
              likes: isCurrentlyLiked ? Math.max(0, a.likes - 1) : a.likes + 1,
              is_liked_by_current_user: !isCurrentlyLiked,
            }
          : a
      ));
    } catch (error) {
      console.error('Failed to like activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cards_reviewed': return '📚';
      case 'deck_created': return '🎨';
      case 'study_session': return '⏰';
      case 'achievement_unlocked': return '🏆';
      case 'streak_milestone': return '🔥';
      case 'level_up': return '⭐';
      case 'new_follower': return '👥';
      case 'card_liked': return '❤️';
      case 'card_shared': return '🔗';
      case 'challenge_completed': return '✅';
      default: return '📌';
    }
  };

  const getActivityText = (activity: Activity) => {
    if (activity.description) return activity.description;

    const { activity_type, metadata } = activity;
    switch (activity_type) {
      case 'cards_reviewed': return `reviewed ${metadata.count || 0} cards`;
      case 'deck_created': return `created "${metadata.deck_title || 'a new deck'}"`;
      case 'study_session': return `studied for ${Math.round((metadata.duration || 0) / 60)} minutes`;
      case 'achievement_unlocked': return `unlocked "${metadata.achievement_name || 'an achievement'}"`;
      case 'streak_milestone': return `hit ${metadata.streak_days || 0} day streak`;
      case 'level_up': return `reached level ${metadata.new_level || 0}`;
      case 'followed_user': return `followed a new user`;
      case 'deck_liked': return `liked a deck`;
      case 'deck_saved': return `saved a deck`;
      case 'story_posted': return `posted a story`;
      case 'comment_posted': return `commented on a card`;
      default: return 'did something awesome';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (loading) {
    return (
      <>
        <SideNav />
        <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-20">
          <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-black text-white tracking-tight">Feed</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">What your network is learning</p>
            </div>
          </header>
          <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-[#1e1e22] mb-3 animate-pulse p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                    <div className="h-2 bg-zinc-800 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <BottomNav />
        </div>
      </>
    );
  }

  if (fetchError) {
    return (
      <>
        <SideNav />
        <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-20">
          <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-black text-white tracking-tight">Feed</h1>
            </div>
          </header>
          <ErrorView message={fetchError} onRetry={loadActivities} fullPage />
          <BottomNav />
        </div>
      </>
    );
  }

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] pb-20 lg:pl-[72px] page-enter">
        <header className="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Feed</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">What your network is learning</p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 pt-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2">Nothing here yet</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Follow other learners to see their activity — streaks, achievements, new decks.</p>
            </div>
          ) : (
            <>
              <div className="pt-1 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-base font-black text-white">Recent Activity</span>
                <span className="text-violet-400 text-sm font-semibold ml-1">{activities.length}</span>
              </div>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-zinc-800 bg-[#1e1e22] mb-3 px-4 py-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        {activity.profile_picture ? (
                          <img
                            src={activity.profile_picture}
                            alt={activity.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {activity.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white text-sm">{activity.username}</span>
                        <span className="text-zinc-300 text-sm">{getActivityText(activity)}</span>
                        <span className="text-lg leading-none">{getActivityIcon(activity.activity_type)}</span>
                      </div>
                      <p className="text-zinc-600 text-xs">{formatTimestamp(activity.created_at)}</p>
                    </div>

                    <button
                      onClick={() => handleLike(activity.id)}
                      className="flex flex-col items-center gap-0.5 group flex-shrink-0"
                    >
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          activity.is_liked_by_current_user
                            ? 'text-violet-400 fill-current'
                            : 'text-zinc-600 group-hover:text-violet-400'
                        }`}
                        fill={activity.is_liked_by_current_user ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {activity.likes > 0 && (
                        <span className="font-black text-white text-xs">{activity.likes}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
