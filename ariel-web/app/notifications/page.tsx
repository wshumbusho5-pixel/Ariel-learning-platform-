'use client';

import { useState, useEffect } from 'react';
import { notificationsAPI } from '@/lib/api';
import Link from 'next/link';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  icon?: string;
  actor_id?: string;
  actor_username?: string;
  actor_full_name?: string;
  actor_profile_picture?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsAPI.getNotifications(50, 0, filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <SideNav />
      <div className="min-h-screen lg:pl-[72px] bg-zinc-950">
        <div className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-sm text-zinc-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <Link
                href="/notifications/settings"
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="flex gap-2 mt-4">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-500 hover:text-red-400 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-zinc-900 border rounded-xl p-4 transition-colors ${
                    !notification.is_read ? 'border-emerald-800/60 ring-1 ring-emerald-800/40' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {notification.actor_profile_picture ? (
                        <img
                          src={notification.actor_profile_picture}
                          alt={notification.actor_username || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                          {notification.icon || '📬'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-zinc-600 mt-2">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5 text-zinc-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {notification.action_url && (
                    <Link
                      href={notification.action_url}
                      className="mt-3 block w-full py-2 text-center bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg font-medium transition-colors"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-zinc-500">
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : "We'll notify you when something happens"}
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
