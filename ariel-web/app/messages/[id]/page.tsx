'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { messagesAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
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

function Avatar({ name, src, size = 'sm' }: { name?: string; src?: string; size?: 'sm' | 'md' }) {
  const [broken, setBroken] = useState(false);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  if (src && !broken) {
    return <img src={src.replace(/^https?:\/\/[^/]+/, '')} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} onError={() => setBroken(true)} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0`}>
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

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  useEffect(() => {
    messagesAPI.getConversations()
      .then(convos => {
        const found = convos.find((c: ConversationInfo) => c.id === conversationId);
        if (found) setConvoInfo(found);
      })
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    loadMessages(false);
    pollRef.current = setInterval(() => loadMessages(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

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
        className="fixed inset-0 lg:left-[72px] bg-white flex flex-col"
        onClick={() => { setSelectedMsgId(null); setShowEmoji(false); }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-3 h-14 border-b border-gray-100 bg-white z-10">
          <button onClick={() => router.push('/messages')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0">
            <svg className="w-5 h-5 text-zinc-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar name={otherName} src={convoInfo?.other_user_profile_picture} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-zinc-900 truncate">{otherName}</p>
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              </div>
              {otherUsername && <p className="text-[11px] text-gray-400">@{otherUsername}</p>}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Avatar name={otherName} src={convoInfo?.other_user_profile_picture} size="md" />
              <p className="text-sm font-bold text-zinc-900 mt-3">{otherName}</p>
              {otherUsername && <p className="text-xs text-gray-400 mt-0.5">@{otherUsername}</p>}
              <p className="text-xs text-gray-400 mt-3">No messages yet — say hello 👋</p>
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
                        <span className="text-[11px] text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full">
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}
                    {/* Time label */}
                    {showTime && !showDateLabel && (
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] text-gray-400 font-medium">
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
                            className={`absolute ${isMine ? 'right-full mr-2' : 'left-full ml-2'} bottom-0 flex items-center gap-1 bg-white border border-gray-200 rounded-2xl shadow-lg px-2 py-1.5 z-20`}
                            onClick={e => e.stopPropagation()}
                          >
                            <button onClick={() => handleReact(msg.id)} className="text-lg hover:scale-125 transition-transform">
                              {iHearted ? '❤️' : '🤍'}
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-0.5" />
                            <button onClick={() => handleReply(msg)} className="flex items-center gap-1 text-xs font-semibold text-violet-600 px-1">
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
                            block w-full text-left px-3.5 py-2 text-sm leading-relaxed break-words
                            ${isMine ? 'bg-violet-600 text-white' : 'bg-gray-100 text-zinc-800'}
                            ${isFirstInGroup && isLastInGroup ? 'rounded-2xl'
                              : isFirstInGroup ? isMine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                              : isLastInGroup ? isMine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
                              : isMine ? 'rounded-l-2xl rounded-r-sm' : 'rounded-r-2xl rounded-l-sm'}
                          `}
                        >
                          {/* Reply preview */}
                          {msg.reply_to_content && (
                            <div className={`mb-1.5 px-2.5 py-1.5 rounded-xl text-xs border-l-2 ${isMine ? 'bg-violet-500/40 border-white/60 text-white/80' : 'bg-gray-200 border-violet-400 text-zinc-500'}`}>
                              <p className="font-bold mb-0.5">{msg.reply_to_sender_username || 'Unknown'}</p>
                              <p className="truncate">{msg.reply_to_content}</p>
                            </div>
                          )}
                          {msg.content}
                        </button>

                        {/* Heart reaction badge */}
                        {heartCount > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleReact(msg.id); }}
                            className={`absolute -bottom-3 ${isMine ? 'left-2' : 'right-2'} flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm text-xs`}
                          >
                            <span>❤️</span>
                            {heartCount > 1 && <span className="text-zinc-500 font-semibold">{heartCount}</span>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timestamp under last message */}
                    {isLastInGroup && (
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-2 mt-1`}>
                        <span className="text-[10px] text-gray-300">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Emoji picker */}
        {showEmoji && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-10 gap-0 px-2 py-2 max-h-40 overflow-y-auto">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setInput(prev => prev + emoji); inputRef.current?.focus(); }}
                  className="text-xl p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply bar */}
        {replyTo && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-50 border-t border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="w-0.5 h-8 bg-violet-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-violet-600">{replyTo.username}</p>
              <p className="text-xs text-zinc-500 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 px-3 py-2 pb-[84px] lg:pb-3 border-t border-gray-100 bg-white" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {/* Emoji toggle */}
            <button
              onClick={() => { setShowEmoji(v => !v); setSelectedMsgId(null); }}
              className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors ${showEmoji ? 'bg-violet-100 text-violet-600' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <span className="text-xl">😊</span>
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmoji(false)}
              placeholder="Message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${input.trim() && !sending ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-100'}`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin" />
              ) : (
                <svg className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
