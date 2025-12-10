'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionCard from '@/components/QuestionCard';
import QuestionResults from '@/components/QuestionResults';
import AuthModal from '@/components/AuthModal';
import AICardGenerator from '@/components/AICardGenerator';
import { useAuth } from '@/lib/useAuth';

interface Question {
  question: string;
  answer: string;
  explanation?: string;
  detailed_explanation?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showArielAssistant, setShowArielAssistant] = useState(false);
  const [arielMinimized, setArielMinimized] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !isSessionActive && !showResults) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSessionActive, showResults, router]);

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
              <QuestionResults questions={questions} />
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
            <button
              onClick={() => setShowAuthModal(true)}
              className="magnetic-btn px-6 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover-glow"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - World Class */}
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8 animate-reveal">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-gray-200/50 shadow-lg animate-float">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">10,000+ students crushing it daily</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            Your <span className="gradient-text">AI study buddy</span>
            <br />that actually gets you
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            No cap, Ariel turns your notes into fire flashcards instantly.
            Study anywhere, ace everything. It's giving main character energy. 💅
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="magnetic-btn px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-2xl shadow-2xl hover-glow text-lg"
            >
              Start For Free ⚡
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('how-it-works');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="magnetic-btn px-8 py-4 glass-card text-gray-900 font-bold rounded-2xl shadow-lg hover-glow text-lg"
            >
              See How It Works
            </button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-semibold">Instant flashcards</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="font-semibold">AI-powered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold">Actually fun</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-semibold">Track streaks</span>
            </div>
          </div>
        </div>

        {/* Hero Visual - Interactive Demo Preview */}
        <div className="mt-16 animate-reveal" style={{animationDelay: '0.2s'}}>
          <div className="relative max-w-5xl mx-auto">
            {/* Main Card Preview */}
            <div className="glass-card rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl">📚</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Preview Card</h3>
                  <p className="text-sm text-gray-600">Tap to flip & learn</p>
                </div>
              </div>
              <div className="neu-card p-8 rounded-2xl hover-glow">
                <p className="text-xl font-bold text-gray-900 mb-4">What is the mitochondria?</p>
                <p className="text-gray-600">Tap to reveal answer...</p>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -right-4 top-8 neu-card p-4 rounded-2xl shadow-xl animate-float hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Streak</p>
                  <p className="text-2xl font-bold text-gray-900">7 days</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 bottom-8 neu-card p-4 rounded-2xl shadow-xl animate-float hidden md:block" style={{animationDelay: '1s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mastered</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - How It Works */}
      <div id="how-it-works" className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-reveal">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            It hits different ✨
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to go from zero to hero
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="neu-card p-8 hover-glow animate-reveal text-center" style={{animationDelay: '0.1s'}}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-4xl">📝</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              1
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3">Drop your content</h4>
            <p className="text-gray-600 leading-relaxed">
              Paste notes, upload PDFs, or share links. Ariel handles the rest like a pro.
            </p>
          </div>

          {/* Step 2 */}
          <div className="neu-card p-8 hover-glow animate-reveal text-center" style={{animationDelay: '0.2s'}}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              2
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3">AI does its thing</h4>
            <p className="text-gray-600 leading-relaxed">
              Watch Ariel create perfect flashcards in seconds. It's literally magic.
            </p>
          </div>

          {/* Step 3 */}
          <div className="neu-card p-8 hover-glow animate-reveal text-center" style={{animationDelay: '0.3s'}}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-4xl">🚀</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              3
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3">Slay your studies</h4>
            <p className="text-gray-600 leading-relaxed">
              Study on your phone, track streaks, compete with friends. Main character vibes only.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof / Stats */}
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="glass-card rounded-3xl p-12 text-center animate-reveal shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            The receipts speak for themselves 📈
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">10K+</p>
              <p className="text-gray-600 font-semibold">Students vibing</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">1M+</p>
              <p className="text-gray-600 font-semibold">Cards created</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">95%</p>
              <p className="text-gray-600 font-semibold">Better grades</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">24/7</p>
              <p className="text-gray-600 font-semibold">Always available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="animate-reveal">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to level up? 🎮
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already winning. It's free to start!
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="magnetic-btn px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-2xl shadow-2xl hover-glow text-xl"
          >
            Let's Go! 🚀
          </button>
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
