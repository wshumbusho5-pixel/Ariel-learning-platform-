'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import ArielAssistant from '@/components/ArielAssistant';

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
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8003/api/activity/feed?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        console.error('Failed to load activities:', response.status);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8003/activity/${activityId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setActivities(activities.map(activity =>
          activity.id === activityId
            ? { ...activity, likes: activity.likes + 1 }
            : activity
        ));
      }
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
    // Use the title from backend if available, otherwise fall back to metadata
    if (activity.description) {
      return activity.description;
    }

    const { activity_type, metadata } = activity;

    switch (activity_type) {
      case 'cards_reviewed':
        return `reviewed ${metadata.count || 0} cards`;
      case 'deck_created':
        return `created "${metadata.deck_title || 'a new deck'}"`;
      case 'study_session':
        return `studied for ${Math.round((metadata.duration || 0) / 60)} minutes`;
      case 'achievement_unlocked':
        return `unlocked "${metadata.achievement_name || 'an achievement'}"`;
      case 'streak_milestone':
        return `hit ${metadata.streak_days || 0} day streak`;
      case 'level_up':
        return `reached level ${metadata.new_level || 0}`;
      case 'followed_user':
        return `followed a new user`;
      case 'deck_liked':
        return `liked a deck`;
      case 'deck_saved':
        return `saved a deck`;
      case 'story_posted':
        return `posted a story`;
      case 'comment_posted':
        return `commented on a card`;
      default:
        return 'did something awesome';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Instagram-style Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
        </div>
      </header>

      {/* Instagram/Twitter-style Feed */}
      <div className="max-w-2xl mx-auto">
        {activities.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No activity yet</h3>
            <p className="text-sm text-gray-600">Follow people to see their learning journey</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="border-b border-gray-200 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-3">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
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

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{activity.username}</span>
                    <span className="text-gray-600 text-sm">{getActivityText(activity)}</span>
                    <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{formatTimestamp(activity.created_at)}</p>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(activity.id)}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {activity.likes > 0 && (
                    <span className="text-xs text-gray-600">{activity.likes}</span>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
      <ArielAssistant />
    </div>
  );
}
