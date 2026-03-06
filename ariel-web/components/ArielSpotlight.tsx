'use client';

import { useState } from 'react';
import { aiChatAPI, cardsAPI, scraperAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import AuthModal from './AuthModal';
import { useEffect } from 'react';

interface PromptOption {
  label: string;
  prompt: string;
  icon: string;
}

const prompts: PromptOption[] = [
  { label: 'Create flashcards', prompt: 'Generate 5 flashcards (question, answer, brief explanation) for high school biology on cell structures. Return JSON cards array.', icon: '🎴' },
  { label: 'Explain a concept', prompt: 'Explain photosynthesis in simple steps for a 10th grader.', icon: '💡' },
  { label: 'Study plan', prompt: 'Make a 3-day cram plan for my math quiz on algebra.', icon: '🗓️' },
  { label: 'Motivation', prompt: 'Give me a quick pep talk to start studying right now.', icon: '⚡' },
];

export default function ArielSpotlight() {
  const [reply, setReply] = useState<string>('Ask me anything or tap a prompt to get started.');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [generatedCards, setGeneratedCards] = useState<{ question: string; answer: string; explanation?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const { isAuthenticated, login, checkAuth } = useAuth();
  const [history, setHistory] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const formatReply = (raw: any) => {
    if (!raw) return "I'm here to help! Try another prompt.";

    const stringifyCards = (cards: any[]) => {
      return cards
        .filter(c => c && c.question && c.answer)
        .slice(0, 5)
        .map((c, idx) => `${idx + 1}) ${c.question} — ${c.answer}`)
        .join(' | ');
    };

    const normalizeObject = (obj: Record<string, any>) => {
      if (Array.isArray(obj.cards)) {
        const cardsText = stringifyCards(obj.cards);
        const ans = obj.answer || 'Here are your flashcards:';
        return cardsText ? `${ans} ${cardsText}` : ans;
      }
      return Object.values(obj).join('; ');
    };

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.join('; ');
          if (typeof parsed === 'object') return normalizeObject(parsed);
        } catch {
          // fall through
        }
      }
      return raw;
    }
    if (Array.isArray(raw)) return raw.join('; ');
    if (typeof raw === 'object') return normalizeObject(raw);
    return String(raw);
  };

  const sendPrompt = async (prompt: string) => {
    if (loading) return;
    setLoading(true);
    setGeneratedCards([]);
    const context = history
      .slice(-6)
      .map((m) => `${m.sender === 'user' ? 'User' : 'Ariel'}: ${m.text}`)
      .join('\n');
    setHistory((prev) => [...prev, { sender: 'user', text: prompt }]);
    try {
      const res = await aiChatAPI.sendMessage(prompt, context || undefined);
      setReply(formatReply(res?.reply));
      if (res?.cards && Array.isArray(res.cards)) {
        setGeneratedCards(res.cards);
      }
      setHistory((prev) => [...prev, { sender: 'bot', text: formatReply(res?.reply) }]);
    } catch (error) {
      setReply("I'm having trouble reaching the server. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCards = async () => {
    if (!generatedCards.length) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSaving(true);
    try {
      await cardsAPI.createCardsBulk(
        generatedCards.map(c => ({
          question: c.question,
          answer: c.answer,
          explanation: c.explanation,
        })),
        subject || undefined,
        topic || undefined
      );
      setReply('Saved to your deck! Check My Deck to review them.');
    } catch (error: any) {
      setReply(error?.response?.data?.detail || 'Failed to save cards.');
    } finally {
      setSaving(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    setGeneratedCards([]);
    try {
      const res = await scraperAPI.scrapeUrl(urlInput);
      if (res?.question_set && Array.isArray(res.question_set)) {
        const cards = res.question_set.map((q: any) => ({
          question: q.question,
          answer: q.answer,
          explanation: q.explanation,
        }));
        setGeneratedCards(cards);
        setReply(`Generated ${cards.length} flashcards from the URL!`);
      } else {
        setReply('Successfully scraped URL, but no cards were generated.');
      }
      setUrlInput('');
      setShowUploadOptions(false);
    } catch (error: any) {
      setReply(error?.response?.data?.detail || 'Failed to scrape URL. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'pdf' | 'image') => {
    setUploading(true);
    setGeneratedCards([]);
    try {
      const res = type === 'pdf' ? await scraperAPI.uploadPdf(file) : await scraperAPI.uploadImage(file);
      if (res?.question_set && Array.isArray(res.question_set)) {
        const cards = res.question_set.map((q: any) => ({
          question: q.question,
          answer: q.answer,
          explanation: q.explanation,
        }));
        setGeneratedCards(cards);
        setReply(`Generated ${cards.length} flashcards from your ${type}!`);
      } else {
        setReply(`Successfully uploaded ${type}, but no cards were generated.`);
      }
      setShowUploadOptions(false);
    } catch (error: any) {
      setReply(error?.response?.data?.detail || `Failed to upload ${type}. Try again.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 text-white rounded-2xl overflow-hidden">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (user, token) => {
          login(user, token);
          setShowAuthModal(false);
          await checkAuth();
        }}
      />
      <div className="p-6 md:p-8 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Ask Ariel</h2>
            <p className="text-sm text-white/85 mt-1">Generate flashcards, get explanations, build study plans.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">✨</div>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-white/90 whitespace-pre-wrap">
            {loading ? 'Typing…' : reply}
          </p>

          {generatedCards.length > 0 && (
            <div className="space-y-3">
              {generatedCards.slice(0, 5).map((c, idx) => (
                <div key={idx} className="bg-zinc-700 rounded-xl px-3 py-2 text-white">
                  <p className="text-sm font-semibold">{idx + 1}. {c.question}</p>
                  <p className="text-sm mt-1">Answer: {c.answer}</p>
                  {c.explanation && <p className="text-xs mt-1 text-white/80">Why: {c.explanation}</p>}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl px-3 py-2 text-sm text-white/90">
                  <p className="text-xs text-white/70 font-semibold mb-1">Subject (optional)</p>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Biology"
                    className="w-full bg-transparent border-b border-white/30 focus:border-white focus:outline-none text-white placeholder:text-white/50 text-sm py-1"
                  />
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-sm text-white/90">
                  <p className="text-xs text-white/70 font-semibold mb-1">Topic (optional)</p>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Cell division"
                    className="w-full bg-transparent border-b border-white/30 focus:border-white focus:outline-none text-white placeholder:text-white/50 text-sm py-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCards}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold text-sm disabled:opacity-70"
                >
                  {saving ? 'Saving…' : 'Save to deck'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {prompts.map((p) => (
            <button
              key={p.label}
              onClick={() => sendPrompt(p.prompt)}
              disabled={loading}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-3 py-3 text-left transition flex flex-col items-center justify-center gap-1 min-h-[80px]"
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="bg-zinc-800 rounded-2xl p-3 flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (input.trim()) {
                    sendPrompt(input);
                    setInput('');
                  }
                }
              }}
              placeholder="Type your question..."
              className="flex-1 bg-transparent text-white placeholder:text-white/60 focus:outline-none text-sm"
              disabled={loading || uploading}
            />
            <button
              onClick={() => setShowUploadOptions(!showUploadOptions)}
              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition text-lg"
              title="Upload files or paste URL"
            >
              📎
            </button>
            <button
              onClick={() => {
                if (input.trim()) {
                  sendPrompt(input);
                  setInput('');
                }
              }}
              disabled={loading || uploading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold text-sm disabled:opacity-70"
            >
              Send
            </button>
          </div>

          {showUploadOptions && (
            <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  placeholder="Paste URL to generate flashcards..."
                  className="flex-1 bg-white/10 text-white placeholder:text-white/60 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled={uploading}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={uploading || !urlInput.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  🔗 Scrape
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'pdf');
                    }}
                    disabled={uploading}
                  />
                  <div className="bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-3 text-center text-sm font-semibold transition">
                    📄 Upload PDF
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'image');
                    }}
                    disabled={uploading}
                  />
                  <div className="bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-3 text-center text-sm font-semibold transition">
                    📸 Upload Image
                  </div>
                </label>
              </div>

              {uploading && (
                <p className="text-xs text-white/70 text-center">Processing your upload...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
