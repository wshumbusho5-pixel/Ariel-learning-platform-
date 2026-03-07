'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { cardsAPI } from '@/lib/api';

interface DuelCard {
  id: string;
  question: string;
  answer: string;
  subject?: string;
}

type DuelPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'complete';

const BOT_NAMES = ['Alex', 'Jordan', 'Sam', 'Morgan', 'Riley'];
const BOT_DELAYS = [2800, 4200, 6000, 8500, 12000]; // ms before bot answers

export default function DuelsPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<DuelPhase>('lobby');
  const [cards, setCards] = useState<DuelCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [userAnswer, setUserAnswer] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [botAnswered, setBotAnswered] = useState(false);
  const [userAnswered, setUserAnswered] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [opponent] = useState(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [botDelay] = useState(BOT_DELAYS[Math.floor(Math.random() * BOT_DELAYS.length)]);
  const [loadingCards, setLoadingCards] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ROUNDS = 5;
  const currentCard = cards[currentIndex];

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botRef.current) clearTimeout(botRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const loadCards = async () => {
    setLoadingCards(true);
    try {
      const data = await cardsAPI.getTrendingCards(ROUNDS);
      setCards(data.slice(0, ROUNDS));
    } catch {
      // use fallback cards
      setCards([
        { id: '1', question: 'What is the powerhouse of the cell?', answer: 'Mitochondria', subject: 'Biology' },
        { id: '2', question: 'What is the speed of light?', answer: '299,792,458 m/s', subject: 'Physics' },
        { id: '3', question: 'What year did WW2 end?', answer: '1945', subject: 'History' },
        { id: '4', question: 'What is H2O?', answer: 'Water', subject: 'Chemistry' },
        { id: '5', question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare', subject: 'Literature' },
      ]);
    } finally {
      setLoadingCards(false);
    }
  };

  const startDuel = async () => {
    await loadCards();
    setPhase('countdown');
    setCurrentIndex(0);
    setUserScore(0);
    setBotScore(0);
    let c = 3;
    setCountdown(c);
    const cd = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c === 0) {
        clearInterval(cd);
        beginQuestion();
      }
    }, 1000);
  };

  const beginQuestion = () => {
    setPhase('question');
    setUserAnswer('');
    setUserAnswered(false);
    setBotAnswered(false);
    setRoundResult(null);
    setTimeLeft(15);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          resolveRound(false, false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const delay = Math.min(botDelay, 12000);
    botRef.current = setTimeout(() => {
      setBotAnswered(true);
    }, delay);
  };

  const resolveRound = (userCorrect: boolean, botCorrect: boolean) => {
    clearTimers();
    let result: 'win' | 'lose' | 'tie' = 'tie';
    if (userCorrect && !botCorrect) { setUserScore(s => s + 1); result = 'win'; }
    else if (botCorrect && !userCorrect) { setBotScore(s => s + 1); result = 'lose'; }
    else if (userCorrect && botCorrect) {
      setUserScore(s => s + 1);
      setBotScore(s => s + 1);
      result = 'tie';
    }
    setRoundResult(result);
    setPhase('reveal');

    setTimeout(() => {
      if (currentIndex + 1 >= ROUNDS) {
        setPhase('complete');
      } else {
        setCurrentIndex(i => i + 1);
        beginQuestion();
      }
    }, 2500);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || userAnswered) return;
    setUserAnswered(true);
    const correct = userAnswer.trim().toLowerCase().includes(
      currentCard.answer.toLowerCase().substring(0, 5)
    );
    resolveRound(correct, botAnswered);
  };

  const finalResult = userScore > botScore ? 'win' : userScore < botScore ? 'lose' : 'tie';

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-black lg:pl-[72px] pb-20">
        <header className="sticky top-0 bg-black border-b border-zinc-800 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">Study Duels</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Head-to-head flashcard battles</p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Lobby */}
          {phase === 'lobby' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-sky-900/40 border-2 border-sky-600 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-sky-400">Y</span>
                    </div>
                    <p className="text-sm font-semibold text-white">You</p>
                  </div>
                  <div className="text-zinc-600 font-bold text-lg">VS</div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-zinc-400">{opponent[0]}</span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-400">{opponent}</p>
                  </div>
                </div>
                <div className="space-y-2 text-left mb-6">
                  {[
                    '5 rounds · 15 seconds per question',
                    'Type your answer and submit',
                    'Fastest correct answer wins the round',
                    'Most rounds won takes the duel',
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full flex-shrink-0" />
                      {rule}
                    </div>
                  ))}
                </div>
                <button
                  onClick={startDuel}
                  disabled={loadingCards}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loadingCards ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : 'Start duel'}
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">How it works</p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  You and your opponent see the same flashcard. Type your answer before the timer runs out.
                  Cards are pulled from trending public decks. The player who wins the most rounds wins the duel.
                </p>
              </div>
            </div>
          )}

          {/* Countdown */}
          {phase === 'countdown' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Duel starting in</p>
              <div className="text-8xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {countdown}
              </div>
              <p className="text-zinc-600 text-sm">Get ready...</p>
            </div>
          )}

          {/* Question */}
          {(phase === 'question' || phase === 'reveal') && currentCard && (
            <div className="space-y-4">
              {/* Scoreboard */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-zinc-500 mb-1">You</p>
                  <p className="text-2xl font-black text-sky-400">{userScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Round</p>
                  <p className="text-sm font-bold text-zinc-300">{currentIndex + 1} / {ROUNDS}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-zinc-500 mb-1">{opponent}</p>
                  <p className="text-2xl font-black text-zinc-400">{botScore}</p>
                </div>
              </div>

              {/* Timer */}
              {phase === 'question' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 8 ? 'bg-sky-500' : timeLeft > 4 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${(timeLeft / 15) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-6 text-right ${timeLeft <= 4 ? 'text-red-400' : 'text-zinc-400'}`}>{timeLeft}</span>
                </div>
              )}

              {/* Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                {currentCard.subject && (
                  <span className="inline-block px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-full mb-3">
                    {currentCard.subject}
                  </span>
                )}
                <h2 className="text-xl font-bold text-white leading-snug">{currentCard.question}</h2>
              </div>

              {/* Opponent status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${botAnswered ? 'bg-orange-400' : 'bg-zinc-700 animate-pulse'}`} />
                <span className={`${botAnswered ? 'text-orange-400' : 'text-zinc-600'}`}>
                  {botAnswered ? `${opponent} answered` : `${opponent} is thinking...`}
                </span>
              </div>

              {/* Answer input */}
              {phase === 'question' && (
                <div className="flex gap-2">
                  <input
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Type your answer..."
                    disabled={userAnswered}
                    autoFocus
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-sky-500 placeholder:text-zinc-600 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim() || userAnswered}
                    className="px-5 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Go
                  </button>
                </div>
              )}

              {/* Round result */}
              {phase === 'reveal' && roundResult && (
                <div className={`rounded-xl p-5 border text-center ${
                  roundResult === 'win' ? 'bg-sky-900/20 border-sky-700/40' :
                  roundResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
                  'bg-zinc-800/40 border-zinc-700'
                }`}>
                  <p className={`text-lg font-black mb-1 ${
                    roundResult === 'win' ? 'text-sky-400' :
                    roundResult === 'lose' ? 'text-red-400' :
                    'text-zinc-300'
                  }`}>
                    {roundResult === 'win' ? 'You got it first!' : roundResult === 'lose' ? `${opponent} was faster` : 'Tied!'}
                  </p>
                  <p className="text-sm text-zinc-400">Answer: <span className="text-white font-semibold">{currentCard.answer}</span></p>
                </div>
              )}
            </div>
          )}

          {/* Complete */}
          {phase === 'complete' && (
            <div className="space-y-4">
              <div className={`rounded-xl p-8 border text-center ${
                finalResult === 'win' ? 'bg-sky-900/20 border-sky-700/40' :
                finalResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
                'bg-zinc-900 border-zinc-800'
              }`}>
                <p className="text-5xl font-black mb-3">
                  {finalResult === 'win' ? 'You won' : finalResult === 'lose' ? 'You lost' : 'Draw'}
                </p>
                <p className={`text-lg font-bold mb-6 ${
                  finalResult === 'win' ? 'text-sky-400' :
                  finalResult === 'lose' ? 'text-red-400' :
                  'text-zinc-400'
                }`}>
                  {userScore} — {botScore} vs {opponent}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPhase('lobby'); setCurrentIndex(0); setUserScore(0); setBotScore(0); }}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Rematch
                  </button>
                  <button
                    onClick={() => router.push('/leaderboard')}
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors"
                  >
                    Leaderboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
