'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionResults from '@/components/QuestionResults';
import ArielAssistant from '@/components/ArielAssistant';
import AuthModal from '@/components/AuthModal';
import AIProviderSettings from '@/components/AIProviderSettings';
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
    <main
      className="min-h-screen text-white"
      style={{
        backgroundColor: '#0b1220',
        backgroundImage:
          'radial-gradient(circle at 15% 20%, rgba(99,102,241,0.08), transparent 35%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.07), transparent 30%)',
      }}
    >
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (user, token) => {
          login(user, token);
          setShowAuthModal(false);
          await checkAuth();
        }}
      />

      <header className="sticky top-0 z-30 bg-[#0b1220]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60 font-semibold">Ariel AI</p>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-pink-500 to-sky-400 bg-clip-text text-transparent">
              Create Flashcards Instantly
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            ← Back to dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <AIProviderSettings />

        <section className="bg-white/[0.05] border border-white/10 rounded-3xl shadow-lg p-6 md:p-8 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-white/60 font-semibold">Sources</p>
              <h2 className="text-2xl font-bold text-white">Paste URLs, upload PDFs, images, or bulk text</h2>
              <p className="text-sm text-white/70 mt-1">Ariel extracts questions and answers using your chosen AI provider (OpenAI, Claude, or Ollama fallback).</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>

          <InputMethods onQuestionsLoaded={handleQuestionsLoaded} />
        </section>

        {questions.length > 0 && (
          <section className="bg-white/[0.05] border border-white/10 rounded-3xl shadow-lg p-6 md:p-8 backdrop-blur">
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
