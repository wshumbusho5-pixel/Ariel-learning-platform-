'use client';

import { useState, useEffect } from 'react';
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
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.heartbeat().catch(() => {});
    messagesAPI.getConversations()
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] pb-24 lg:pl-[72px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#09090b] border-b border-zinc-800 flex items-center justify-between px-4 h-14">
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
            title="New message"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
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
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">No conversations yet</p>
            <p className="text-xs text-zinc-500 mt-1">Start messaging someone you follow</p>
            <button
              onClick={() => router.push('/search')}
              className="mt-5 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((convo) => {
              const name = convo.other_user_full_name || convo.other_user_username || '?';
              const isUnread = convo.unread_count > 0;
              return (
                <button
                  key={convo.id}
                  onClick={() => router.push(`/messages/${convo.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
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
                      <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                        {name}
                      </p>
                      <span className="text-[11px] text-zinc-600 flex-shrink-0">
                        {timeAgo(convo.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${isUnread ? 'font-semibold text-zinc-300' : 'text-zinc-600'}`}>
                      {isOnline(convo.other_user_last_seen) && !convo.last_message_content ? (
                        <span className="text-emerald-400 font-semibold">● Online</span>
                      ) : (
                        convo.last_message_content || 'Start a conversation'
                      )}
                    </p>
                  </div>
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
