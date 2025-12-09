'use client';

import { useState, useEffect } from 'react';
import { cardsAPI } from '@/lib/api';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags: string[];
  likes: number;
  saves: number;
  visibility: string;
  created_at?: string;
}

interface CardFeedProps {
  type: 'trending' | 'my-deck';
  onCardClick?: (card: Card) => void;
}

export default function CardFeed({ type, onCardClick }: CardFeedProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCards();
  }, [type]);

  const loadCards = async () => {
    setLoading(true);
    try {
      let data;
      if (type === 'trending') {
        data = await cardsAPI.getTrendingCards(50);
      } else {
        data = await cardsAPI.getMyDeck({ limit: 100 });
      }
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cardsAPI.likeCard(cardId);
      setLikedCards(prev => new Set([...prev, cardId]));
      setCards(cards.map(card =>
        card.id === cardId ? { ...card, likes: card.likes + 1 } : card
      ));
    } catch (error) {
      console.error('Failed to like card:', error);
    }
  };

  const handleSave = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cardsAPI.saveCardToDeck(cardId);
      setCards(cards.map(card =>
        card.id === cardId ? { ...card, saves: card.saves + 1 } : card
      ));
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  const toggleExpanded = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          <div className="absolute inset-0 rounded-full bg-purple-50 blur-xl"></div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 animate-slideUp">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {type === 'trending' ? 'No trending cards yet' : 'No cards in your deck'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {type === 'trending'
            ? 'Be the first to create and share cards!'
            : 'Start creating cards to build your deck'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {cards.map((card, index) => {
        const isExpanded = expandedCards.has(card.id);
        const isLiked = likedCards.has(card.id);

        return (
          <div
            key={card.id}
            className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 animate-slideUp"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Card Header - Instagram style */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {card.subject ? card.subject[0].toUpperCase() : 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {card.subject || 'Study Card'}
                  </p>
                  {card.topic && (
                    <p className="text-xs text-gray-500">{card.topic}</p>
                  )}
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
            </div>

            {/* Card Image/Content Area - Click to reveal */}
            <div
              className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 cursor-pointer min-h-[280px] flex items-center justify-center"
              onClick={() => toggleExpanded(card.id)}
            >
              {!isExpanded ? (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                    <svg className="w-12 h-12 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900 leading-relaxed max-w-lg">
                      {card.question}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Tap to reveal answer</span>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6 animate-scaleIn">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-purple-200 shadow-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900 mb-1">Answer</p>
                        <p className="text-gray-900 text-base leading-relaxed font-medium">
                          {card.answer}
                        </p>
                      </div>
                    </div>
                    {card.explanation && (
                      <div className="mt-4 pt-4 border-t border-purple-100">
                        <p className="text-sm font-semibold text-purple-900 mb-2">Explanation</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {card.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags floating */}
              {card.tags && card.tags.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {card.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/90 backdrop-blur-sm text-purple-700 text-xs font-medium rounded-full shadow-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar - Instagram style */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Like */}
                  <button
                    onClick={(e) => handleLike(card.id, e)}
                    className="flex items-center gap-2 group"
                  >
                    <div className={`transform transition-transform group-hover:scale-110 ${isLiked ? 'animate-scaleIn' : ''}`}>
                      <svg
                        className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={isLiked ? 0 : 2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Comment */}
                  <button className="group">
                    <svg className="w-7 h-7 text-gray-700 transform transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>

                  {/* Share */}
                  <button className="group">
                    <svg className="w-7 h-7 text-gray-700 transform transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                {/* Save/Bookmark */}
                {type === 'trending' && (
                  <button
                    onClick={(e) => handleSave(card.id, e)}
                    className="group"
                  >
                    <svg className="w-7 h-7 text-gray-700 transform transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Likes count */}
              <div className="space-y-1">
                <p className="font-semibold text-sm text-gray-900">
                  {card.likes.toLocaleString()} {card.likes === 1 ? 'like' : 'likes'}
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{card.subject || 'Study Card'}</span>{' '}
                  <span className="text-gray-700">Question card</span>
                </p>
              </div>

              {/* Time */}
              <p className="text-xs text-gray-500 uppercase tracking-wide">2 hours ago</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
