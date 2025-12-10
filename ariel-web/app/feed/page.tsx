'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

interface Activity {
  id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  activity_type: string;
  metadata: {
    count?: number;
    achievement_name?: string;
    streak_days?: number;
    deck_title?: string;
    [key: string]: any;
  };
  created_at: string;
  likes: number;
  liked_by: string[];
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8003/api/activity/${activityId}/like`, {
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
      case 'cards_reviewed':
        return '📚';
      case 'deck_created':
        return '🎨';
      case 'study_session':
        return '⏰';
      case 'achievement_unlocked':
        return '🏆';
      case 'streak_milestone':
        return '🔥';
      case 'level_up':
        return '⭐';
      case 'new_follower':
        return '👥';
      case 'card_liked':
        return '❤️';
      case 'card_shared':
        return '🔗';
      case 'challenge_completed':
        return '✅';
      default:
        return '📌';
    }
  };

  const getActivityText = (activity: Activity) => {
    const { activity_type, metadata } = activity;

    switch (activity_type) {
      case 'cards_reviewed':
        return `reviewed ${metadata.count} cards`;
      case 'deck_created':
        return `created "${metadata.deck_title}"`;
      case 'study_session':
        return `studied for ${Math.round((metadata.duration || 0) / 60)} minutes`;
      case 'achievement_unlocked':
        return `unlocked "${metadata.achievement_name}"`;
      case 'streak_milestone':
        return `hit ${metadata.streak_days} day streak`;
      case 'level_up':
        return `reached level ${metadata.new_level}`;
      case 'new_follower':
        return `gained a new follower`;
      case 'card_liked':
        return `liked a card`;
      case 'card_shared':
        return `shared a card`;
      case 'challenge_completed':
        return `completed a challenge`;
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

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-spin" style={{
            WebkitMaskImage: 'linear-gradient(transparent 50%, black 50%)',
            maskImage: 'linear-gradient(transparent 50%, black 50%)'
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse-slow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-transparent bg-clip-text">
                Activity Feed
              </h1>
              <p className="text-sm text-gray-600">See what everyone's learning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
              <span className="text-6xl">📱</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No activity yet</h3>
            <p className="text-gray-600">Start following people to see their activities!</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="glass rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slideUp"
            >
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {activity.profile_picture ? (
                    <img
                      src={activity.profile_picture}
                      alt={activity.username}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {activity.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">{activity.username}</span>
                    <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <span className="text-gray-600">{getActivityText(activity)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{formatTimestamp(activity.created_at)}</p>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(activity.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-all">
                    <svg
                      className="w-5 h-5 text-gray-700 group-hover:text-red-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-600">{activity.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
