'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { messagesAPI, cardsAPI, authAPI } from '@/lib/api';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  shared_card_id?: string;
  shared_reel_id?: string;
  is_sent_by_current_user: boolean;
  sender_username?: string;
  sender_full_name?: string;
  sender_profile_picture?: string;
  reply_to_message_id?: string;
  reply_to_content?: string;
  reply_to_sender_username?: string;
  reactions: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

interface ConversationInfo {
  id: string;
  other_user_id: string;
  other_user_username?: string;
  other_user_full_name?: string;
  other_user_profile_picture?: string;
  other_user_last_seen?: string;
}

// Online = last_seen within 2 minutes
function isOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

function lastSeenLabel(lastSeen?: string): string {
  if (!lastSeen) return '';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Online';
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  return `Active ${Math.floor(hrs / 24)}d ago`;
}

interface ReplyTarget {
  id: string;
  content: string;
  username: string;
}

// ─── Emoji grid ────────────────────────────────────────────────
const EMOJIS = [
  '😀','😂','🥰','😍','🤣','😊','😭','😤','🥺','😎',
  '🤩','🥳','😏','😢','😮','🤔','🙄','😬','🤗','😴',
  '🤤','😷','🤒','😈','👿','💀','👻','🙈','🙉','🙊',
  '💪','👏','🤝','👍','👎','❤️','🧡','💛','💚','💙',
  '💜','🖤','🤍','💯','🔥','✨','💫','⭐','🌟','💥',
  '🎉','🎊','🎈','🎁','🎶','🎵','👑','💎','🏆','🥇',
  '🚀','🌈','☀️','🌙','⚡','🌸','🍕','🍔','🌮','🍦',
  '🎂','☕','🧋','🥤','😺','😸','🐶','🐱','🦋','🌺',
];

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

