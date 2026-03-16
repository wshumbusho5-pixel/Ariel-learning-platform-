'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cardsAPI, aiCaptionAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';


// Parse bulk-pasted Q&A text (tab-separated or blank-line-separated)
function parseBulkText(raw: string): { question: string; answer: string }[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const pairs: { question: string; answer: string }[] = [];

  // Try tab-separated: "Question\tAnswer"
  if (lines.some(l => l.includes('\t'))) {
    for (const line of lines) {
      const [q, ...rest] = line.split('\t');
      if (q && rest.length > 0) {
        pairs.push({ question: q.trim(), answer: rest.join('\t').trim() });
      }
    }
    return pairs;
  }

  // Try "Q: ... / A: ..." or alternating lines
  const qPrefix = /^[Qq][:.]\s*/;
  const aPrefix = /^[Aa][:.]\s*/;
  if (lines.some(l => qPrefix.test(l))) {
    let i = 0;
    while (i < lines.length) {
      if (qPrefix.test(lines[i])) {
        const q = lines[i].replace(qPrefix, '').trim();
        const next = lines[i + 1];
        if (next && aPrefix.test(next)) {
          pairs.push({ question: q, answer: next.replace(aPrefix, '').trim() });
          i += 2;
          continue;
        }
      }
      i++;
    }
    if (pairs.length > 0) return pairs;
  }

  // Fallback: alternating lines (odd=question, even=answer)
  for (let i = 0; i + 1 < lines.length; i += 2) {
    pairs.push({ question: lines[i], answer: lines[i + 1] });
  }
  return pairs;
}

interface CardDraft {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

type Mode = 'manual' | 'ariel';

export default function CreateCardsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  // ── Mode ──────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('manual');

  // ── Deck metadata ─────────────────────────────────────────────
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  const effectiveSubject = subject.trim();

