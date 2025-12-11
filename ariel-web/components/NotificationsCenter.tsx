'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  notification_type: string;
  user_id?: string;
  actor_username?: string;
  actor_profile_picture?: string;
  message: string;
  title?: string;
  metadata?: {
    card_id?: string;
    achievement_name?: string;
    streak_days?: number;
    [key: string]: any;
  };
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8003/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`http://localhost:8003/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('http://localhost:8003/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Use action_url if provided, otherwise navigate based on type
    if (notification.action_url) {
      router.push(notification.action_url);
    } else {
      // Navigate based on notification type
      switch (notification.notification_type) {
        case 'like':
        case 'comment':
          if (notification.metadata?.card_id) {
            router.push(`/explore?card=${notification.metadata.card_id}`);
          }
          break;
        case 'follow':
          if (notification.user_id) {
            router.push(`/profile/${notification.user_id}`);
          }
          break;
        case 'streak':
          router.push('/dashboard');
          break;
        case 'achievement':
          router.push('/profile');
          break;
        case 'challenge':
          router.push('/challenges');
          break;
      }
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return 'd';
      case 'comment': return '=�';
      case 'follow': return '=d';
      case 'streak': return '=%';
      case 'achievement': return '<�';
      case 'challenge': return '<�';
      default: return '=�';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${weeks}w`;
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-start md:justify-end">
      {/* Notifications Panel - Instagram Style */}
      <div className="bg-white w-full md:w-96 md:h-screen md:shadow-2xl flex flex-col animate-slideUp md:animate-slideLeft">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                filter === 'all'
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              All
              {filter === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                filter === 'unread'
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
              {filter === 'unread' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-gray-600">
                {filter === 'unread'
                  ? "You've read all your notifications"
                  : 'Notifications will appear here'
                }
              </p>
            </div>
          ) : (
            <div>
              {unreadCount > 0 && filter === 'all' && (
                <div className="px-4 py-3 border-b border-gray-200">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-4 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Icon/Avatar */}
                  <div className="flex-shrink-0">
                    {notification.actor_profile_picture || notification.actor_username ? (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        {notification.actor_profile_picture ? (
                          <img
                            src={notification.actor_profile_picture}
                            alt={notification.actor_username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {notification.actor_username?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">{getNotificationIcon(notification.notification_type)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {notification.actor_username && (
                        <span className="font-semibold">{notification.actor_username} </span>
                      )}
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