// ─── Read receipt checkmarks (WhatsApp-style) ──────────────────
function ReadReceipt({ isRead, isOptimistic }: { isRead: boolean; isOptimistic: boolean }) {
  if (isOptimistic) {
    // Single gray clock = sending
    return (
      <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (isRead) {
    // Double violet tick = read
    return (
      <svg className="w-4 h-3.5 text-violet-500" viewBox="0 0 20 14" fill="none">
        <path d="M1 7l5 5L15 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 7l5 5L20 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Double gray tick = delivered (received but not opened)
  return (
    <svg className="w-4 h-3.5 text-zinc-600" viewBox="0 0 20 14" fill="none">
      <path d="M1 7l5 5L15 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7l5 5L20 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Avatar({ name, src, size = 'sm' }: { name?: string; src?: string; size?: 'sm' | 'md' }) {
  const [broken, setBroken] = useState(false);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  if (src && !broken) {
    return <img src={src.replace(/^https?:\/\/[^/]+/, '')} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} onError={() => setBroken(true)} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 flex-shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [convoInfo, setConvoInfo] = useState<ConversationInfo | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'cards' | 'reels'>('cards');
  const [pickerCards, setPickerCards] = useState<{ id: string; question: string; subject?: string }[]>([]);
  const [pickerReels, setPickerReels] = useState<{ id: string; title: string; thumbnail_url?: string; creator_username: string }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presencePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data: MessageItem[] = await messagesAPI.getMessages(conversationId, 100);
      setMessages(data);
    } catch {}
    if (!silent) setLoading(false);
  }, [conversationId]);

  const loadConvoInfo = useCallback(async () => {
    try {
      const convos = await messagesAPI.getConversations();
      const found = convos.find((c: ConversationInfo) => c.id === conversationId);
      if (found) setConvoInfo(found);
    } catch {}
  }, [conversationId]);

  useEffect(() => { loadConvoInfo(); }, [loadConvoInfo]);

  useEffect(() => {
    loadMessages(false);
    // Poll messages every 5s
    pollRef.current = setInterval(() => loadMessages(true), 5000);
    // Poll presence every 30s (to update "online" status of other user)
    presencePollRef.current = setInterval(() => loadConvoInfo(), 30000);
    // Send heartbeat immediately then every 30s
    authAPI.heartbeat().catch(() => {});
    heartbeatRef.current = setInterval(() => authAPI.heartbeat().catch(() => {}), 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (presencePollRef.current) clearInterval(presencePollRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [loadMessages, loadConvoInfo]);

  useEffect(() => { scrollToBottom('smooth'); }, [messages, scrollToBottom]);
  useEffect(() => { if (!loading) scrollToBottom('instant' as ScrollBehavior); }, [loading, scrollToBottom]);

  // ── Send ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    const replyId = replyTo?.id;
    setInput('');
    setReplyTo(null);
    setShowEmoji(false);
    setSending(true);

    const optimistic: MessageItem = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'me',
      receiver_id: '',
      content: text,
      message_type: 'text',
      is_sent_by_current_user: true,
      reply_to_message_id: replyId,
      reply_to_content: replyTo?.content,
      reply_to_sender_username: replyTo?.username,
      reactions: {},
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const sent: MessageItem = await messagesAPI.sendMessage(conversationId, text, 'text', undefined, undefined, replyId);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
      if (replyId) setReplyTo(replyTo);
    }
    setSending(false);
  };

  // ── Load picker content ───────────────────────────────────────
  const openPicker = async () => {
    setShowPicker(true);
    setShowEmoji(false);
    setSelectedMsgId(null);
    if (pickerCards.length > 0 || pickerReels.length > 0) return; // already loaded
    setPickerLoading(true);
    try {
      const [cards, reelsRes] = await Promise.all([
        cardsAPI.getTrendingCards(20).catch(() => []),
        api.get('/api/reels/feed?limit=20').then(r => r.data).catch(() => []),
      ]);
      setPickerCards(cards);
      setPickerReels(reelsRes.filter((r: { video_url?: string }) => r.video_url));
    } finally {
      setPickerLoading(false);
    }
  };

  const handleSendCard = async (card: { id: string; question: string; subject?: string }) => {
    setShowPicker(false);
    const optimistic: MessageItem = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'me',
      receiver_id: '',
      content: `Shared a card: "${card.question}"`,
      message_type: 'card_share',
      shared_card_id: card.id,
      reactions: {},
      is_read: false,
      is_sent_by_current_user: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const sent = await messagesAPI.sendMessage(conversationId, `Shared a card: "${card.question}"`, 'card_share', undefined, card.id);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...sent, shared_card_id: card.id } : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  const handleSendReel = async (reel: { id: string; title: string; thumbnail_url?: string; creator_username: string }) => {
    setShowPicker(false);
    const optimistic: MessageItem = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'me',
      receiver_id: '',
      content: `Shared a video: "${reel.title}"`,
      message_type: 'reel_share',
      shared_reel_id: reel.id,
      reactions: {},
      is_read: false,
      is_sent_by_current_user: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const sent = await messagesAPI.sendMessage(conversationId, `Shared a video: "${reel.title}"`, 'reel_share', undefined, undefined, undefined, reel.id);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...sent, shared_reel_id: reel.id } : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  // ── Double-tap to react ───────────────────────────────────────
  const handleTap = (msg: MessageItem) => {
    const now = Date.now();
    const last = lastTapRef.current[msg.id] || 0;
    if (now - last < 300) {
      // Double tap → react
      handleReact(msg.id);
      lastTapRef.current[msg.id] = 0;
    } else {
      lastTapRef.current[msg.id] = now;
      // Single tap → select for actions
      setSelectedMsgId(prev => prev === msg.id ? null : msg.id);
      setShowEmoji(false);
    }
  };

  const handleReact = async (msgId: string) => {
    // Optimistic toggle
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = { ...m.reactions };
      const myKey = 'me';
      if (reactions[myKey]) delete reactions[myKey];
      else reactions[myKey] = '❤️';
      return { ...m, reactions };
    }));
    try {
      const res = await messagesAPI.reactToMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: res.reactions } : m));
    } catch {}
  };

  const handleReply = (msg: MessageItem) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      username: msg.sender_username || msg.sender_full_name || (msg.is_sent_by_current_user ? 'You' : 'Them'),
    });
    setSelectedMsgId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') { setReplyTo(null); setShowEmoji(false); setSelectedMsgId(null); }
  };

  // ── Group messages ────────────────────────────────────────────
  const grouped = messages.reduce<{ showDateLabel: boolean; showTime: boolean; msg: MessageItem }[]>(
    (acc, msg, i) => {
      const prev = messages[i - 1];
      const gap = prev ? (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000 : 9999;
      const newDay = prev ? formatDateLabel(msg.created_at) !== formatDateLabel(prev.created_at) : true;
      acc.push({ showDateLabel: newDay, showTime: gap > 5 && !newDay, msg });
      return acc;
    }, []
  );

  const otherName = convoInfo?.other_user_full_name || convoInfo?.other_user_username || 'Chat';
  const otherUsername = convoInfo?.other_user_username;

  return (
    <>
      <SideNav />
      <div
        className="fixed inset-0 lg:left-[72px] bg-[#09090b] flex flex-col"
        onClick={() => { setSelectedMsgId(null); setShowEmoji(false); setShowPicker(false); }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-3 h-14 border-b border-zinc-800 bg-[#09090b] z-10">
          <button onClick={() => router.push('/messages')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800/60 flex-shrink-0" aria-label="Back to Rooms">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Avatar with online ring */}
            <div className="relative flex-shrink-0">
              <Avatar name={otherName} src={convoInfo?.other_user_profile_picture} size="sm" />
              {isOnline(convoInfo?.other_user_last_seen) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#09090b] animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{otherName}</p>
              <p className={`text-[11px] font-medium ${isOnline(convoInfo?.other_user_last_seen) ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {lastSeenLabel(convoInfo?.other_user_last_seen) || (otherUsername ? `@${otherUsername}` : '')}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Avatar name={otherName} src={convoInfo?.other_user_profile_picture} size="md" />
              <p className="text-sm font-bold text-white mt-3">{otherName}</p>
              {otherUsername && <p className="text-xs text-zinc-500 mt-0.5">@{otherUsername}</p>}
              <p className="text-xs text-zinc-500 mt-3">No messages yet — say hello 👋</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {grouped.map(({ showDateLabel, showTime, msg }, i) => {
                const isMine = msg.is_sent_by_current_user;
                const next = grouped[i + 1]?.msg;
                const isLastInGroup = !next || next.is_sent_by_current_user !== isMine || grouped[i + 1]?.showTime || grouped[i + 1]?.showDateLabel;
                const isFirstInGroup = i === 0 || grouped[i - 1]?.msg.is_sent_by_current_user !== isMine || showTime || showDateLabel;
                const isSelected = selectedMsgId === msg.id;
                const heartCount = Object.keys(msg.reactions || {}).length;
                const iHearted = Object.values(msg.reactions || {}).length > 0 && (msg.reactions['me'] || false);

                return (
                  <div key={msg.id}>
                    {/* Date label */}
                    {showDateLabel && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] text-zinc-500 font-medium bg-zinc-900 px-3 py-1 rounded-full">
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}
                    {/* Time label */}
                    {showTime && !showDateLabel && (
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] text-zinc-600 font-medium">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message row */}
                    <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-1' : 'mb-0.5'}`}>
                      {/* Bubble */}
                      <div className="relative max-w-[75%]">
                        {/* Action bar on select */}
                        {isSelected && (
                          <div
                            className={`absolute ${isMine ? 'right-full mr-2' : 'left-full ml-2'} bottom-0 flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl px-2 py-1.5 z-20`}
                            onClick={e => e.stopPropagation()}
                          >
                            <button onClick={() => handleReact(msg.id)} className="text-lg hover:scale-125 transition-transform">
                              {iHearted ? '❤️' : '🤍'}
                            </button>
                            <div className="w-px h-4 bg-zinc-700 mx-0.5" />
                            <button onClick={() => handleReply(msg)} className="flex items-center gap-1 text-xs font-semibold text-violet-400 px-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Reply
                            </button>
                          </div>
                        )}

                        <button
                          onClick={e => { e.stopPropagation(); handleTap(msg); }}
                          className={`
                            block w-full text-left px-3.5 py-2 text-sm leading-relaxed break-words animate-fadeIn
                            ${isMine ? 'bg-gradient-to-br from-violet-500 to-violet-700 text-white' : 'bg-zinc-800 text-zinc-100'}
                            ${isFirstInGroup && isLastInGroup ? 'rounded-2xl'
                              : isFirstInGroup ? isMine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                              : isLastInGroup ? isMine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
                              : isMine ? 'rounded-l-2xl rounded-r-sm' : 'rounded-r-2xl rounded-l-sm'}
                          `}
                        >
                          {/* Reply preview */}
                          {msg.reply_to_content && (
                            <div className={`mb-1.5 px-2.5 py-1.5 rounded-xl text-xs border-l-2 ${isMine ? 'bg-black/45 border-white/30 text-white/70' : 'bg-zinc-900 border-violet-400 text-zinc-400'}`}>
                              <p className="font-bold mb-0.5">{msg.reply_to_sender_username || 'Unknown'}</p>
                              <p className="truncate">{msg.reply_to_content}</p>
                            </div>
                          )}

                          {/* Card share preview */}
                          {msg.message_type === 'card_share' && msg.shared_card_id && (
                            <a
                              href={`/cards/${msg.shared_card_id}`}
                              onClick={e => e.stopPropagation()}
                              className={`block mb-2 rounded-xl overflow-hidden border ${isMine ? 'border-white/20 bg-white/10' : 'border-violet-500/20 bg-violet-500/10'}`}
                            >
                              <div className={`px-3 py-2.5 flex items-center gap-2`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMine ? 'bg-white/20' : 'bg-violet-500/20'}`}>
                                  <svg className={`w-4 h-4 ${isMine ? 'text-white' : 'text-violet-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-[10px] font-bold uppercase tracking-wide ${isMine ? 'text-white/60' : 'text-violet-400'}`}>Flash Card</p>
                                  <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-violet-300'}`}>Tap to study</p>
                                </div>
                              </div>
                            </a>
                          )}

                          {/* Reel share preview */}
                          {msg.message_type === 'reel_share' && msg.shared_reel_id && (
                            <a
                              href={`/reels/${msg.shared_reel_id}`}
                              onClick={e => e.stopPropagation()}
                              className={`block mb-2 rounded-xl overflow-hidden border ${isMine ? 'border-white/20 bg-white/10' : 'border-violet-500/20 bg-violet-500/10'}`}
                            >
                              <div className="px-3 py-2.5 flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMine ? 'bg-white/20' : 'bg-violet-500/20'}`}>
                                  <svg className={`w-4 h-4 ${isMine ? 'text-white' : 'text-violet-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-[10px] font-bold uppercase tracking-wide ${isMine ? 'text-white/60' : 'text-violet-400'}`}>Video Clip</p>
                                  <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-violet-300'}`}>Tap to watch</p>
                                </div>
                              </div>
                            </a>
                          )}

                          {msg.content}
                        </button>

                        {/* Heart reaction badge */}
                        {heartCount > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleReact(msg.id); }}
                            className={`absolute -bottom-3 ${isMine ? 'left-2' : 'right-2'} flex items-center gap-0.5 bg-zinc-900 border border-zinc-700 rounded-full px-1.5 py-0.5 shadow-sm text-xs`}
                          >
                            <span>❤️</span>
                            {heartCount > 1 && <span className="text-zinc-400 font-semibold">{heartCount}</span>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timestamp + read receipt */}
                    {isLastInGroup && (
                      <div className={`flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-2 mt-1`}>
                        <span className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</span>
                        {isMine && (
                          <ReadReceipt isRead={msg.is_read} isOptimistic={msg.id.startsWith('optimistic-')} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Content picker — cards & reels */}
        {showPicker && (
          <div className="flex-shrink-0 border-t border-zinc-800 bg-[#0c0c0e]" onClick={e => e.stopPropagation()}>
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 px-3 pt-2">
              {(['cards', 'reels'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPickerTab(tab)}
                  className={`px-4 py-2 text-xs font-bold capitalize border-b-2 transition-colors ${pickerTab === tab ? 'border-violet-600 text-violet-400' : 'border-transparent text-zinc-500'}`}
                >
                  {tab === 'cards' ? 'Flash Cards' : 'Videos'}
                </button>
              ))}
              <button onClick={() => setShowPicker(false)} className="ml-auto text-zinc-600 hover:text-zinc-400 p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {pickerLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : pickerTab === 'cards' ? (
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-2 px-3 py-3" style={{ width: 'max-content' }}>
                  {pickerCards.length === 0 ? (
                    <p className="text-xs text-zinc-500 px-2 py-4">No cards found</p>
                  ) : pickerCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleSendCard(card)}
                      className="flex-shrink-0 w-40 text-left bg-zinc-800/60 border border-zinc-700 rounded-2xl p-3 active:scale-95 transition-transform"
                    >
                      {card.subject && (
                        <span className="text-[9px] font-bold text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full">{card.subject}</span>
                      )}
                      <p className="text-xs font-semibold text-zinc-200 mt-1.5 line-clamp-3 leading-snug">{card.question}</p>
                      <p className="text-[10px] text-violet-400 font-bold mt-2">Tap to send</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-2 px-3 py-3" style={{ width: 'max-content' }}>
                  {pickerReels.length === 0 ? (
                    <p className="text-xs text-zinc-500 px-2 py-4">No videos found</p>
                  ) : pickerReels.map(reel => (
                    <button
                      key={reel.id}
                      onClick={() => handleSendReel(reel)}
                      className="flex-shrink-0 w-28 text-left active:scale-95 transition-transform"
                    >
                      <div className="w-28 rounded-xl overflow-hidden bg-zinc-200" style={{ aspectRatio: '9/16' }}>
                        {reel.thumbnail_url ? (
                          <img src={reel.thumbnail_url.replace(/^https?:\/\/[^/]+/, '')} alt={reel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-200">
                            <svg className="w-6 h-6 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-200 mt-1.5 line-clamp-2 leading-snug">{reel.title}</p>
                      <p className="text-[10px] text-violet-400 font-bold mt-0.5">Tap to send</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Emoji picker */}
        {showEmoji && (
          <div className="flex-shrink-0 border-t border-zinc-800 bg-[#0c0c0e]" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-10 gap-0 px-2 py-2 max-h-40 overflow-y-auto">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setInput(prev => prev + emoji); inputRef.current?.focus(); }}
                  className="text-xl p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply bar */}
        {replyTo && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-t border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="w-0.5 h-8 bg-violet-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-violet-400">{replyTo.username}</p>
              <p className="text-xs text-zinc-400 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-zinc-300 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 px-3 py-2 pb-[84px] lg:pb-3 border-t border-zinc-800 bg-[#09090b]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {/* Emoji toggle */}
            <button
              onClick={() => { setShowEmoji(v => !v); setSelectedMsgId(null); setShowPicker(false); }}
              className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors ${showEmoji ? 'bg-violet-500/20 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <span className="text-xl">😊</span>
            </button>

            {/* Share content button */}
            <button
              onClick={() => { openPicker(); setShowEmoji(false); }}
              className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors ${showPicker ? 'bg-violet-500/20 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Share a card or video"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmoji(false)}
              placeholder="Message..."
              className="flex-1 bg-zinc-800 rounded-full px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              style={{ color: 'white', caretColor: 'white' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${input.trim() && !sending ? 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800' : 'bg-zinc-800'}`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-violet-600 rounded-full animate-spin" />
              ) : (
                <svg className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-zinc-600'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
