'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

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
    [key: string]: any;
  };
  created_at: string;
  likes: number;
  is_liked_by_current_user?: boolean;
  liked_by?: string[];
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/activity/feed', { params: { limit: 50 } });
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
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
      <div className="min-h-screen lg:pl-[72px] bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 pb-20 lg:pl-[72px]">
        <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <h1 className="text-2xl font-bold text-white">Activity</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          {activities.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No activity yet</h3>
              <p className="text-sm text-zinc-500">Follow people to see their learning journey</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="border-b border-zinc-800 px-4 py-4 hover:bg-zinc-900 transition-colors"
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
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{activity.username}</span>
                      <span className="text-zinc-400 text-sm">{getActivityText(activity)}</span>
                      <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    </div>
                    <p className="text-xs text-zinc-600">{formatTimestamp(activity.created_at)}</p>
                  </div>

                  <button
                    onClick={() => handleLike(activity.id)}
                    className="flex flex-col items-center gap-0.5 group"
                  >
                    <svg
                      className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {activity.likes > 0 && (
                      <span className="text-xs text-zinc-600">{activity.likes}</span>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
