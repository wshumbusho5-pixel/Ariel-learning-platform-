'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionCard from '@/components/QuestionCard';
import QuestionResults from '@/components/QuestionResults';
import AuthModal from '@/components/AuthModal';
import AICardGenerator from '@/components/AICardGenerator';
import AIProviderSettings from '@/components/AIProviderSettings';
import { useAuth } from '@/lib/useAuth';

interface Question {
  question: string;
  answer: string;
  explanation?: string;
  detailed_explanation?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && !isSessionActive && !showResults && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSessionActive, showResults, isLoading, router]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    setCurrentIndex(0);
    setShowResults(true);
    setIsSessionActive(false);
    setIsComplete(false);
  };

  const handleStartReview = () => {
    setShowResults(false);
    setIsSessionActive(true);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    setIsSessionActive(false);
    setIsComplete(false);
    setQuestions([]);
    setCurrentIndex(0);
  };

  if (isSessionActive || showResults || isComplete) {
    return (
      <main className="min-h-screen bg-white">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user, token) => {
            login(user, token);
            router.push('/dashboard');
          }}
        />

        <header className="sticky top-0 bg-white border-b border-gray-100 z-30">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <button onClick={handleRestart} className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-gray-900">Ariel</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Start over
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-5 py-12">
          {showResults && questions.length > 0 && (
            <div>
              <QuestionResults
                questions={questions}
                onRequireAuth={() => setShowAuthModal(true)}
              />
              <div className="mt-8 text-center">
                <button
                  onClick={handleStartReview}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Start review session
                </button>
              </div>
            </div>
          )}

          {isSessionActive && !isComplete && questions.length > 0 && (
            <div className="py-12">
              <QuestionCard
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                question={questions[currentIndex].question}
                answer={questions[currentIndex].answer}
                explanation={questions[currentIndex].explanation}
                detailedExplanation={questions[currentIndex].detailed_explanation}
                onNext={handleNext}
              />
            </div>
          )}

          {isComplete && (
            <div className="max-w-md mx-auto text-center space-y-5 py-12">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Session complete</h2>
              <p className="text-gray-500">
                You reviewed {questions.length} questions.
              </p>
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                New session
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => {
          login(user, token);
          router.push('/dashboard');
        }}
      />

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">Ariel</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push('/reels')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Start learning
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-5 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900 tracking-tight">
              A feed built for your brain — not addiction.
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Learn one concept in 20 seconds. No setup. No scrolling traps.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => router.push('/reels')}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Start learning
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Create account
              </button>
            </div>
            <p className="text-xs text-gray-400">No account required to try</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Live demo</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">20-second card</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100">Biology</span>
            </div>
            <div className="rounded-xl bg-gray-900 text-white p-5">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Question</p>
              <p className="text-lg font-bold mb-4 leading-snug">What does chlorophyll do?</p>
              <div className="p-4 rounded-lg bg-white/10 border border-white/10">
                <p className="text-xs font-semibold text-blue-300 mb-1.5 uppercase tracking-wide">Answer</p>
                <p className="text-white leading-relaxed text-sm">Captures light energy to power photosynthesis, converting CO2 and water into glucose.</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Swipe for next concept</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">How Ariel works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Drop your notes</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Paste text, upload a PDF, share a link, or snap a photo of your notes.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Ariel generates cards</h3>
              <p className="text-sm text-gray-500 leading-relaxed">AI extracts the key concepts and turns them into clean 20-second explainers.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Review and retain</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Spaced repetition surfaces cards right when you need them. Retain more, study less.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For who */}
      <div className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-10">Built for everyone</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-xl p-6 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Students</p>
            <p className="text-base font-bold text-gray-900">Learn one thing per swipe</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Flashcards built from your own notes. Spaced repetition keeps knowledge fresh.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Parents</p>
            <p className="text-base font-bold text-gray-900">A feed you can trust</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              No ads, no recommendations, no ragebait. Pure learning content.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Educators</p>
            <p className="text-base font-bold text-gray-900">Share decks, lift outcomes</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Create and share learning clips your students will actually use.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Ready to start learning?</h2>
            <p className="text-gray-500">No account needed. Free to try.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => router.push('/reels')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Start learning
            </button>
          </div>
        </div>
      </div>

      {/* Advanced AI */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Power users</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Bring your own AI keys</p>
              <p className="text-xs text-gray-500 max-w-md mt-1">
                Ariel works out of the box. Plug in your own OpenAI or Claude key for extra control.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedAI((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex-shrink-0"
            >
              {showAdvancedAI ? 'Hide' : 'Show settings'}
            </button>
          </div>
          {showAdvancedAI && (
            <div className="border border-gray-100 rounded-xl bg-gray-50 p-4 mt-4">
              <AIProviderSettings />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Ariel</span>
          </div>
          <p className="text-xs text-gray-400">No ads. No manipulation. Just understanding.</p>
        </div>
      </footer>
    </main>
  );
}