  const handleBulkImport = () => {
    const pairs = parseBulkText(bulkText);
    if (pairs.length === 0) {
      setBulkError('Could not parse any Q&A pairs. Try "Question\\tAnswer" per line, or alternating lines.');
      return;
    }
    setBulkError('');
    const newCards: CardDraft[] = pairs.map((p, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      question: p.question,
      answer: p.answer,
      explanation: '',
    }));
    setCards(prev => {
      // Replace the single empty starter card if it's blank
      const hasBlank = prev.length === 1 && !prev[0].question && !prev[0].answer;
      return hasBlank ? newCards : [...prev, ...newCards];
    });
    setBulkText('');
    setShowBulkPaste(false);
  };
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [caption, setCaption] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // ── Cards ──────────────────────────────────────────────────────
  const [cards, setCards] = useState<CardDraft[]>([
    { id: '1', question: '', answer: '', explanation: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ───────────────────────────────────────────────────
  const addCard = () => {
    setCards(prev => [...prev, { id: Date.now().toString(), question: '', answer: '', explanation: '' }]);
    setTimeout(() => {
      document.getElementById(`card-${cards.length}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const removeCard = (id: string) => {
    if (cards.length === 1) return;
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const updateCard = (id: string, field: keyof CardDraft, value: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const validCards = cards.filter(c => c.question.trim() && c.answer.trim());

  const handleGenerateCaption = async () => {
    const first = validCards[0];
    if (!first) return;
    setGeneratingCaption(true);
    try {
      const { caption: generated } = await aiCaptionAPI.generate({
        question: first.question,
        answer: first.answer,
        subject: effectiveSubject || undefined,
        topic: topic || undefined,
      });
      if (generated) setCaption(generated);
    } catch {}
    setGeneratingCaption(false);
  };

  const handleSave = async () => {
    if (authLoading) return; // still checking auth — wait
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (validCards.length === 0) { setError('Add at least one card with a question and answer.'); return; }
    setError('');
    setSaving(true);
    try {
      await cardsAPI.createCardsBulk(
        validCards.map(c => ({
          question: c.question.trim(),
          answer: c.answer.trim(),
          explanation: c.explanation.trim() || undefined,
          subject: effectiveSubject || undefined,
          topic: topic || undefined,
          tags: [],
        })),
        effectiveSubject || undefined,
        topic || undefined,
        [],
        visibility,
        visibility === 'public' && caption.trim() ? caption.trim() : undefined
      );
      setSaved(true);
      setTimeout(() => router.push('/deck'), 1200);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SideNav />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (user, token) => {
          login(user, token);
          setShowAuthModal(false);
          await checkAuth();
        }}
      />

      <main className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-32">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.push('/deck')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 flex-shrink-0"
            >
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-white flex-1">Create Flash Cards</h1>
            {mode === 'manual' && validCards.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving || saved || authLoading}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  saved ? 'bg-emerald-600 text-white' :
                  saving || authLoading ? 'bg-violet-600/50 text-white/50' :
                  'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {saved ? '✓ Saved!' : saving ? 'Saving…' : `Save ${validCards.length} card${validCards.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

          {/* Mode switcher */}
          <div className="flex rounded-2xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'manual' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Write my own
            </button>
            <button
              onClick={() => setMode('ariel')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'ariel' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-base">✦</span>
              Ask Ariel
              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">PRO</span>
            </button>
          </div>

          {/* ── MANUAL MODE ── */}
          {mode === 'manual' && (
            <>
              {/* Deck info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Deck Info</p>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Subject <span className="text-zinc-600">(optional)</span></label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Biology, Law, Theology…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Topic <span className="text-zinc-600">(optional)</span></label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Cell Division, World War II…"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Visibility</label>
                  <div className="flex gap-2">
                    {(['public', 'private'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setVisibility(v)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          visibility === v
                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {v === 'public' ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {v === 'public' ? 'Public' : 'Private'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1.5">
                    {visibility === 'public' ? 'Everyone can find and study these cards.' : 'Only you can see these cards.'}
                  </p>

                  {/* Caption — only when public */}
                  {visibility === 'public' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-400">Caption <span className="text-zinc-600 font-normal">(optional)</span></label>
                        <button
                          type="button"
                          onClick={handleGenerateCaption}
                          disabled={generatingCaption || validCards.length === 0}
                          className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
                        >
                          {generatingCaption ? (
                            <span className="inline-block w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>✨</span>
                          )}
                          {generatingCaption ? 'Generating…' : 'AI Generate'}
                        </button>
                      </div>
                      <textarea
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        maxLength={200}
                        rows={2}
                        placeholder="What should people know before studying this? e.g. &quot;This comes up every exam 🔥&quot;"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none transition-colors"
                      />
                      <p className="text-[10px] text-zinc-700 text-right mt-0.5">{caption.length}/200</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    id={`card-${index}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-500">Card {index + 1}</span>
                      {cards.length > 1 && (
                        <button
                          onClick={() => removeCard(card.id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Question */}
                      <div>
                        <label className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 block">Question</label>
                        <textarea
                          value={card.question}
                          onChange={e => updateCard(card.id, 'question', e.target.value)}
                          placeholder="What do you want to be asked?"
                          rows={2}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none leading-relaxed"
                          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: '18px' }}
                        />
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-zinc-800" />
                        <span className="text-[10px] font-bold text-zinc-600">ANSWER</span>
                        <div className="flex-1 h-px bg-zinc-800" />
                      </div>

                      {/* Answer */}
                      <div>
                        <textarea
                          value={card.answer}
                          onChange={e => updateCard(card.id, 'answer', e.target.value)}
                          placeholder="The correct answer…"
                          rows={2}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none leading-relaxed"
                          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: '18px' }}
                        />
                      </div>

                      {/* Explanation (collapsible) */}
                      <details className="group">
                        <summary className="text-[11px] font-bold text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors list-none flex items-center gap-1">
                          <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          Add explanation (optional)
                        </summary>
                        <textarea
                          value={card.explanation}
                          onChange={e => updateCard(card.id, 'explanation', e.target.value)}
                          placeholder="Explain why this is the answer…"
                          rows={2}
                          className="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 resize-none leading-relaxed"
                        />
                      </details>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add card button */}
              <div className="flex gap-2">
                <button
                  onClick={addCard}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/5 text-zinc-500 hover:text-violet-400 text-sm font-semibold transition-all group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add card
                </button>
                <button
                  onClick={() => setShowBulkPaste(v => !v)}
                  className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all ${
                    showBulkPaste
                      ? 'border-violet-500/50 bg-violet-500/5 text-violet-400'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  }`}
                  title="Bulk paste multiple cards"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Bulk
                </button>
              </div>

              {/* Bulk paste panel */}
              {showBulkPaste && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs font-bold text-white">Bulk paste cards</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      One card per line: <span className="text-zinc-400">Question[tab]Answer</span>
                      {' '}· or alternating lines Q / A · or prefix with <span className="text-zinc-400">Q:</span> / <span className="text-zinc-400">A:</span>
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    <textarea
                      value={bulkText}
                      onChange={e => { setBulkText(e.target.value); setBulkError(''); }}
                      placeholder={`What is photosynthesis?\tProcess plants use to convert light to energy\nWhat is mitosis?\tCell division producing identical daughter cells`}
                      rows={6}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none leading-relaxed font-mono text-xs"
                    />
                    {bulkError && <p className="text-xs text-red-400 font-semibold">{bulkError}</p>}
                    <button
                      onClick={handleBulkImport}
                      disabled={!bulkText.trim()}
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      Import cards
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 text-center font-semibold">{error}</p>
              )}

              {/* Save button (bottom) */}
              <button
                onClick={handleSave}
                disabled={saving || saved || validCards.length === 0 || authLoading}
                className={`w-full py-4 rounded-2xl text-base font-bold transition-all ${
                  saved ? 'bg-emerald-600 text-white' :
                  validCards.length === 0 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' :
                  saving || authLoading ? 'bg-violet-600/60 text-white/60' :
                  'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
                }`}
              >
                {saved ? '✓ Cards saved! Redirecting…' :
                 saving ? 'Saving…' :
                 authLoading ? 'Loading…' :
                 validCards.length === 0 ? 'Fill in at least one card' :
                 `Save ${validCards.length} card${validCards.length !== 1 ? 's' : ''} to my deck`}
              </button>
            </>
          )}

          {/* ── ARIEL MODE (PREMIUM GATE) ── */}
          {mode === 'ariel' && (
            <div className="rounded-2xl overflow-hidden border border-amber-500/20">
              {/* Premium banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✦</span>
                </div>
                <div>
                  <p className="text-sm font-black text-amber-300">Ariel AI — Pro Feature</p>
                  <p className="text-xs text-amber-400/70">Generate cards from any URL, PDF, image, or text paste</p>
                </div>
                <span className="ml-auto text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-1 rounded-full flex-shrink-0">PRO</span>
              </div>

              {/* What Ariel can do */}
              <div className="bg-zinc-900 px-5 py-5 space-y-3">
                {[
                  { icon: '🌐', title: 'Paste a URL', desc: 'Ariel reads the page and generates Q&A cards from it' },
                  { icon: '📄', title: 'Upload a PDF', desc: 'Drop in your lecture notes, textbook chapter, or study guide' },
                  { icon: '🖼️', title: 'Send an image', desc: 'Photos of handwritten notes, diagrams, or slides' },
                  { icon: '✏️', title: 'Paste raw text', desc: 'Any notes or article — Ariel turns it into a deck instantly' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{f.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-zinc-900 border-t border-zinc-800 px-5 py-5 space-y-3">
                <button
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow"
                >
                  Upgrade to Pro — Unlock Ariel
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className="w-full py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Continue writing cards manually (free)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
