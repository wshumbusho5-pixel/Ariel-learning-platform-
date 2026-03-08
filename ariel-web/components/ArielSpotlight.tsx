'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { aiChatAPI, cardsAPI, scraperAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import AuthModal from './AuthModal';

interface Message {
  id: string;
  sender: 'user' | 'ariel';
  text: string;
  cards?: { question: string; answer: string; explanation?: string }[];
  showChips?: boolean;
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '🙏'];
const SWIPE_THRESHOLD = 65;

const QUICK_CHIPS = [
  { label: '🎴 Make flashcards', prompt: 'Generate 5 flashcards for me on a topic I choose' },
  { label: '💡 Explain something', prompt: 'Explain a concept to me in simple terms' },
  { label: '🗓️ Study plan', prompt: 'Help me make a study plan for an upcoming exam' },
  { label: '⚡ Motivate me', prompt: 'Give me a quick motivational push to start studying right now' },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 font-black text-white text-xs shadow-md shadow-sky-500/20">
        A
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'rgba(28,28,48,0.9)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-sky-400/70 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function BubbleTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return <span className="text-[9px] opacity-40 ml-2 flex-shrink-0 self-end mb-0.5">{h12}:{m} {ampm}</span>;
}

export default function ArielSpotlight({ onClose }: { onClose?: () => void }) {
  const { isAuthenticated, login, checkAuth, user } = useAuth();
  const firstName = (user as any)?.full_name?.split(' ')[0] || user?.username || 'there';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ariel',
      text: `Hey ${firstName}! 👋 I'm Ariel, your AI study partner. I can make flashcards, explain concepts, build study plans, or just chat about what you're learning. What can I help you with today?`,
      showChips: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCards, setPendingCards] = useState<{ question: string; answer: string; explanation?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showKeyBanner, setShowKeyBanner] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Swipe-to-reply + reactions
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [swipeState, setSwipeState] = useState<{ id: string; x: number } | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [msgReactions, setMsgReactions] = useState<Record<string, string>>({});
  const touchStartRef = useRef<{ x: number; y: number; id: string; horizontal: boolean | null } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent, msgId: string) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: msgId, horizontal: null };
    longPressTimerRef.current = setTimeout(() => {
      setReactionPickerFor(msgId);
      if (navigator.vibrate) navigator.vibrate(40);
      touchStartRef.current = null;
    }, 480);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent, msgId: string) => {
    if (!touchStartRef.current || touchStartRef.current.id !== msgId) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    // Detect axis on first movement
    if (touchStartRef.current.horizontal === null && (Math.abs(dx) > 6 || dy > 6)) {
      touchStartRef.current.horizontal = Math.abs(dx) > dy;
    }

    if (!touchStartRef.current.horizontal) return; // vertical scroll — bail

    // Cancel long press if moving
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }

    if (dx > 0) {
      setSwipeState({ id: msgId, x: Math.min(dx, SWIPE_THRESHOLD + 20) });
    }
  }, []);

  const onTouchEnd = useCallback((msg: Message) => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (swipeState && swipeState.id === msg.id && swipeState.x >= SWIPE_THRESHOLD) {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(10);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setSwipeState(null);
    touchStartRef.current = null;
  }, [swipeState]);

  const pickReaction = useCallback((msgId: string, emoji: string) => {
    setMsgReactions(prev => prev[msgId] === emoji ? { ...prev, [msgId]: '' } : { ...prev, [msgId]: emoji });
    setReactionPickerFor(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const formatReply = (raw: any): string => {
    if (!raw) return "I'm here to help! Try asking me something else.";
    if (typeof raw === 'string') {
      const t = raw.trim();
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) return parsed.map((c: any) => `• ${c.question} — ${c.answer}`).join('\n');
          if (parsed.answer) return parsed.answer;
          return Object.values(parsed).join('\n');
        } catch { return raw; }
      }
      return raw;
    }
    if (Array.isArray(raw)) return raw.map((c: any) => `• ${c.question} — ${c.answer}`).join('\n');
    if (typeof raw === 'object' && raw.answer) return raw.answer;
    return String(raw);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const fullText = replyTo
      ? `[Replying to: "${replyTo.text.slice(0, 60)}${replyTo.text.length > 60 ? '…' : ''}"]\n${text.trim()}`
      : text.trim();
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setReplyTo(null);
    setLoading(true);
    setPendingCards([]);

    const context = messages
      .slice(-6)
      .map(m => `${m.sender === 'user' ? 'User' : 'Ariel'}: ${m.text}`)
      .join('\n');

    try {
      const res = await aiChatAPI.sendMessage(fullText, context || undefined);
      const replyText = formatReply(res?.reply);
      const cards = res?.cards && Array.isArray(res.cards) ? res.cards : [];
      if (cards.length > 0) setPendingCards(cards);
      const arielMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ariel',
        text: replyText,
        cards: cards.length > 0 ? cards : undefined,
      };
      setMessages(prev => [...prev, arielMsg]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || '';
      const isKeyError = err?.response?.status === 422 || detail.toLowerCase().includes('api') || detail.toLowerCase().includes('key') || detail.toLowerCase().includes('model') || detail.toLowerCase().includes('provider');
      if (isKeyError) {
        setShowKeyBanner(true);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ariel',
          text: "I need an AI provider key to answer that. Set one up below and I'll be ready to help!",
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ariel',
          text: "I'm having trouble reaching the server right now. Try again in a moment 🙏",
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCards = async (cards: { question: string; answer: string; explanation?: string }[]) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setSaving(true);
    try {
      await cardsAPI.createCardsBulk(
        cards.map(c => ({ question: c.question, answer: c.answer, explanation: c.explanation })),
        subject || undefined,
        topic || undefined
      );
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ariel',
        text: '✅ Saved to your deck! Head to My Deck to review them with spaced repetition.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ariel',
        text: 'Failed to save cards. Try again.',
      }]);
    } finally {
      setSaving(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const res = await scraperAPI.scrapeUrl(urlInput);
      if (res?.question_set && Array.isArray(res.question_set)) {
        const cards = res.question_set.map((q: any) => ({ question: q.question, answer: q.answer, explanation: q.explanation }));
        setPendingCards(cards);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ariel',
          text: `I've generated ${cards.length} flashcards from that link! 🎉 Want me to save them to your deck?`,
          cards,
        }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ariel', text: 'I scraped the URL but couldn\'t generate cards from it. Try a different link.' }]);
      }
      setUrlInput('');
      setShowUpload(false);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ariel', text: 'Failed to scrape that URL. Make sure it\'s a public page.' }]);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'pdf' | 'image') => {
    setUploading(true);
    setShowUpload(false);
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: `📎 Uploaded ${file.name}` }]);
    try {
      const res = type === 'pdf' ? await scraperAPI.uploadPdf(file) : await scraperAPI.uploadImage(file);
      if (res?.question_set && Array.isArray(res.question_set)) {
        const cards = res.question_set.map((q: any) => ({ question: q.question, answer: q.answer, explanation: q.explanation }));
        setPendingCards(cards);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ariel',
          text: `Nice! I pulled ${cards.length} flashcards from your ${type}. Want to save them to your deck?`,
          cards,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ariel', text: `Couldn't read that ${type}. Try a cleaner file.` }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (u, token) => { login(u, token); setShowAuthModal(false); await checkAuth(); }}
      />

      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        {onClose && (
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/25">
              A
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d14]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white leading-none">Ariel</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 tracking-wide">AI</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Study partner · always here</p>
          </div>
        </div>
        {/* Info dots */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{
          WebkitOverflowScrolling: 'touch',
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.06) 0%, #0d0d14 60%)',
        }}
      >
        {/* Date chip */}
        <div className="flex justify-center mb-5">
          <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-900/60 border border-zinc-800/60 rounded-full px-3 py-1 tracking-wide">
            Today
          </span>
        </div>

        {(() => {
          let seenMsgId: string | null = null;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'user') {
              const arielRepliedAfter = messages.slice(i + 1).some(m => m.sender === 'ariel');
              if (arielRepliedAfter || loading) { seenMsgId = messages[i].id; }
              break;
            }
          }

          return messages.map((msg, i) => {
            const isAriel = msg.sender === 'ariel';
            const prevSame = i > 0 && messages[i - 1].sender === msg.sender;
            const nextSame = i < messages.length - 1 && messages[i + 1].sender === msg.sender;
            // Tail = last bubble in a consecutive group
            const hasTail = !nextSame;

            return (
              <div key={msg.id} className={prevSame ? 'mt-0.5' : 'mt-4'}>
                {/* Swipe + long-press wrapper */}
                <div
                  className="relative select-none"
                  onTouchStart={e => onTouchStart(e, msg.id)}
                  onTouchMove={e => onTouchMove(e, msg.id)}
                  onTouchEnd={() => onTouchEnd(msg)}
                  onTouchCancel={() => { setSwipeState(null); if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                >
                  {/* Swipe reply arrow — appears behind bubble as it slides */}
                  {swipeState?.id === msg.id && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full ${isAriel ? 'left-9' : 'right-9'}`}
                      style={{
                        background: 'rgba(99,102,241,0.2)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        opacity: Math.min(swipeState.x / SWIPE_THRESHOLD, 1),
                      }}
                    >
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2 ${isAriel ? 'flex-row' : 'flex-row-reverse'}`}
                    style={{
                      transform: swipeState?.id === msg.id ? `translateX(${swipeState.x}px)` : 'translateX(0)',
                      transition: swipeState?.id === msg.id ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {/* Avatar */}
                    {isAriel ? (
                      <div className={`w-7 h-7 flex-shrink-0 ${hasTail ? '' : 'invisible'}`}>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-500/20">A</div>
                      </div>
                    ) : (
                      <div className="w-7 h-7 flex-shrink-0" />
                    )}

                    {/* Bubble */}
                    <div className="relative">
                      <div
                        className={`
                          max-w-[78%] text-sm leading-relaxed whitespace-pre-wrap break-words
                          ${isAriel
                            ? `text-zinc-100 ${hasTail ? 'rounded-2xl rounded-bl-[4px]' : prevSame ? 'rounded-2xl rounded-l-lg' : 'rounded-2xl'}`
                            : `text-white ${hasTail ? 'rounded-2xl rounded-br-[4px]' : prevSame ? 'rounded-2xl rounded-r-lg' : 'rounded-2xl'}`
                          }
                        `}
                        style={isAriel ? {
                          background: 'rgba(28,28,52,0.85)',
                          border: '1px solid rgba(99,102,241,0.18)',
                          padding: '10px 14px',
                        } : {
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                          padding: '10px 14px',
                        }}
                      >
                        <span>{msg.text}</span>
                        <BubbleTime />

                        {/* Generated cards */}
                        {msg.cards && msg.cards.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.cards.slice(0, 5).map((c, ci) => (
                              <div key={ci} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p className="text-xs font-bold text-white">{ci + 1}. {c.question}</p>
                                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{c.answer}</p>
                              </div>
                            ))}
                            <div className="pt-1 space-y-2">
                              <div className="flex gap-2">
                                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)"
                                  className="flex-1 text-xs text-white placeholder:text-zinc-500 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)"
                                  className="flex-1 text-xs text-white placeholder:text-zinc-500 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                              </div>
                              <button onClick={() => handleSaveCards(msg.cards!)} disabled={saving}
                                className="w-full py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors disabled:opacity-50 border border-white/20">
                                {saving ? 'Saving…' : '💾 Save to my deck'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reaction badge on bubble */}
                      {msgReactions[msg.id] && (
                        <button
                          onClick={() => pickReaction(msg.id, msgReactions[msg.id])}
                          className={`absolute -bottom-3 ${isAriel ? 'left-2' : 'right-2'} text-sm px-1.5 py-0.5 rounded-full`}
                          style={{ background: 'rgba(28,28,52,0.95)', border: '1px solid rgba(99,102,241,0.3)', lineHeight: 1.4 }}
                        >
                          {msgReactions[msg.id]}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reaction picker (long-press) */}
                  {reactionPickerFor === msg.id && (
                    <div
                      className={`absolute z-10 ${isAriel ? 'left-9' : 'right-0'} -top-12 flex items-center gap-1 px-2.5 py-2 rounded-2xl shadow-xl`}
                      style={{ background: 'rgba(28,28,52,0.98)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      {REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => pickReaction(msg.id, emoji)}
                          className="text-xl hover:scale-125 transition-transform active:scale-110 px-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => setReactionPickerFor(null)}
                        className="ml-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Seen receipt */}
                {!isAriel && msg.id === seenMsgId && (
                  <div className="flex justify-end items-center gap-1 pr-1 mt-1">
                    <span className="text-[9px] text-zinc-600">Seen</span>
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white" style={{ fontSize: '7px' }}>A</div>
                  </div>
                )}

                {/* Quick chips */}
                {msg.showChips && (
                  <div className="flex flex-wrap gap-2 pl-9 mt-3">
                    {QUICK_CHIPS.map(chip => (
                      <button key={chip.label} onClick={() => sendMessage(chip.prompt)} disabled={loading}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white transition-all whitespace-nowrap"
                        style={{ background: 'rgba(28,28,52,0.8)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}

        {/* Typing indicator */}
        {(loading || uploading) && <div className="mt-4"><TypingIndicator /></div>}

        <div ref={bottomRef} />
      </div>

      {/* AI key setup banner */}
      {showKeyBanner && (
        <div className="mx-4 mb-2 flex-shrink-0 bg-amber-900/20 border border-amber-700/40 rounded-2xl p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0">🔑</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-300 mb-0.5">AI key required</p>
              <p className="text-xs text-amber-200/70 leading-relaxed">Ariel needs an OpenAI or Anthropic key to think. It only takes 30 seconds to set up.</p>
              <div className="flex gap-2 mt-2">
                <a
                  href="https://platform.openai.com/settings/organization/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Get OpenAI key →
                </a>
                <span className="text-amber-700">·</span>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Get Anthropic key →
                </a>
              </div>
              <p className="text-xs text-amber-200/50 mt-1.5">Then go to <strong className="text-amber-300">Create Cards</strong> → AI Settings to paste your key.</p>
            </div>
            <button onClick={() => setShowKeyBanner(false)} className="text-amber-600 hover:text-amber-400 flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* URL input panel */}
      {showUpload && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="Paste a URL to generate flashcards..."
                className="flex-1 text-sm bg-zinc-800 text-white placeholder:text-zinc-600 rounded-xl px-3 py-2 focus:outline-none"
                disabled={uploading}
              />
              <button onClick={handleUrlSubmit} disabled={uploading || !urlInput.trim()} className="px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold disabled:opacity-50">
                Go
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'pdf'); }} />
                <div className="text-center py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">📄 PDF</div>
              </label>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); }} />
                <div className="text-center py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">📸 Image</div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3" style={{ background: 'rgba(13,13,20,0.97)', borderTop: '1px solid rgba(99,102,241,0.12)' }}>
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-0.5 h-9 rounded-full bg-indigo-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-indigo-400 mb-0.5">
                {replyTo.sender === 'ariel' ? 'Ariel' : 'You'}
              </p>
              <p className="text-[11px] text-zinc-500 truncate leading-snug">
                {replyTo.text.slice(0, 70)}{replyTo.text.length > 70 ? '…' : ''}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Attachment */}
          <button
            onClick={() => setShowUpload(v => !v)}
            className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all"
            style={{
              background: showUpload ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: showUpload ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: showUpload ? '#818cf8' : '#71717a',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Pill input */}
          <div
            className="flex-1 flex items-center px-4 h-10 transition-all"
            style={{
              background: 'rgba(28,28,52,0.7)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '999px',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Message Ariel…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              disabled={loading || uploading}
            />
          </div>

          {/* Send — only visible when there's text */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || uploading}
            className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
              input.trim()
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75 pointer-events-none'
            }`}
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
