'use client';

import { useState } from 'react';
import { cardsAPI } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Question {
  question: string;
  answer: string;
  explanation?: string;
}

interface QuestionResultsProps {
  questions: Question[];
  onSaved?: () => void;
  onRequireAuth?: () => void;
}

export default function QuestionResults({ questions, onSaved, onRequireAuth }: QuestionResultsProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleOpenSaveDialog = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveToDeck = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    setSaving(true);
    try {
      const cards = questions.map(q => ({
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
      }));

      await cardsAPI.createCardsBulk(
        cards,
        subject || undefined,
        topic || undefined,
        undefined,
        isPublic ? 'public' : 'private'
      );

      setSaved(true);
      setShowSaveDialog(false);
      if (onSaved) onSaved();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save cards');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Header with Save Button */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {questions.length} card{questions.length !== 1 ? 's' : ''} generated
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and save to your deck
            </p>
          </div>
          {!saved ? (
            <button
              onClick={handleOpenSaveDialog}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save to deck
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Saved{isPublic ? ' · visible in feed' : ''}!</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-black text-zinc-900 mb-5">Save cards</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Subject (optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology, Mathematics"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 text-zinc-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Topic (optional)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Algebra, Cell Biology"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 text-zinc-900 text-sm"
                />
              </div>

              {/* Visibility toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer"
                onClick={() => setIsPublic(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPublic ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    {isPublic ? (
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{isPublic ? 'Share to community feed' : 'Keep private'}</p>
                    <p className="text-xs text-zinc-400">{isPublic ? 'Others can discover and save your cards' : 'Only visible to you'}</p>
                  </div>
                </div>
                {/* Toggle switch */}
                <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isPublic ? 'bg-violet-500' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-zinc-600 font-semibold text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDeck}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-zinc-900 mb-3">{q.question}</p>
                <div className="bg-violet-50 border-l-4 border-violet-400 p-4 rounded-r-xl">
                  <p className="text-xs font-bold text-violet-500 mb-1 uppercase tracking-wide">Answer</p>
                  <p className="text-zinc-800 text-sm">{q.answer}</p>
                  {q.explanation && (
                    <>
                      <p className="text-xs font-bold text-violet-400 mt-3 mb-1 uppercase tracking-wide">Explanation</p>
                      <p className="text-xs text-zinc-600">{q.explanation}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
