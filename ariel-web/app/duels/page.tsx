'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { cardsAPI, duelsAPI, socialAPI } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DuelCard {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  choices?: string[];
}

type Mode = 'solo' | 'online';
type OnlineTab = 'quick-match' | 'challenge';
type Phase = 'lobby' | 'matchmaking' | 'waiting' | 'countdown' | 'question' | 'reveal' | 'complete';

// ── Constants ────────────────────────────────────────────────────────────────

const BOT_NAMES = ['Alex', 'Jordan', 'Sam', 'Morgan', 'Riley'];
const BOT_DELAYS = [2800, 4200, 6000, 8500, 12000];
const ROUNDS = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace(/^http/, 'ws');

const FALLBACK_CARDS: DuelCard[] = [
  { id: '1', question: 'What is the powerhouse of the cell?', answer: 'Mitochondria', subject: 'Biology' },
  { id: '2', question: 'What is the speed of light?', answer: '299,792,458 m/s', subject: 'Physics' },
  { id: '3', question: 'What year did WW2 end?', answer: '1945', subject: 'History' },
  { id: '4', question: 'What is H2O?', answer: 'Water', subject: 'Chemistry' },
  { id: '5', question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare', subject: 'Literature' },
  { id: '6', question: 'What is the capital of France?', answer: 'Paris', subject: 'Geography' },
  { id: '7', question: 'What is 12 × 12?', answer: '144', subject: 'Mathematics' },
  { id: '8', question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', subject: 'Art' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DuelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode / navigation
  const [mode, setMode] = useState<Mode>('solo');
  const [onlineTab, setOnlineTab] = useState<OnlineTab>('quick-match');

  // Shared game state
  const [phase, setPhase] = useState<Phase>('lobby');
  const [cards, setCards] = useState<DuelCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [choices, setChoices] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [userAnswered, setUserAnswered] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [finalResult, setFinalResult] = useState<'win' | 'lose' | 'tie'>('tie');

  // Solo
  const [botName] = useState(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [botDelay] = useState(BOT_DELAYS[Math.floor(Math.random() * BOT_DELAYS.length)]);

  // Online multiplayer
  const [roomId, setRoomId] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [matchmakingStatus, setMatchmakingStatus] = useState('');
  const [challengeQuery, setChallengeQuery] = useState('');
  const [challengeResults, setChallengeResults] = useState<{ id: string; username: string; full_name?: string }[]>([]);
  const [challengeSending, setChallengeSending] = useState('');
  const [challengeSent, setChallengeSent] = useState('');
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [wsError, setWsError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentCard = cards[currentIndex];
  const displayOpponent = mode === 'online' ? (opponentName || '...') : botName;

  // Handle join from notification link (/duels?join=<roomId>)
  useEffect(() => {
    const joinRoomId = searchParams.get('join');
    if (joinRoomId) {
      setMode('online');
      acceptChallenge(joinRoomId);
    }
  }, []); // eslint-disable-line

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botRef.current) clearTimeout(botRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  useEffect(() => () => {
    clearTimers();
    wsRef.current?.close();
  }, []);

  // ── Solo helpers ────────────────────────────────────────────────────────────

  const buildChoices = useCallback((card: DuelCard, pool: DuelCard[]) => {
    if (card.choices && card.choices.length > 1) {
      setChoices(card.choices);
      return;
    }
    const correct = card.answer;
    const distractors = pool
      .filter(c => c.id !== card.id)
      .map(c => c.answer)
      .filter(a => a.toLowerCase() !== correct.toLowerCase());
    const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    setChoices([correct, ...shuffled].sort(() => Math.random() - 0.5));
  }, []);

  const loadSoloCards = async (): Promise<DuelCard[]> => {
    try {
      const data = await cardsAPI.getTrendingCards(20);
      return data.length >= ROUNDS ? data : [...data, ...FALLBACK_CARDS].slice(0, Math.max(data.length, ROUNDS + 3));
    } catch {
      return FALLBACK_CARDS;
    }
  };

  // ── Solo game ────────────────────────────────────────────────────────────────

  const beginQuestion = useCallback((allCards: DuelCard[], idx: number) => {
    setPhase('question');
    setUserAnswer('');
    setUserAnswered(false);
    setOpponentAnswered(false);
    setRoundResult(null);
    setTimeLeft(15);
    buildChoices(allCards[idx], allCards);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          resolveRound(false, false, idx + 1, allCards);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (mode === 'solo') {
      const delay = Math.min(botDelay, 12000);
      botRef.current = setTimeout(() => setOpponentAnswered(true), delay);
    }
  }, [botDelay, mode]); // eslint-disable-line

  const resolveRound = useCallback((userCorrect: boolean, opponentCorrect: boolean, nextIdx: number, allCards: DuelCard[]) => {
    clearTimers();
    let result: 'win' | 'lose' | 'tie' = 'tie';
    if (userCorrect && !opponentCorrect) { setUserScore(s => s + 1); result = 'win'; }
    else if (opponentCorrect && !userCorrect) { setOpponentScore(s => s + 1); result = 'lose'; }
    else if (userCorrect && opponentCorrect) {
      setUserScore(s => s + 1);
      setOpponentScore(s => s + 1);
    }
    setRoundResult(result);
    setPhase('reveal');

    setTimeout(() => {
      if (nextIdx >= ROUNDS) {
        setFinalResult(result); // approximate, will be overwritten by game_over for online
        setPhase('complete');
      } else {
        setCurrentIndex(nextIdx);
        beginQuestion(allCards, nextIdx);
      }
    }, 2200);
  }, [beginQuestion]); // eslint-disable-line

  const handleChoiceSelect = (choice: string) => {
    if (userAnswered || phase !== 'question') return;
    setUserAnswered(true);
    setUserAnswer(choice);
    const correct = choice.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();

    if (mode === 'solo') {
      resolveRound(correct, opponentAnswered, currentIndex + 1, cards);
    } else {
      // Online: tell server, wait for round_result
      wsRef.current?.send(JSON.stringify({ type: 'submit_answer', answer: choice }));
    }
  };

  const startSoloDuel = async () => {
    const loaded = await loadSoloCards();
    setCards(loaded);
    setCurrentIndex(0);
    setUserScore(0);
    setOpponentScore(0);
    setPhase('countdown');
    let c = 3;
    setCountdown(c);
    const cd = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c === 0) {
        clearInterval(cd);
        beginQuestion(loaded, 0);
      }
    }, 1000);
  };

  // ── Online: Quick Match ──────────────────────────────────────────────────────

  const startQuickMatch = async () => {
    setMatchmakingLoading(true);
    setWsError('');
    try {
      const data = await duelsAPI.quickMatch();
      setRoomId(data.room_id);
      if (data.status === 'joined' && data.opponent_username) {
        setOpponentName(data.opponent_username);
        connectToRoom(data.room_id);
      } else {
        setPhase('waiting');
        setMatchmakingStatus('Looking for an opponent...');
        connectToRoom(data.room_id);
      }
    } catch {
      setWsError('Could not connect. Please try again.');
    } finally {
      setMatchmakingLoading(false);
    }
  };

  // ── Online: Challenge ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!challengeQuery.trim() || challengeQuery.length < 2) {
      setChallengeResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await socialAPI.searchUsers(challengeQuery, 8);
        setChallengeResults(res);
      } catch {
        setChallengeResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [challengeQuery]);

  const sendChallenge = async (username: string) => {
    setChallengeSending(username);
    setWsError('');
    try {
      const data = await duelsAPI.challenge(username);
      setRoomId(data.room_id);
      setChallengeSent(username);
      setPhase('waiting');
      setMatchmakingStatus(`Waiting for ${username} to accept...`);
      connectToRoom(data.room_id);
    } catch (e: any) {
      setWsError(e?.response?.data?.detail || 'Could not send challenge.');
    } finally {
      setChallengeSending('');
    }
  };

  const acceptChallenge = async (rid: string) => {
    setWsError('');
    try {
      const data = await duelsAPI.joinRoom(rid);
      setRoomId(rid);
      if (data.opponent_username) setOpponentName(data.opponent_username);
      setPhase('waiting');
      setMatchmakingStatus('Connecting...');
      connectToRoom(rid);
    } catch (e: any) {
      setWsError(e?.response?.data?.detail || 'Could not join room.');
    }
  };

  // ── WebSocket ────────────────────────────────────────────────────────────────

  const connectToRoom = (rid: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setWsError('Not logged in.'); return; }
    wsRef.current?.close();

    const ws = new WebSocket(`${WS_URL}/api/duels/${rid}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleWsMessage(msg);
    };

    ws.onerror = () => setWsError('Connection error. Please try again.');
    ws.onclose = () => {
      if (phase !== 'complete') setWsError('Disconnected from server.');
    };
  };

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'connected':
        if (msg.opponent_username) setOpponentName(msg.opponent_username);
        break;

      case 'waiting':
        setPhase('waiting');
        setMatchmakingStatus(msg.message || 'Waiting for opponent...');
        break;

      case 'player_joined':
        setOpponentName(msg.opponent_username || 'Opponent');
        setMatchmakingStatus(`${msg.opponent_username} joined!`);
        break;

      case 'game_start':
        setPhase('countdown');
        setUserScore(0);
        setOpponentScore(0);
        setCurrentIndex(0);
        let c = msg.countdown || 3;
        setCountdown(c);
        const cd = setInterval(() => {
          c -= 1;
          setCountdown(c);
          if (c === 0) clearInterval(cd);
        }, 1000);
        break;

      case 'round_start':
        setPhase('question');
        setUserAnswer('');
        setUserAnswered(false);
        setOpponentAnswered(false);
        setRoundResult(null);
        setCurrentIndex((msg.round || 1) - 1);
        setTimeLeft(15);
        setCards(prev => {
          const updated = [...prev];
          const idx = (msg.round || 1) - 1;
          updated[idx] = {
            id: String(idx),
            question: msg.question,
            answer: '',  // server reveals on round_result
            subject: msg.subject || '',
            choices: msg.choices || [],
          };
          return updated;
        });
        if (msg.choices) setChoices(msg.choices);

        // Start timer
        if (timerRef.current) clearInterval(timerRef.current);
        let t = 15;
        timerRef.current = setInterval(() => {
          t -= 1;
          setTimeLeft(t);
          if (t <= 0) clearInterval(timerRef.current!);
        }, 1000);
        break;

      case 'opponent_answered':
        setOpponentAnswered(true);
        break;

      case 'round_result':
        clearTimers();
        setUserScore(msg.you_score);
        setOpponentScore(msg.opponent_score);
        setRoundResult(msg.result);
        // Reveal correct answer
        setCards(prev => {
          const updated = [...prev];
          const idx = (msg.round || 1) - 1;
          if (updated[idx]) updated[idx] = { ...updated[idx], answer: msg.correct_answer };
          return updated;
        });
        setPhase('reveal');
        setTimeout(() => {
          if (msg.round >= ROUNDS) {
            // game_over will arrive shortly
          } else {
            setCurrentIndex(msg.round);
          }
        }, 2200);
        break;

      case 'game_over':
        clearTimers();
        setUserScore(msg.you_score);
        setOpponentScore(msg.opponent_score);
        setFinalResult(msg.result);
        setTimeout(() => setPhase('complete'), 2200);
        break;

      case 'opponent_disconnected':
        clearTimers();
        setWsError(`${opponentName || 'Opponent'} disconnected.`);
        setFinalResult('win');
        setTimeout(() => setPhase('complete'), 1500);
        break;
    }
  };

  const resetToLobby = () => {
    clearTimers();
    wsRef.current?.close();
    wsRef.current = null;
    setPhase('lobby');
    setCards([]);
    setCurrentIndex(0);
    setUserScore(0);
    setOpponentScore(0);
    setRoundResult(null);
    setRoomId('');
    setOpponentName('');
    setMatchmakingStatus('');
    setChallengeSent('');
    setChallengeQuery('');
    setWsError('');
  };

  // ── Render ────────────────────────────────────────────────────────────────────

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

          {/* Mode tabs — only show in lobby */}
          {phase === 'lobby' && (
            <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6">
              {(['solo', 'online'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setWsError(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    mode === m ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {m === 'solo' ? 'Solo vs Bot' : 'Play Online'}
                </button>
              ))}
            </div>
          )}

          {/* ─── LOBBY ─────────────────────────────────────────────────────── */}
          {phase === 'lobby' && mode === 'solo' && (
            <SoloLobby opponent={botName} onStart={startSoloDuel} />
          )}

          {phase === 'lobby' && mode === 'online' && (
            <OnlineLobby
              tab={onlineTab}
              onTabChange={setOnlineTab}
              challengeQuery={challengeQuery}
              setChallengeQuery={setChallengeQuery}
              challengeResults={challengeResults}
              challengeSending={challengeSending}
              challengeSent={challengeSent}
              onChallenge={sendChallenge}
              onQuickMatch={startQuickMatch}
              matchmakingLoading={matchmakingLoading}
              wsError={wsError}
            />
          )}

          {/* ─── WAITING ─────────────────────────────────────────────────────── */}
          {phase === 'waiting' && (
            <WaitingRoom
              status={matchmakingStatus}
              roomId={roomId}
              opponentName={opponentName}
              onCancel={resetToLobby}
            />
          )}

          {/* ─── COUNTDOWN ─────────────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Duel starting in</p>
              <div className="text-8xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {countdown}
              </div>
              {opponentName && (
                <p className="text-zinc-400 text-sm">vs <span className="text-white font-semibold">{opponentName}</span></p>
              )}
            </div>
          )}

          {/* ─── QUESTION / REVEAL ─────────────────────────────────────────── */}
          {(phase === 'question' || phase === 'reveal') && currentCard && (
            <GameRound
              card={currentCard}
              choices={choices}
              phase={phase}
              timeLeft={timeLeft}
              currentIndex={currentIndex}
              userScore={userScore}
              opponentScore={opponentScore}
              opponentName={displayOpponent}
              userAnswer={userAnswer}
              userAnswered={userAnswered}
              opponentAnswered={opponentAnswered}
              roundResult={roundResult}
              onChoiceSelect={handleChoiceSelect}
            />
          )}

          {/* ─── COMPLETE ──────────────────────────────────────────────────── */}
          {phase === 'complete' && (
            <GameComplete
              finalResult={finalResult}
              userScore={userScore}
              opponentScore={opponentScore}
              opponentName={displayOpponent}
              onRematch={resetToLobby}
              onLeaderboard={() => router.push('/leaderboard')}
            />
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SoloLobby({ opponent, onStart }: { opponent: string; onStart: () => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-8 mb-6">
          <PlayerAvatar label="You" letter="Y" color="sky" />
          <div className="text-zinc-600 font-bold text-lg">VS</div>
          <PlayerAvatar label={opponent} letter={opponent[0]} color="zinc" />
        </div>
        <RulesList />
        <button
          onClick={onStart}
          className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors"
        >
          Start duel
        </button>
      </div>
    </div>
  );
}

function OnlineLobby({
  tab, onTabChange, challengeQuery, setChallengeQuery, challengeResults,
  challengeSending, challengeSent, onChallenge, onQuickMatch, matchmakingLoading, wsError,
}: {
  tab: OnlineTab;
  onTabChange: (t: OnlineTab) => void;
  challengeQuery: string;
  setChallengeQuery: (q: string) => void;
  challengeResults: { id: string; username: string; full_name?: string }[];
  challengeSending: string;
  challengeSent: string;
  onChallenge: (username: string) => void;
  onQuickMatch: () => void;
  matchmakingLoading: boolean;
  wsError: string;
}) {
  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
        {(['quick-match', 'challenge'] as const).map(t => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'quick-match' ? 'Quick Match' : 'Challenge'}
          </button>
        ))}
      </div>

      {wsError && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-sm text-red-400">
          {wsError}
        </div>
      )}

      {tab === 'quick-match' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
          <div className="text-4xl">
            <svg className="w-12 h-12 mx-auto text-sky-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Find a Random Opponent</p>
            <p className="text-zinc-400 text-sm">Get matched with someone studying right now. Win to earn followers.</p>
          </div>
          <RulesList />
          <button
            onClick={onQuickMatch}
            disabled={matchmakingLoading}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {matchmakingLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finding opponent...
              </>
            ) : 'Find Opponent'}
          </button>
        </div>
      )}

      {tab === 'challenge' && (
        <div className="space-y-3">
          {challengeSent ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-3xl">⚔️</p>
              <p className="text-white font-semibold">Challenge sent to <span className="text-sky-400">@{challengeSent}</span></p>
              <p className="text-zinc-400 text-sm">Waiting for them to accept. You&apos;ll be connected automatically.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <p className="text-white font-medium text-sm">Challenge anyone — even if they don&apos;t follow you</p>
              <input
                type="text"
                placeholder="Search by username..."
                value={challengeQuery}
                onChange={e => setChallengeQuery(e.target.value)}
                className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
              {challengeResults.length > 0 && (
                <div className="space-y-1">
                  {challengeResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors">
                      <div>
                        <p className="text-white text-sm font-medium">@{user.username}</p>
                        {user.full_name && <p className="text-zinc-500 text-xs">{user.full_name}</p>}
                      </div>
                      <button
                        onClick={() => onChallenge(user.username)}
                        disabled={challengeSending === user.username}
                        className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {challengeSending === user.username ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Challenge'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {challengeQuery.length >= 2 && challengeResults.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-2">No users found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WaitingRoom({
  status, roomId, opponentName, onCancel,
}: {
  status: string;
  roomId: string;
  opponentName: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-sky-500/30 border-t-sky-500 animate-spin" />
      <div>
        <p className="text-white font-semibold text-lg">{status || 'Connecting...'}</p>
        {opponentName && (
          <p className="text-sky-400 font-bold mt-1">{opponentName} is ready!</p>
        )}
        {roomId && !opponentName && (
          <p className="text-zinc-500 text-xs mt-2">Room: <span className="text-zinc-400 font-mono">{roomId}</span></p>
        )}
      </div>
      <button
        onClick={onCancel}
        className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function GameRound({
  card, choices, phase, timeLeft, currentIndex, userScore, opponentScore,
  opponentName, userAnswer, userAnswered, opponentAnswered, roundResult, onChoiceSelect,
}: {
  card: DuelCard;
  choices: string[];
  phase: Phase;
  timeLeft: number;
  currentIndex: number;
  userScore: number;
  opponentScore: number;
  opponentName: string;
  userAnswer: string;
  userAnswered: boolean;
  opponentAnswered: boolean;
  roundResult: 'win' | 'lose' | 'tie' | null;
  onChoiceSelect: (choice: string) => void;
}) {
  return (
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
          <p className="text-xs text-zinc-500 mb-1">{opponentName}</p>
          <p className="text-2xl font-black text-zinc-400">{opponentScore}</p>
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
        {card.subject && (
          <span className="inline-block px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-full mb-3">
            {card.subject}
          </span>
        )}
        <h2 className="text-xl font-bold text-white leading-snug">{card.question}</h2>
      </div>

      {/* Opponent status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${opponentAnswered ? 'bg-orange-400' : 'bg-zinc-700 animate-pulse'}`} />
        <span className={opponentAnswered ? 'text-orange-400' : 'text-zinc-600'}>
          {opponentAnswered ? `${opponentName} answered` : `${opponentName} is thinking...`}
        </span>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-2.5">
        {choices.map((choice, i) => {
          const isSelected = userAnswer === choice;
          const isCorrect = card.answer && choice.trim().toLowerCase() === card.answer.trim().toLowerCase();
          let cls = 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-sky-500/50 hover:bg-zinc-800';
          if (phase === 'reveal') {
            if (isCorrect) cls = 'border-sky-500 bg-sky-900/30 text-sky-300';
            else if (isSelected && !isCorrect) cls = 'border-red-600 bg-red-900/20 text-red-300';
            else cls = 'border-zinc-800 bg-zinc-900/50 text-zinc-600';
          }
          return (
            <button
              key={i}
              onClick={() => onChoiceSelect(choice)}
              disabled={userAnswered || phase === 'reveal'}
              className={`p-3.5 rounded-xl border-2 text-sm font-semibold text-left transition-all leading-snug ${cls} disabled:cursor-default`}
            >
              <span className="text-xs font-bold opacity-60 mr-1.5">{String.fromCharCode(65 + i)}.</span>
              {choice}
            </button>
          );
        })}
      </div>

      {/* Round result */}
      {phase === 'reveal' && roundResult && (
        <div className={`rounded-xl p-5 border text-center ${
          roundResult === 'win' ? 'bg-sky-900/20 border-sky-700/40' :
          roundResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
          'bg-zinc-800/40 border-zinc-700'
        }`}>
          <p className={`text-lg font-black mb-1 ${
            roundResult === 'win' ? 'text-sky-400' :
            roundResult === 'lose' ? 'text-red-400' : 'text-zinc-300'
          }`}>
            {roundResult === 'win' ? 'You got it first!' : roundResult === 'lose' ? `${opponentName} was faster` : 'Tied!'}
          </p>
          {card.answer && (
            <p className="text-sm text-zinc-400">Answer: <span className="text-white font-semibold">{card.answer}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

function GameComplete({
  finalResult, userScore, opponentScore, opponentName, onRematch, onLeaderboard,
}: {
  finalResult: 'win' | 'lose' | 'tie';
  userScore: number;
  opponentScore: number;
  opponentName: string;
  onRematch: () => void;
  onLeaderboard: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-8 border text-center ${
        finalResult === 'win' ? 'bg-sky-900/20 border-sky-700/40' :
        finalResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
        'bg-zinc-900 border-zinc-800'
      }`}>
        <p className="text-5xl font-black mb-3 text-white">
          {finalResult === 'win' ? 'You won!' : finalResult === 'lose' ? 'You lost' : 'Draw'}
        </p>
        <p className={`text-lg font-bold mb-6 ${
          finalResult === 'win' ? 'text-sky-400' :
          finalResult === 'lose' ? 'text-red-400' : 'text-zinc-400'
        }`}>
          {userScore} – {opponentScore} vs {opponentName}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRematch}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onLeaderboard}
            className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerAvatar({ label, letter, color }: { label: string; letter: string; color: 'sky' | 'zinc' }) {
  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
        color === 'sky' ? 'bg-sky-900/40 border-2 border-sky-600' : 'bg-zinc-800 border-2 border-zinc-600'
      }`}>
        <span className={`text-2xl font-bold ${color === 'sky' ? 'text-sky-400' : 'text-zinc-400'}`}>{letter}</span>
      </div>
      <p className={`text-sm font-semibold ${color === 'sky' ? 'text-white' : 'text-zinc-400'}`}>{label}</p>
    </div>
  );
}

function RulesList() {
  const rules = [
    `${ROUNDS} rounds · 15 seconds per question`,
    'Choose the correct answer from 4 options',
    'Fastest correct answer wins the round',
    'Most rounds won takes the duel',
  ];
  return (
    <div className="space-y-2 text-left mb-6">
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full flex-shrink-0" />
          {rule}
        </div>
      ))}
    </div>
  );
}
