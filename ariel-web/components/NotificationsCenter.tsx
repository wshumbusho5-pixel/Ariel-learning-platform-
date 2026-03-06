'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsAPI } from '@/lib/api';

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
      const data = await notificationsAPI.getNotifications(50, 0, filter === 'unread');
      setNotifications(data?.notifications || data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [filter]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
      return;
    }

    switch (notification.notification_type) {
      case 'card_liked':
      case 'card_saved':
        if (notification.metadata?.card_id) {
          router.push(`/cards/${notification.metadata.card_id}`);
        }
        break;
      case 'new_follower':
        if (notification.user_id) {
          router.push(`/profile/${notification.user_id}`);
        }
        break;
      default:
        break;
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'card_liked': return '❤️';
      case 'card_saved': return '🔖';
      case 'new_follower': return '👥';
      case 'achievement_unlocked': return '🏆';
      case 'streak_milestone': return '🔥';
      case 'level_up': return '⭐';
      case 'comment_posted': return '💬';
      default: return '🔔';
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

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-500 font-semibold hover:text-blue-600"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-100">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
                filter === tab ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                  !notif.is_read ? 'bg-blue-50/50' : ''
                }`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{getNotificationIcon(notif.notification_type)}</span>
                <div className="flex-1 min-w-0">
                  {notif.title && (
                    <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
