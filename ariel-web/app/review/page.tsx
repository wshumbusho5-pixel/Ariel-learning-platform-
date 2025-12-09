'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCardReview from '@/components/SwipeCardReview';
import { useAuth } from '@/lib/useAuth';
import { cardsAPI } from '@/lib/api';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  likes: number;
  saves: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    checkAuth();
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const data = await cardsAPI.getDueCards(20);
      setCards(data);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setShowComplete(true);
  };

  const handleExit = () => {
    router.push('/deck');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to review cards</h2>
          <p className="text-gray-600 mb-6">Create an account to start your review session</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your cards...</p>
        </div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Review Complete!
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You've reviewed all {cards.length} cards. Your brain has encoded all the correct answers using spaced repetition.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/deck')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Back to Deck
            </button>
            <button
              onClick={() => {
                setShowComplete(false);
                loadDueCards();
              }}
              className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors border border-gray-300"
            >
              Review More
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No cards due for review
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Great job! You're all caught up. Come back later when more cards are due, or explore trending cards to learn something new.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/deck')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View My Deck
            </button>
            <button
              onClick={() => router.push('/explore')}
              className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-colors border border-gray-300"
            >
              Explore Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SwipeCardReview
      initialCards={cards}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
