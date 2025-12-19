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
  const [showArielAssistant, setShowArielAssistant] = useState(false);
  const [arielMinimized, setArielMinimized] = useState(true);
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [demoRevealed, setDemoRevealed] = useState(true); // Auto-reveal demo

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect authenticated users to dashboard
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

  // If user is in a session, show the original interface
  if (isSessionActive || showResults || isComplete) {
    return (
      <main className="min-h-screen gradient-mesh bg-white">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user, token) => {
            login(user, token);
            router.push('/dashboard');
          }}
        />

        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Ariel
                </h1>
                <p className="text-sm text-gray-600 mt-1 font-medium">Learning forward, always positive</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Start Over
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {showResults && questions.length > 0 && (
            <div>
              <QuestionResults
                questions={questions}
                onRequireAuth={() => setShowAuthModal(true)}
              />
              <div className="mt-8 text-center">
                <button
                  onClick={handleStartReview}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Review Session →
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
            <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Session Complete!</h2>
              <p className="text-gray-600">
                You've reviewed {questions.length} questions. Your brain has encoded all the correct answers.
              </p>
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Start New Session
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Main landing page (not authenticated or not in session)
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => {
          login(user, token);
          router.push('/dashboard');
        }}
      />

      {/* Header - Clean & Modern */}
      <header className="relative backdrop-blur-2xl bg-white/80 border-b border-gray-200/50 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between animate-reveal">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-xl">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Ariel</h1>
                <p className="text-xs text-gray-600 font-semibold">Study smarter, not harder</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white/70 text-slate-700 font-semibold hover:bg-white transition"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => router.push('/reels')}
                className="magnetic-btn px-6 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover-glow"
              >
                Start learning
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - hook first, no setup */}
      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-50 text-gray-900 shadow-2xl border border-white/70">
          <div className="absolute -left-24 -top-24 w-80 h-80 bg-purple-200/30 blur-3xl rounded-full" />
          <div className="absolute -right-16 bottom-10 w-64 h-64 bg-blue-200/30 blur-3xl rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-12 p-10 lg:p-16">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900">
                A feed built for your brain — not addiction.
              </h2>
              <p className="text-xl md:text-2xl text-slate-700 leading-relaxed">
                Learn one useful concept in 20 seconds.<br />
                No setup. No scrolling traps.
              </p>
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/reels')}
                  className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-lg hover:-translate-y-0.5 transition text-lg"
                >
                  ▶ Start learning (20s)
                </button>
                <p className="text-sm text-slate-500">
                  No account required · Free to try
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">See how it works</p>
                    <p className="text-base font-bold text-slate-900">20-second explainer</p>
                  </div>
                  <div className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">Live demo</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl">
                  <p className="text-sm text-white/60 mb-2">Question</p>
                  <p className="text-xl font-bold mb-4">What does chlorophyll do?</p>
                  <div className="p-4 rounded-lg bg-white/10 border border-white/15">
                    <p className="text-sm font-semibold text-emerald-200 mb-1">Answer</p>
                    <p className="text-white leading-relaxed">It captures light energy to power photosynthesis.</p>
                    <p className="text-white/60 text-sm mt-3">
                      Swipe → next concept
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-center text-slate-500 italic">
                  "It's like TikTok, but every swipe teaches me something."
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-slate-600 font-semibold">
                  Privacy-first. No ads. No manipulation.
                </p>
                <p className="text-xs text-slate-500">
                  Designed to reduce doom-scrolling
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14 animate-reveal">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            How Ariel works
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Step 1 */}
          <div className="text-center animate-reveal" style={{animationDelay: '0.1s'}}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-3xl">📝</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Drop your notes</h4>
            <p className="text-gray-600">
              Paste notes, upload files, or share links.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center animate-reveal" style={{animationDelay: '0.2s'}}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Ariel turns them into 20-second explainers</h4>
            <p className="text-gray-600">
              One clear concept at a time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center animate-reveal" style={{animationDelay: '0.3s'}}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-3xl">🧠</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Learn fast, remember longer</h4>
            <p className="text-gray-600">
              Built with spaced repetition science.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof (qualitative, honest) */}
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="glass-card rounded-3xl p-12 text-center animate-reveal shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
            Built for real life (and real focus)
          </h3>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Built for students. Trusted by parents. Safe for schools.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
            <div className="rounded-2xl bg-white/70 border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Students</p>
              <p className="text-lg font-bold text-slate-900 mt-2">Learn one thing per swipe</p>
              <p className="text-sm text-slate-600 mt-2">
                20s explainers + flashcards that help you remember, not just scroll.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Parents</p>
              <p className="text-lg font-bold text-slate-900 mt-2">A feed you can trust</p>
              <p className="text-sm text-slate-600 mt-2">
                Designed to feel calm and safe—no ragebait, no weird recommendations.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Schools</p>
              <p className="text-lg font-bold text-slate-900 mt-2">Share decks, lift outcomes</p>
              <p className="text-sm text-slate-600 mt-2">
                Teachers can share learning clips and decks students actually use.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-8">
            No ads. No doomscroll dopamine traps. Just understanding.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="animate-reveal space-y-6">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ready to learn something right now?
          </h3>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Get a 20-second explainer instantly.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push('/reels')}
              className="magnetic-btn px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-2xl shadow-2xl hover-glow text-xl"
            >
              ▶ Start learning now
            </button>
            <p className="mt-3 text-sm text-slate-500">
              No account required
            </p>
          </div>
        </div>
      </div>

      {/* Advanced AI - tucked away for power users */}
      <div id="byo-ai" className="relative max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white/70 backdrop-blur rounded-3xl shadow-lg border border-slate-200/70 p-6 md:p-7">
          <div className="flex items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Power users (optional)</p>
              <p className="text-base font-bold text-slate-900 mt-1">Bring your own AI keys</p>
              <p className="text-sm text-slate-600 max-w-xl mt-2">
                Ariel works out of the box. Only plug in your own OpenAI or Claude key if you want extra control.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedAI((v) => !v)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold transition flex items-center gap-2"
            >
              {showAdvancedAI ? '− Hide settings' : '+ Show advanced settings'}
            </button>
          </div>
          {showAdvancedAI && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mt-4">
              <AIProviderSettings />
            </div>
          )}
        </div>
      </div>

      {/* Ariel AI Assistant - Floating Bottom Right */}
      <div className="fixed bottom-24 right-6 z-40">
        {arielMinimized ? (
          <button
            onClick={() => setArielMinimized(false)}
            className="magnetic-btn w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white shadow-2xl hover-glow flex items-center justify-center animate-float"
          >
            <span className="text-3xl">✨</span>
          </button>
        ) : (
          <div className="glass-card rounded-3xl p-6 w-80 shadow-2xl animate-scaleIn">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Ariel</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-xs text-gray-600">Online</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setArielMinimized(true)}
                className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover-glow magnetic-btn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-white/50 rounded-2xl p-4">
                <p className="text-sm text-gray-700">
                  Hey! I'm Ariel, your AI study buddy! 👋
                  <br /><br />
                  Need help getting started? Just sign up and I'll help you create your first flashcards! ✨
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg hover-glow transition-all magnetic-btn text-sm"
              >
                Get Started Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/50 backdrop-blur-xl bg-white/60">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="font-bold text-gray-900">Ariel</span>
              <span className="text-gray-600">- Study smarter, not harder</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">About</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Features</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
