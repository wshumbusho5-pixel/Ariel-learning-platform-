'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsAPI, socialAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

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
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  action_url?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function NotifAvatar({ n }: { n: Notification }) {
  const [broken, setBroken] = useState(false);
  if (n.actor_profile_picture && !broken) {
    return (
      <img
        src={n.actor_profile_picture.replace(/^https?:\/\/[^/]+/, '')}
        alt={n.actor_username || ''}
        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  const initial = (n.actor_full_name || n.actor_username || '?')[0].toUpperCase();
  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-base">{initial}</span>
    </div>
  );
}

function FollowBackButton({ actorId }: { actorId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.followUser(actorId);
      setIsFollowing(res.is_following);
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
        isFollowing
          ? 'border border-zinc-700 text-zinc-300 rounded-full bg-transparent'
          : 'bg-white text-black rounded-full'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow Back'}
    </button>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const router = useRouter();
  const isFollow = n.notification_type === 'new_follower';
  const isDuel = n.notification_type === 'duel_challenge';
  const name = n.actor_full_name || n.actor_username;
  const roomId = n.metadata?.room_id;

  const handleTap = () => {
    if (isDuel && roomId) {
      router.push(`/duels?join=${roomId}`);
    }
  };

  return (
    <div
      onClick={isDuel ? handleTap : undefined}
      className={`flex items-center gap-3 px-4 py-3.5 ${!n.is_read ? 'bg-violet-500/10' : ''} ${isDuel ? 'cursor-pointer active:bg-zinc-800/50' : ''}`}
    >
      <div className="relative flex-shrink-0">
        <NotifAvatar n={n} />
        {!n.is_read && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-black" />
        )}
      </div>

      <p className="flex-1 text-sm leading-snug" style={{ color: '#e7e9ea' }}>
        {name && <span className="font-bold" style={{ color: '#e7e9ea' }}>{name} </span>}
        {isFollow ? 'started following you.' : n.message}
        <span className="ml-1.5" style={{ color: '#8b9099' }}>{timeAgo(n.created_at)}</span>
      </p>

      {isFollow && n.actor_id && <FollowBackButton actorId={n.actor_id} />}
      {isDuel && roomId && (
        <button
          onClick={handleTap}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700"
        >
          Accept
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.getNotifications(100, 0)
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    notificationsAPI.markAllAsRead().catch(() => {});
  }, []);

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const newNotifs = notifications.filter(n => !n.is_read || new Date(n.created_at).getTime() > cutoff);
  const earlierNotifs = notifications.filter(n => n.is_read && new Date(n.created_at).getTime() <= cutoff);

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-black pb-24 lg:pl-[72px]">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-black border-b border-[#2f3336]">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-1 -ml-1">
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[17px] font-bold" style={{ color: '#e7e9ea' }}>Notifications</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {loading && (
            <div className="py-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-900 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-24 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#e7e9ea' }}>No notifications yet</p>
              <p className="text-xs mt-1" style={{ color: '#8b9099' }}>When people follow you or interact with your content, you'll see it here.</p>
            </div>
          )}

          {!loading && newNotifs.length > 0 && (
            <>
              <div className="px-4 pt-5 pb-2">
                <p className="text-[13px] font-bold" style={{ color: '#e7e9ea' }}>New</p>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {newNotifs.map(n => <NotificationRow key={n.id} n={n} />)}
              </div>
            </>
          )}

          {!loading && earlierNotifs.length > 0 && (
            <>
              <div className="px-4 pt-5 pb-2">
                <p className="text-[13px] font-bold" style={{ color: '#8b9099' }}>Earlier</p>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {earlierNotifs.map(n => <NotificationRow key={n.id} n={n} />)}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
