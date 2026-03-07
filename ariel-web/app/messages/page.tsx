'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { messagesAPI, socialAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_username?: string;
  other_user_full_name?: string;
  other_user_profile_picture?: string;
  other_user_is_verified: boolean;
  last_message_content?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  unread_count: number;
  is_archived: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_sent_by_current_user: boolean;
  sender_username?: string;
  created_at: string;
}

interface SearchUser {
  id: string;
  username: string;
  full_name?: string;
}

function timeAgo(d?: string) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const letter = name?.[0]?.toUpperCase() ?? '?';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Mobile: 'list' | 'thread'
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  // New conversation search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data);
    } catch {}
    setLoadingConvos(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for active conversation + poll
  const loadMessages = useCallback(async (convoId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const data = await messagesAPI.getMessages(convoId);
      setMessages(data.reverse());
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, unread_count: 0 } : c));
    } catch {}
    if (!silent) setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    if (!activeConvo) { clearInterval(pollRef.current!); return; }
    loadMessages(activeConvo.id);
    pollRef.current = setInterval(() => loadMessages(activeConvo.id, true), 5000);
    return () => clearInterval(pollRef.current!);
  }, [activeConvo, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (convo: Conversation) => {
    setActiveConvo(convo);
    setMobileView('thread');
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvo || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const msg = await messagesAPI.sendMessage(activeConvo.id, text);
      setMessages(prev => [...prev, msg]);
      setConversations(prev => prev.map(c =>
        c.id === activeConvo.id
          ? { ...c, last_message_content: text, last_message_at: new Date().toISOString() }
          : c
      ));
    } catch {}
    setSending(false);
  };

  // User search for new conversation
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await socialAPI.searchUsers(searchQuery, 10);
        setSearchResults(data);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const startConversation = async (userId: string) => {
    try {
      const { conversation_id } = await messagesAPI.getOrCreateConversation(userId);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      await loadConversations();
      const found = conversations.find(c => c.id === conversation_id);
      if (found) openConversation(found);
      else {
        const fresh = await messagesAPI.getConversations();
        setConversations(fresh);
        const c = fresh.find((c: Conversation) => c.id === conversation_id);
        if (c) openConversation(c);
      }
    } catch {}
  };

  // Group messages: insert timestamp when gap > 5 minutes
  const timedMessages = messages.reduce<{ showTime: boolean; msg: Message }[]>((acc, msg, i) => {
    const prev = messages[i - 1];
    const gap = prev
      ? (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000
      : 9999;
    acc.push({ showTime: gap > 5, msg });
    return acc;
  }, []);

  // ── Conversations list panel ──────────────────────────────────────────────

  const ConversationsList = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-base font-bold text-white">
          {user?.username ? `@${user.username}` : 'Messages'}
        </h1>
        <button
          onClick={() => setShowSearch(true)}
          className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loadingConvos ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded-full w-2/3" />
                  <div className="h-2.5 bg-zinc-800 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-300">No messages yet</p>
            <p className="text-xs text-zinc-600 mt-1">Start a conversation with someone</p>
            <button
              onClick={() => setShowSearch(true)}
              className="mt-4 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors"
            >
              New message
            </button>
          </div>
        ) : (
          conversations.map(convo => {
            const isActive = activeConvo?.id === convo.id;
            const name = convo.other_user_full_name || convo.other_user_username || '?';
            return (
              <button
                key={convo.id}
                onClick={() => openConversation(convo)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${
                  isActive ? 'bg-zinc-800/60' : 'hover:bg-zinc-900'
                }`}
              >
                <div className="relative">
                  <Avatar name={name} />
                  {convo.unread_count > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                      <span className="text-[9px] font-black text-white">{convo.unread_count > 9 ? '9+' : convo.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${convo.unread_count > 0 ? 'text-white' : 'text-zinc-300'}`}>
                      {name}
                    </p>
                    <span className="text-[11px] text-zinc-600 flex-shrink-0">{timeAgo(convo.last_message_at)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${convo.unread_count > 0 ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>
                    {convo.last_message_content || 'Start a conversation'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Thread panel ──────────────────────────────────────────────────────────

  const ThreadPanel = () => {
    if (!activeConvo) {
      return (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-400">Your messages</p>
          <p className="text-xs text-zinc-600">Select a conversation or start a new one</p>
          <button
            onClick={() => setShowSearch(true)}
            className="mt-1 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors"
          >
            New message
          </button>
        </div>
      );
    }

    const name = activeConvo.other_user_full_name || activeConvo.other_user_username || '?';
    const username = activeConvo.other_user_username;
    const lastSentIdx = [...messages].reverse().findIndex(m => m.is_sent_by_current_user);
    const lastSentId = lastSentIdx >= 0 ? [...messages].reverse()[lastSentIdx].id : null;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-black">

        {/* iMessage-style header: back | avatar+name centered | video+call */}
        <div className="flex-shrink-0 flex items-center px-3 py-3 border-b border-zinc-800/60 bg-black/95 backdrop-blur-sm">
          {/* Back (mobile) */}
          <button
            onClick={() => { setMobileView('list'); setActiveConvo(null); }}
            className="lg:hidden w-9 h-9 flex items-center justify-center text-sky-400 hover:text-sky-300 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Centered info */}
          <button
            onClick={() => router.push(`/profile/${activeConvo.other_user_id}`)}
            className="flex-1 flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            <Avatar name={name} size="sm" />
            <p className="text-xs font-semibold text-white leading-none mt-1">{name}</p>
            {username && <p className="text-[10px] text-zinc-500">@{username}</p>}
          </button>

          {/* Action icons right */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="w-9 h-9 flex items-center justify-center text-sky-400 hover:text-sky-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-sky-400 hover:text-sky-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loadingMsgs ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" />
            </div>
          ) : timedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Avatar name={name} size="lg" />
              <p className="text-sm font-semibold text-white mt-3">{name}</p>
              {username && <p className="text-xs text-zinc-600 mt-0.5">@{username}</p>}
              <p className="text-xs text-zinc-600 mt-3">No messages yet — say hello 👋</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {timedMessages.map(({ showTime, msg }, i) => {
                const isMine = msg.is_sent_by_current_user;
                const next = timedMessages[i + 1]?.msg;
                // Last in a consecutive group = next message is from different sender or has time gap
                const isLastInGroup = !next || next.is_sent_by_current_user !== isMine || timedMessages[i + 1]?.showTime;
                const isFirstInGroup = i === 0 || timedMessages[i - 1]?.msg.is_sent_by_current_user !== isMine || showTime;
                const isLastSent = msg.id === lastSentId;

                return (
                  <div key={msg.id}>
                    {/* Time label — only on gaps > 5 min */}
                    {showTime && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {formatDateLabel(msg.created_at) === 'Today'
                            ? formatTime(msg.created_at)
                            : `${formatDateLabel(msg.created_at)} ${formatTime(msg.created_at)}`
                          }
                        </span>
                      </div>
                    )}

                    <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-1' : 'mb-0.5'}`}>

                      {/* Bubble */}
                      <div className={`
                        max-w-[75%] px-3.5 py-2 text-sm leading-relaxed break-words
                        ${isMine ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-100'}
                        ${isFirstInGroup && isLastInGroup
                          ? 'rounded-2xl'
                          : isFirstInGroup
                          ? isMine ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
                          : isLastInGroup
                          ? isMine ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
                          : isMine ? 'rounded-l-2xl rounded-r-md' : 'rounded-r-2xl rounded-l-md'
                        }
                      `}>
                        {msg.content}
                      </div>
                    </div>

                    {/* Seen receipt — other person's avatar under last delivered message */}
                    {isLastSent && isLastInGroup && (
                      <div className="flex justify-end pr-1 mt-1 mb-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0" style={{ fontSize: '8px' }}>
                          {(name?.[0] ?? '?').toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* iMessage-style input bar */}
        <div className="flex-shrink-0 px-3 py-2.5 pb-safe border-t border-zinc-800/60 bg-black">
          <div className="flex items-end gap-2">
            {/* + button */}
            <button className="w-8 h-8 flex-shrink-0 mb-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Text field */}
            <div className="flex-1 flex items-end bg-zinc-900 border border-zinc-700/60 rounded-2xl px-3.5 py-2 min-h-[38px]">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="iMessage"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none"
              />
            </div>

            {/* Send / mic button */}
            <button
              onClick={input.trim() ? handleSend : undefined}
              disabled={sending}
              className={`w-8 h-8 flex-shrink-0 mb-0.5 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                input.trim() ? 'bg-sky-500 hover:bg-sky-400' : 'bg-zinc-800'
              }`}
            >
              {sending ? (
                <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : input.trim() ? (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SideNav />
      <div className="fixed inset-0 lg:left-[72px] bg-black flex flex-col">

        {/* ── Two-panel layout ─────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: conversations list */}
          <div className={`
            w-full lg:w-[320px] lg:flex-shrink-0 lg:border-r lg:border-zinc-800
            ${mobileView === 'thread' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}
          `}>
            <ConversationsList />
          </div>

          {/* Right: thread */}
          <div className={`
            flex-1 flex flex-col min-h-0
            ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
          `}>
            <ThreadPanel />
          </div>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <BottomNav />
        </div>
      </div>

      {/* ── New message modal ─────────────────────────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md flex flex-col max-h-[60vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              {searching && <div className="w-4 h-4 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin flex-shrink-0" />}
            </div>

            <div className="overflow-y-auto flex-1">
              {searchResults.length === 0 && searchQuery.trim() && !searching && (
                <p className="text-sm text-zinc-600 text-center py-8">No users found</p>
              )}
              {searchResults.length === 0 && !searchQuery.trim() && (
                <p className="text-xs text-zinc-700 text-center py-8">Type a username to search</p>
              )}
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-800 transition-colors text-left"
                >
                  <Avatar name={u.username} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-white">{u.full_name || u.username}</p>
                    {u.full_name && <p className="text-xs text-zinc-600">@{u.username}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
