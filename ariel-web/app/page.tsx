'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputMethods from '@/components/InputMethods';
import QuestionCard from '@/components/QuestionCard';
import AuthModal from '@/components/AuthModal';
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
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    setCurrentIndex(0);
    setIsSessionActive(true);
    setIsComplete(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setIsSessionActive(false);
    setIsComplete(false);
    setQuestions([]);
    setCurrentIndex(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => {
          login(user, token);
          router.push('/dashboard');
        }}
      />

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ariel
              </h1>
              <p className="text-sm text-gray-600 mt-1">Learning forward, always positive</p>
            </div>
            <div className="flex items-center gap-3">
              {isSessionActive && (
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Start Over
                </button>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {!isSessionActive && !isComplete && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Revolutionary Revision
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Learn with pure, positive reinforcement. No distractors, just correct answers.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Paste URLs to extract questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI-powered answer generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No wrong answers, pure learning</span>
                </div>
              </div>
            </div>

            {/* Input Methods */}
            <InputMethods onQuestionsLoaded={handleQuestionsLoaded} />

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Recall</h3>
                <p className="text-gray-600 text-sm">
                  Attempt each question before revealing the answer. Your brain builds stronger neural pathways through retrieval practice.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pure Learning</h3>
                <p className="text-gray-600 text-sm">
                  Only see correct answers. No multiple choice confusion. Your brain encodes exactly what's right.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Processing</h3>
                <p className="text-gray-600 text-sm">
                  Paste a URL, upload a PDF, or type questions. AI extracts and answers everything instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Question Session */}
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

        {/* Completion Screen */}
        {isComplete && (
          <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Session Complete!
            </h2>
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
