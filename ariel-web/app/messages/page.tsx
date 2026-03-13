'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { messagesAPI, authAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_username?: string;
  other_user_full_name?: string;
  other_user_profile_picture?: string;
  other_user_is_verified: boolean;
  other_user_last_seen?: string;
  last_message_content?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  unread_count: number;
  is_archived: boolean;
}

type Tab = 'all' | 'unread' | 'buddies';

function timeAgo(d?: string) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function isOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const letter = name?.[0]?.toUpperCase() ?? '?';
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg' };
  return (
    <div className={`${sizes[size]} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 flex-shrink-0`}>
      {letter}
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [buddies, setBuddies] = useState<Set<string>>(new Set());

  // Load buddies from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ariel_buddies');
      if (stored) setBuddies(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  useEffect(() => {
    authAPI.heartbeat().catch(() => {});
    messagesAPI.getConversations()
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleBuddy = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBuddies(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('ariel_buddies', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = conversations;
    if (tab === 'unread') list = list.filter(c => c.unread_count > 0);
    if (tab === 'buddies') list = list.filter(c => buddies.has(c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.other_user_full_name || '').toLowerCase().includes(q) ||
        (c.other_user_username || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, tab, search, buddies]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'buddies', label: 'Buddies' },
  ];

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] pb-24 lg:pl-[72px]">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/60">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-white">Rooms</h1>
            <button
              onClick={() => router.push('/search?dm=1')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>

          {/* Glass search bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2.5 bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl px-4 h-10">
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search rooms..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 pb-3">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  tab === t.key
                    ? 'bg-white text-zinc-900'
                    : 'bg-white/8 text-zinc-400 hover:bg-white/12'
                }`}
              >
                {t.label}
                {t.key === 'unread' && conversations.filter(c => c.unread_count > 0).length > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === 'unread' ? 'bg-zinc-900 text-white' : 'bg-violet-600 text-white'}`}>
                    {conversations.filter(c => c.unread_count > 0).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-4 py-3 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded-full w-1/3" />
                  <div className="h-2.5 bg-zinc-800 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center mb-4">
              {tab === 'buddies' ? (
                <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
            <p className="text-sm font-semibold text-white">
              {tab === 'buddies' ? 'No buddies yet' : tab === 'unread' ? 'All caught up' : search ? `No results for "${search}"` : 'No conversations yet'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {tab === 'buddies' ? 'Star a conversation to add them as a buddy' : tab === 'unread' ? 'You\'ve read everything' : 'Start messaging someone you follow'}
            </p>
            {tab === 'all' && !search && (
              <button
                onClick={() => router.push('/search')}
                className="mt-5 px-5 py-2.5 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((convo) => {
              const name = convo.other_user_full_name || convo.other_user_username || '?';
              const isUnread = convo.unread_count > 0;
              const isBuddy = buddies.has(convo.id);
              return (
                <button
                  key={convo.id}
                  onClick={() => router.push(`/messages/${convo.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 active:bg-zinc-800/80 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    {convo.other_user_profile_picture ? (
                      <img
                        src={convo.other_user_profile_picture.replace(/^https?:\/\/[^/]+/, '')}
                        alt={name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar name={name} />
                    )}
                    {isOnline(convo.other_user_last_seen) && !isUnread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b]" />
                    )}
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-violet-600 flex items-center justify-center px-1">
                        <span className="text-[10px] font-black text-white leading-none">
                          {convo.unread_count > 9 ? '9+' : convo.unread_count}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-semibold text-zinc-300'}`}>
                        {name}
                      </p>
                      <span className="text-[11px] text-zinc-500 flex-shrink-0">
                        {timeAgo(convo.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${isUnread ? 'font-semibold text-zinc-300' : 'text-zinc-500'}`}>
                      {isOnline(convo.other_user_last_seen) && !convo.last_message_content ? (
                        <span className="text-emerald-400 font-semibold">● Online</span>
                      ) : (
                        convo.last_message_content || 'Start a conversation'
                      )}
                    </p>
                  </div>

                  {/* Star / Buddy toggle */}
                  <button
                    onClick={(e) => toggleBuddy(e, convo.id)}
                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-colors ${isBuddy ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                      fill={isBuddy ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
