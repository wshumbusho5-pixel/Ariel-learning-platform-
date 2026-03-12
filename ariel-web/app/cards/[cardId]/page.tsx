'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cardsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

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
}

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    cardsAPI.getCard(cardId)
      .then(setCard)
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, [cardId]);

  return (
    <>
      <SideNav />
      <div className="fixed inset-0 lg:left-[72px] bg-[#0d0d0f] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-zinc-800">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800"
          >
            <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Flash Card</p>
            {card?.subject && <p className="text-xs text-zinc-500">{card.subject}</p>}
          </div>
          <button
            onClick={() => router.push(`/cards/${cardId}/discuss`)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-3.5 py-2 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Discuss
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
          {loading ? (
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" />
          ) : !card ? (
            <div className="text-center">
              <p className="text-zinc-400 text-sm">Card not found.</p>
              <button onClick={() => router.back()} className="mt-4 text-violet-400 text-sm font-semibold">Go back</button>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              {/* Question card */}
              <div
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setRevealed(v => !v)}
              >
                {card.subject && (
                  <span className="inline-block px-2.5 py-1 bg-violet-400/10 text-violet-400 text-[10px] font-bold rounded-full mb-4">
                    {card.subject}
                  </span>
                )}
                <p className="text-white text-lg font-semibold leading-snug">{card.question}</p>

                {!revealed && (
                  <p className="text-zinc-600 text-sm mt-5 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Tap to reveal answer
                  </p>
                )}

                {revealed && (
                  <div className="mt-5 pt-5 border-t border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white text-base font-medium leading-relaxed">{card.answer}</p>
                    </div>
                    {card.explanation && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">Why</p>
                        <p className="text-zinc-300 text-sm leading-relaxed">{card.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {card.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-center text-zinc-700 text-xs pt-2">Tap the card to {revealed ? 'hide' : 'reveal'} the answer</p>

              <button
                onClick={() => router.push(`/cards/${cardId}/discuss`)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-2xl transition-colors mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Join the Discussion
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
