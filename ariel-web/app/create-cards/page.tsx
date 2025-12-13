'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionResults from '@/components/QuestionResults';
import ArielAssistant from '@/components/ArielAssistant';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';

interface Question {
  question: string;
  answer: string;
  explanation?: string;
  detailed_explanation?: string;
}

export default function CreateCardsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const { isAuthenticated, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (user, token) => {
          login(user, token);
          setShowAuthModal(false);
          await checkAuth();
        }}
      />

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ariel AI</p>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Create Flashcards Instantly
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            ← Back to dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Sources</p>
              <h2 className="text-2xl font-bold text-gray-900">Paste URLs, upload PDFs, images, or bulk text</h2>
              <p className="text-sm text-gray-600 mt-1">Ariel extracts questions and answers with Ollama under the hood.</p>
            </div>
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>

          <InputMethods onQuestionsLoaded={handleQuestionsLoaded} />
        </section>

        {questions.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
            <QuestionResults
              questions={questions}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </section>
        )}
      </div>

      <ArielAssistant />
    </main>
  );
}
