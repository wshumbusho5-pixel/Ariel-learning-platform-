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

      await cardsAPI.createCardsBulk(cards, subject || undefined, topic || undefined);

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
              {questions.length} Question{questions.length !== 1 ? 's' : ''} Generated
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review your questions and save them to your deck
            </p>
          </div>
          {!saved ? (
            <button
              onClick={handleOpenSaveDialog}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save to Deck
            </button>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Saved to your deck!</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-[#09090b] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Organize Your Cards</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Biology"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Algebra, Cell Biology"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDeck}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save to Deck'}
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
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {q.question}
                </h3>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-sm font-medium text-green-900 mb-1">Answer:</p>
                  <p className="text-gray-800">{q.answer}</p>
                  {q.explanation && (
                    <>
                      <p className="text-sm font-medium text-green-900 mt-3 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-700">{q.explanation}</p>
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
