'use client';

import { useState, useRef, useEffect } from 'react';
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

const QUICK_CHIPS = [
  { label: '🎴 Make flashcards', prompt: 'Generate 5 flashcards for me on a topic I choose' },
  { label: '💡 Explain something', prompt: 'Explain a concept to me in simple terms' },
  { label: '🗓️ Study plan', prompt: 'Help me make a study plan for an upcoming exam' },
  { label: '⚡ Motivate me', prompt: 'Give me a quick motivational push to start studying right now' },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 font-black text-white text-xs shadow-sm">
        A
      </div>
      <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
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

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setPendingCards([]);

    const context = messages
      .slice(-6)
      .map(m => `${m.sender === 'user' ? 'User' : 'Ariel'}: ${m.text}`)
      .join('\n');

    try {
      const res = await aiChatAPI.sendMessage(text.trim(), context || undefined);
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
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ariel',
        text: "I'm having trouble reaching the server right now. Try again in a moment 🙏",
      }]);
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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 flex-shrink-0">
        {onClose && (
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              A
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Ariel</p>
            <p className="text-[11px] text-green-400 mt-0.5">online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {(() => {
          // Find the last user message that Ariel has "seen" (has an Ariel reply after it, or Ariel is typing)
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
          const nextSame = i < messages.length - 1 && messages[i + 1].sender === msg.sender;

          return (
            <div key={msg.id}>
              <div className={`flex items-end gap-2 ${isAriel ? 'flex-row' : 'flex-row-reverse'} ${!nextSame ? 'mb-1' : 'mb-0.5'}`}>
                {/* Avatar — only on last in group */}
                {isAriel ? (
                  <div className={`w-7 h-7 flex-shrink-0 ${nextSame ? 'invisible' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs">A</div>
                  </div>
                ) : (
                  <div className="w-7 h-7 flex-shrink-0" />
                )}

                {/* Bubble */}
                <div className={`
                  max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
                  ${isAriel
                    ? 'bg-zinc-800 text-zinc-100 rounded-2xl ' + (nextSame ? 'rounded-bl-md' : 'rounded-bl-sm')
                    : 'bg-sky-500 text-white rounded-2xl ' + (nextSame ? 'rounded-br-md' : 'rounded-br-sm')
                  }
                `}>
                  {msg.text}

                  {/* Generated cards */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.cards.slice(0, 5).map((c, ci) => (
                        <div key={ci} className="bg-zinc-700/60 rounded-xl p-2.5">
                          <p className="text-xs font-bold text-white">{ci + 1}. {c.question}</p>
                          <p className="text-xs text-zinc-300 mt-1">{c.answer}</p>
                        </div>
                      ))}
                      <div className="pt-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Subject (optional)"
                            className="flex-1 text-xs bg-zinc-700/60 text-white placeholder:text-zinc-500 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                          />
                          <input
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="Topic (optional)"
                            className="flex-1 text-xs bg-zinc-700/60 text-white placeholder:text-zinc-500 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                          />
                        </div>
                        <button
                          onClick={() => handleSaveCards(msg.cards!)}
                          disabled={saving}
                          className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : '💾 Save to my deck'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seen receipt — Ariel's avatar under the last user message Ariel has read */}
              {!isAriel && msg.id === seenMsgId && (
                <div className="flex justify-end pr-1 mt-1 mb-1">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white" style={{ fontSize: '8px' }}>A</div>
                </div>
              )}

              {/* Quick chips after welcome message */}
              {msg.showChips && (
                <div className="flex flex-wrap gap-2 pl-9 mt-2 mb-3">
                  {QUICK_CHIPS.map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => sendMessage(chip.prompt)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 hover:border-sky-500/40 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-all whitespace-nowrap"
                    >
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
        {(loading || uploading) && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

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
      <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-800/60 bg-zinc-950">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowUpload(v => !v)}
            className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${showUpload ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 flex items-end bg-zinc-900 border border-zinc-700/60 rounded-2xl px-3.5 py-2 min-h-[38px] focus-within:border-sky-500/50 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Message Ariel..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              disabled={loading || uploading}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || uploading}
            className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-sky-500 hover:bg-sky-400' : 'bg-zinc-800'}`}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
