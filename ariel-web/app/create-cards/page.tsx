'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionResults from '@/components/QuestionResults';
import AuthModal from '@/components/AuthModal';
import AIProviderSettings from '@/components/AIProviderSettings';
import { useAuth } from '@/lib/useAuth';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

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
    <>
      <SideNav />
      <main className="min-h-screen bg-zinc-950 lg:pl-56">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async (user, token) => {
          login(user, token);
          setShowAuthModal(false);
          await checkAuth();
        }}
      />

      <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Create flashcards</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900">
          <AIProviderSettings />
        </div>

        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
          <div className="mb-5">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Sources</p>
            <h2 className="text-base font-bold text-white">Paste URLs, upload PDFs, images, or text</h2>
            <p className="text-sm text-zinc-500 mt-1">Ariel extracts questions and answers using your chosen AI provider.</p>
          </div>
          <InputMethods onQuestionsLoaded={handleQuestionsLoaded} />
        </div>

        {questions.length > 0 && (
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
            <QuestionResults
              questions={questions}
              onRequireAuth={() => setShowAuthModal(true)}
            />
          </div>
        )}
      </div>
      </main>
      <BottomNav />
    </>
  );
}
