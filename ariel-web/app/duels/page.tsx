'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { cardsAPI, duelsAPI, socialAPI, notificationsAPI } from '@/lib/api';

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

const ROUND_OPTIONS = [5, 10, 15, 20];

// ── Main component ────────────────────────────────────────────────────────────

export default function DuelsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-400 rounded-full animate-spin" /></div>}>
      <DuelsPage />
    </Suspense>
  );
}

function DuelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>('solo');
  const [onlineTab, setOnlineTab] = useState<OnlineTab>('quick-match');
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
  const [rounds, setRounds] = useState(5);

  const [botName] = useState(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const botCorrectRef = useRef(false);
  const botAnsweredRef = useRef(false);

  const [roomId, setRoomId] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [matchmakingStatus, setMatchmakingStatus] = useState('');
  const [challengeQuery, setChallengeQuery] = useState('');
  const [challengeResults, setChallengeResults] = useState<{ id: string; username: string; full_name?: string }[]>([]);
  const [challengeSending, setChallengeSending] = useState('');
  const [challengeSent, setChallengeSent] = useState('');
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [wsError, setWsError] = useState('');
  const gameStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickMatchInProgress = useRef(false);

  const [incomingChallenge, setIncomingChallenge] = useState<{ roomId: string; from: string; notifId: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenNotifIds = useRef<Set<string>>(new Set());

  const phaseRef = useRef<Phase>('lobby');
  const userScoreRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const roundsRef = useRef(5);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundsRef.current = rounds; }, [rounds]);

  const currentCard = cards[currentIndex];
  const displayOpponent = mode === 'online' ? (opponentName || '...') : botName;

  useEffect(() => {
    const joinRoomId = searchParams.get('join');
    if (joinRoomId) { setMode('online'); acceptChallenge(joinRoomId); }
    if (searchParams.get('deckChallenge') === '1') { setMode('online'); setOnlineTab('challenge'); }
  }, []); // eslint-disable-line

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botRef.current) clearTimeout(botRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (gameStartTimeoutRef.current) clearTimeout(gameStartTimeoutRef.current);
    if (pingRef.current) clearInterval(pingRef.current);
  };

  useEffect(() => () => {
    clearTimers();
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
  }, []);

  useEffect(() => {
    if (phase !== 'lobby') {
      if (challengePollRef.current) clearInterval(challengePollRef.current);
      return;
    }
    const checkChallenges = async () => {
      try {
        const data = await notificationsAPI.getNotifications(20, 0);
        const notifs = Array.isArray(data) ? data : (data?.notifications || []);
        const pending = notifs.find((n: any) =>
          n.notification_type === 'duel_challenge' && !n.is_read && n.metadata?.room_id && !seenNotifIds.current.has(n.id)
        );
        if (pending) {
          seenNotifIds.current.add(pending.id);
          setIncomingChallenge({ roomId: pending.metadata.room_id, from: pending.actor_username || 'Someone', notifId: pending.id });
        }
      } catch {}
    };
    checkChallenges();
    challengePollRef.current = setInterval(checkChallenges, 5000);
    return () => { if (challengePollRef.current) clearInterval(challengePollRef.current); };
  }, [phase]);

  const buildChoices = useCallback((card: DuelCard, pool: DuelCard[]) => {
    if (card.choices && card.choices.length > 1) { setChoices(card.choices); return; }
    const correct = card.answer;
    const distractors = pool.filter(c => c.id !== card.id).map(c => c.answer).filter(a => a.toLowerCase() !== correct.toLowerCase());
    const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    setChoices([correct, ...shuffled].sort(() => Math.random() - 0.5));
  }, []);

  const isDeckChallenge = searchParams.get('deckChallenge') === '1';

  const loadSoloCards = async (): Promise<DuelCard[]> => {
    const rc = roundsRef.current;
    if (isDeckChallenge) {
      try {
        const raw = sessionStorage.getItem('ariel_deck_challenge_cards');
        if (raw) {
          const parsed: DuelCard[] = JSON.parse(raw);
          if (parsed.length >= rc) return [...parsed].sort(() => Math.random() - 0.5).slice(0, rc);
        }
      } catch {}
    }
    try {
      const data = await cardsAPI.getTrendingCards(rc * 2);
      return data.length >= rc ? data.slice(0, rc) : [...data, ...FALLBACK_CARDS].slice(0, Math.max(data.length, rc));
    } catch {
      return FALLBACK_CARDS.slice(0, rc);
    }
  };

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
          resolveRound(false, botAnsweredRef.current && botCorrectRef.current, idx + 1, allCards);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (mode === 'solo') {
      botAnsweredRef.current = false;
      botCorrectRef.current = Math.random() < 0.65;
      const delay = BOT_DELAYS[Math.floor(Math.random() * BOT_DELAYS.length)];
      botRef.current = setTimeout(() => { botAnsweredRef.current = true; setOpponentAnswered(true); }, delay);
    }
  }, [mode]); // eslint-disable-line

  const resolveRound = useCallback((userCorrect: boolean, opponentCorrect: boolean, nextIdx: number, allCards: DuelCard[]) => {
    clearTimers();
    let roundRes: 'win' | 'lose' | 'tie' = 'tie';
    if (userCorrect && !opponentCorrect) { userScoreRef.current += 1; setUserScore(userScoreRef.current); roundRes = 'win'; }
    else if (opponentCorrect && !userCorrect) { opponentScoreRef.current += 1; setOpponentScore(opponentScoreRef.current); roundRes = 'lose'; }
    else if (userCorrect && opponentCorrect) { userScoreRef.current += 1; opponentScoreRef.current += 1; setUserScore(userScoreRef.current); setOpponentScore(opponentScoreRef.current); }
    setRoundResult(roundRes);
    setPhase('reveal');
    setTimeout(() => {
      if (nextIdx >= roundsRef.current) {
        const u = userScoreRef.current; const o = opponentScoreRef.current;
        setFinalResult(u > o ? 'win' : o > u ? 'lose' : 'tie');
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
      resolveRound(correct, botAnsweredRef.current && botCorrectRef.current, currentIndex + 1, cards);
    } else {
      wsRef.current?.send(JSON.stringify({ type: 'submit_answer', answer: choice }));
    }
  };

  const startSoloDuel = async () => {
    const loaded = await loadSoloCards();
    setCards(loaded);
    setCurrentIndex(0);
    userScoreRef.current = 0; opponentScoreRef.current = 0;
    setUserScore(0); setOpponentScore(0);
    setPhase('countdown');
    let c = 3; setCountdown(c);
    const cd = setInterval(() => {
      c -= 1; setCountdown(c);
      if (c === 0) { clearInterval(cd); beginQuestion(loaded, 0); }
    }, 1000);
  };

  const startQuickMatch = async () => {
    if (quickMatchInProgress.current) return;
    quickMatchInProgress.current = true;
    setMatchmakingLoading(true);
    setWsError('');
    try {
      const data = await duelsAPI.quickMatch(roundsRef.current);
      setRoomId(data.room_id);
      setPhase('waiting');
      if (data.status === 'joined' && data.opponent_username) {
        setOpponentName(data.opponent_username);
        setMatchmakingStatus('Found opponent! Connecting...');
      } else {
        setMatchmakingStatus('Searching for an opponent...');
      }
      connectToRoom(data.room_id);
    } catch {
      setWsError('Could not connect. Please try again.');
      quickMatchInProgress.current = false;
    } finally {
      setMatchmakingLoading(false);
    }
  };

  useEffect(() => {
    if (!challengeQuery.trim() || challengeQuery.length < 2) { setChallengeResults([]); return; }
    const t = setTimeout(async () => {
      try { const res = await socialAPI.searchUsers(challengeQuery, 8); setChallengeResults(res); }
      catch { setChallengeResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [challengeQuery]);

  const sendChallenge = async (username: string) => {
    setChallengeSending(username);
    setWsError('');
    try {
      const deckCards = isDeckChallenge ? (() => {
        try { const raw = sessionStorage.getItem('ariel_deck_challenge_cards'); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
      })() : undefined;
      const data = await duelsAPI.challenge(username, deckCards, roundsRef.current);
      const rid = data.room_id;
      setRoomId(rid);
      setChallengeSent(username);
      setPhase('waiting');
      setMatchmakingStatus(`Waiting for ${username} to accept...`);
      connectToRoom(rid);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const room = await duelsAPI.getRoom(rid);
          if (room.p2_username) { clearInterval(pollRef.current!); pollRef.current = null; setOpponentName(room.p2_username); setMatchmakingStatus(`${room.p2_username} accepted!`); }
          if (room.status === 'finished') { clearInterval(pollRef.current!); pollRef.current = null; }
        } catch { clearInterval(pollRef.current!); pollRef.current = null; }
      }, 2000);
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

  const connectToRoom = (rid: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setWsError('Not logged in.'); return; }
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.close(); }
    const ws = new WebSocket(`${WS_URL}/api/duels/${rid}/ws?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) { try { ws.send(JSON.stringify({ type: 'ping' })); } catch {} }
      }, 20000);
    };
    ws.onmessage = (e) => { const msg = JSON.parse(e.data); handleWsMessage(msg); };
    ws.onerror = () => {
      if (phaseRef.current !== 'waiting' && phaseRef.current !== 'lobby') setWsError('Connection error. Please try again.');
    };
    ws.onclose = () => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      if (phaseRef.current === 'question' || phaseRef.current === 'reveal') setWsError('Disconnected from server.');
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
        setMatchmakingStatus(`${msg.opponent_username} is ready!`);
        setPhase('countdown'); setCountdown(3);
        setUserScore(0); setOpponentScore(0); setCurrentIndex(0);
        { let c = 3; const cd = setInterval(() => { c -= 1; setCountdown(c); if (c === 0) clearInterval(cd); }, 1000); }
        if (gameStartTimeoutRef.current) clearTimeout(gameStartTimeoutRef.current);
        gameStartTimeoutRef.current = setTimeout(() => {
          if (phaseRef.current !== 'question' && phaseRef.current !== 'complete') { setWsError('Game failed to start. Please try again.'); setPhase('waiting'); }
        }, 8000);
        break;
      case 'error':
        setWsError(msg.message || 'Something went wrong.');
        break;
      case 'game_start':
        if (gameStartTimeoutRef.current) clearTimeout(gameStartTimeoutRef.current);
        break;
      case 'round_start':
        if (msg.total) { setRounds(msg.total); roundsRef.current = msg.total; }
        setPhase('question'); setUserAnswer(''); setUserAnswered(false); setOpponentAnswered(false);
        setRoundResult(null); setCurrentIndex((msg.round || 1) - 1); setTimeLeft(15);
        setCards(prev => {
          const updated = [...prev]; const idx = (msg.round || 1) - 1;
          updated[idx] = { id: String(idx), question: msg.question, answer: '', subject: msg.subject || '', choices: msg.choices || [] };
          return updated;
        });
        if (msg.choices) setChoices(msg.choices);
        if (timerRef.current) clearInterval(timerRef.current);
        let t = 15;
        timerRef.current = setInterval(() => { t -= 1; setTimeLeft(t); if (t <= 0) clearInterval(timerRef.current!); }, 1000);
        break;
      case 'opponent_answered':
        setOpponentAnswered(true);
        break;
      case 'round_result':
        clearTimers(); setUserScore(msg.you_score); setOpponentScore(msg.opponent_score);
        setRoundResult(msg.result);
        setCards(prev => {
          const updated = [...prev]; const idx = (msg.round || 1) - 1;
          if (updated[idx]) updated[idx] = { ...updated[idx], answer: msg.correct_answer };
          return updated;
        });
        setPhase('reveal');
        setTimeout(() => { if (msg.round < roundsRef.current) setCurrentIndex(msg.round); }, 2200);
        break;
      case 'game_over':
        clearTimers();
        setUserScore(msg.you_score); setOpponentScore(msg.opponent_score);
        setFinalResult(msg.result === 'win' ? 'win' : msg.result === 'lose' ? 'lose' : 'tie');
        phaseRef.current = 'complete';
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
    wsRef.current?.close(); wsRef.current = null;
    userScoreRef.current = 0; opponentScoreRef.current = 0;
    quickMatchInProgress.current = false;
    setPhase('lobby'); setCards([]); setCurrentIndex(0);
    setUserScore(0); setOpponentScore(0); setRoundResult(null);
    setRoomId(''); setOpponentName(''); setMatchmakingStatus('');
    setChallengeSent(''); setChallengeQuery(''); setWsError('');
  };

  const handleAcceptChallenge = async () => {
    if (!incomingChallenge) return;
    setIncomingChallenge(null);
    setMode('online');
    await acceptChallenge(incomingChallenge.roomId);
    try { await notificationsAPI.markAsRead(incomingChallenge.notifId); } catch {}
  };

  const handleDeclineChallenge = () => {
    if (incomingChallenge) { try { notificationsAPI.markAsRead(incomingChallenge.notifId); } catch {} }
    setIncomingChallenge(null);
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-24 page-enter">

        {/* Incoming challenge banner */}
        {incomingChallenge && (
          <div className="fixed top-0 left-0 right-0 lg:left-[72px] z-50 p-3">
            <div className="max-w-lg mx-auto bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-4 shadow-2xl shadow-violet-900/60 flex items-center gap-3 border border-violet-500/40">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">@{incomingChallenge.from} challenged you!</p>
                <p className="text-violet-200 text-xs mt-0.5">Wants to duel you right now</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleDeclineChallenge} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
                  Decline
                </button>
                <button onClick={handleAcceptChallenge} className="px-3 py-1.5 rounded-lg bg-white text-violet-700 text-xs font-bold transition-colors hover:bg-violet-50">
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/60 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Study Duels</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Head-to-head knowledge battles</p>
            </div>
            {phase !== 'lobby' && (
              <button onClick={resetToLobby} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                Exit
              </button>
            )}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-5">

          {/* ─── LOBBY ───────────────────────────────────────────────────── */}
          {phase === 'lobby' && (
            <div className="space-y-5">
              {isDeckChallenge && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <p className="text-amber-300 text-sm font-medium">Using your deck cards · shuffled by the duel</p>
                </div>
              )}

              {/* Mode cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Bot */}
                <button
                  onClick={() => setMode('solo')}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    mode === 'solo'
                      ? 'bg-zinc-800 border-violet-500/70 shadow-lg shadow-violet-900/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {mode === 'solo' && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-zinc-700/60 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="10" rx="2" strokeLinejoin="round" />
                      <path strokeLinecap="round" d="M9 15h.01M15 15h.01M9 18h6M12 11V7" />
                      <circle cx="12" cy="5.5" r="1.5" />
                      <path strokeLinecap="round" d="M7 11V9a5 5 0 0110 0v2" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm">vs Bot</p>
                  <p className="text-zinc-500 text-xs mt-1">Practice solo, no waiting</p>
                </button>

                {/* Quick Match */}
                <button
                  onClick={() => { setMode('online'); setOnlineTab('quick-match'); }}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    mode === 'online' && onlineTab === 'quick-match'
                      ? 'bg-zinc-800 border-violet-500/70 shadow-lg shadow-violet-900/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {mode === 'online' && onlineTab === 'quick-match' && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-zinc-700/60 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm">Quick Match</p>
                  <p className="text-zinc-500 text-xs mt-1">Random opponent online</p>
                </button>

                {/* Challenge */}
                <button
                  onClick={() => { setMode('online'); setOnlineTab('challenge'); }}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    mode === 'online' && onlineTab === 'challenge'
                      ? 'bg-zinc-800 border-violet-500/70 shadow-lg shadow-violet-900/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {mode === 'online' && onlineTab === 'challenge' && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-zinc-700/60 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm">Challenge</p>
                  <p className="text-zinc-500 text-xs mt-1">Pick a specific player</p>
                </button>
              </div>

              {/* Round selector */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">Rounds</p>
                  <p className="text-xs text-zinc-500">~{rounds * 20}s per round</p>
                </div>
                <div className="flex gap-2">
                  {ROUND_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={() => setRounds(n)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        rounds === n
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {wsError && (
                <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-400">
                  {wsError}
                </div>
              )}

              {/* Mode-specific content */}
              {mode === 'solo' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  {/* VS card */}
                  <div className="p-6 flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-sky-500/15 border-2 border-sky-400/40 flex items-center justify-center text-sky-300 text-xl font-black">Y</div>
                      <span className="text-xs text-zinc-500 font-medium">You</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L4.5 13H11l-1 9 9.5-11H13l1-9z"/></svg>
                      </div>
                      <span className="text-zinc-500 text-xs font-black tracking-widest">VS</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center">
                        <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <rect x="5" y="11" width="14" height="10" rx="2" strokeLinejoin="round" />
                          <path strokeLinecap="round" d="M9 15h.01M15 15h.01M9 18h6M12 11V7" />
                          <circle cx="12" cy="5.5" r="1.5" />
                          <path strokeLinecap="round" d="M7 11V9a5 5 0 0110 0v2" />
                        </svg>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium">{botName} (Bot)</span>
                    </div>
                  </div>
                  <div className="px-6 pb-4 space-y-2">
                    {[
                      { color: 'text-violet-400', text: `${rounds} rounds · 15 seconds each` },
                      { color: 'text-emerald-400', text: 'Choose from 4 options' },
                      { color: 'text-amber-400', text: 'Fastest correct answer wins the round' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.color.replace('text-', 'bg-')}`} />
                        <span className={`text-xs ${r.color} opacity-80`}>{r.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-5">
                    <button
                      onClick={startSoloDuel}
                      className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/40 text-sm"
                    >
                      Start Duel
                    </button>
                  </div>
                </div>
              )}

              {mode === 'online' && onlineTab === 'quick-match' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-violet-500/40 bg-violet-500/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Random Opponent</p>
                      <p className="text-zinc-500 text-sm mt-0.5">Get matched with someone online right now</p>
                    </div>
                  </div>
                  <button
                    onClick={startQuickMatch}
                    disabled={matchmakingLoading}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 text-sm"
                  >
                    {matchmakingLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding opponent...</>
                    ) : 'Find Opponent'}
                  </button>
                </div>
              )}

              {mode === 'online' && onlineTab === 'challenge' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  {challengeSent ? (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-bold">Challenge sent!</p>
                        <p className="text-zinc-400 text-sm mt-1">Waiting for <span className="text-violet-300 font-semibold">@{challengeSent}</span> to accept</p>
                      </div>
                      <div className="flex justify-center">
                        <div className="flex gap-1">
                          {[0, 0.2, 0.4].map((d, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-sm">Search for a player</p>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by username..."
                          value={challengeQuery}
                          onChange={e => setChallengeQuery(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                        />
                      </div>
                      {challengeResults.length > 0 && (
                        <div className="space-y-1">
                          {challengeResults.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-zinc-300">
                                {(user.username?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold">@{user.username}</p>
                                {user.full_name && <p className="text-zinc-500 text-xs truncate">{user.full_name}</p>}
                              </div>
                              <button
                                onClick={() => sendChallenge(user.username)}
                                disabled={challengeSending === user.username}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                              >
                                {challengeSending === user.username
                                  ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  : 'Challenge'
                                }
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {challengeQuery.length >= 2 && challengeResults.length === 0 && (
                        <p className="text-zinc-600 text-sm text-center py-3">No users found</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── WAITING ─────────────────────────────────────────────────── */}
          {phase === 'waiting' && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 text-center">
              {wsError ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold">{wsError}</p>
                    <p className="text-zinc-500 text-sm mt-1">Something went wrong with the connection</p>
                  </div>
                  <button onClick={resetToLobby} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors text-sm">
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  {/* Pulsing radar animation */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-2 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
                    <div className="w-20 h-20 rounded-full border-2 border-violet-400/40 bg-violet-500/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{matchmakingStatus || 'Connecting...'}</p>
                    {opponentName && (
                      <p className="text-violet-300 font-semibold mt-1">vs {opponentName}</p>
                    )}
                    {roomId && !opponentName && (
                      <p className="text-zinc-600 text-xs mt-2 font-mono">Room {roomId.slice(0, 8)}</p>
                    )}
                  </div>
                  <button onClick={resetToLobby} className="text-zinc-600 text-sm hover:text-zinc-400 transition-colors">
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {/* ─── COUNTDOWN ───────────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em]">Duel starting in</p>
              <div
                key={countdown}
                className="text-[96px] font-black text-white leading-none"
                style={{ fontVariantNumeric: 'tabular-nums', animation: 'scaleIn 0.3s ease-out' }}
              >
                {countdown || 'GO'}
              </div>
              {opponentName && (
                <p className="text-zinc-400 text-sm">vs <span className="text-white font-bold">{opponentName}</span></p>
              )}
              <style>{`@keyframes scaleIn { from { transform: scale(1.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
            </div>
          )}

          {/* ─── QUESTION / REVEAL ───────────────────────────────────────── */}
          {(phase === 'question' || phase === 'reveal') && currentCard && (
            <div className="space-y-4">

              {/* Scoreboard */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4">
                <div className="flex items-center">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">You</p>
                    <p className="text-3xl font-black text-violet-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{userScore}</p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Round</p>
                    <p className="text-sm font-bold text-zinc-400">{currentIndex + 1}<span className="text-zinc-700">/{rounds}</span></p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 truncate px-2">{displayOpponent}</p>
                    <p className="text-3xl font-black text-zinc-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{opponentScore}</p>
                  </div>
                </div>
              </div>

              {/* Timer bar */}
              {phase === 'question' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        timeLeft > 8 ? 'bg-violet-400' : timeLeft > 4 ? 'bg-amber-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${(timeLeft / 15) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-black w-5 text-right tabular-nums ${timeLeft <= 4 ? 'text-red-400' : 'text-zinc-500'}`}>{timeLeft}</span>
                </div>
              )}

              {/* Question card */}
              <div className="bg-white rounded-2xl px-6 py-7 shadow-2xl shadow-black/40">
                {currentCard.subject && (
                  <span className="inline-block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{currentCard.subject}</span>
                )}
                <p className="text-2xl font-black text-zinc-900 leading-tight">{currentCard.question}</p>
              </div>

              {/* Opponent status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${opponentAnswered ? 'bg-amber-400' : 'bg-zinc-700'}`} />
                <span className={`text-xs font-medium ${opponentAnswered ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {opponentAnswered ? `${displayOpponent} answered` : `${displayOpponent} is thinking...`}
                </span>
              </div>

              {/* Answer choices */}
              <div className="grid grid-cols-2 gap-2.5">
                {choices.map((choice, i) => {
                  const isSelected = userAnswer === choice;
                  const isCorrect = currentCard.answer && choice.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
                  let cls = 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-violet-500/50 hover:bg-zinc-800 active:scale-[0.98]';
                  if (phase === 'reveal') {
                    if (isCorrect) cls = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
                    else if (isSelected && !isCorrect) cls = 'border-red-700/60 bg-red-950/40 text-red-400';
                    else cls = 'border-zinc-800/50 bg-zinc-900/40 text-zinc-600';
                  } else if (isSelected) {
                    cls = 'border-violet-500/60 bg-violet-950/40 text-violet-200';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleChoiceSelect(choice)}
                      disabled={userAnswered || phase === 'reveal'}
                      className={`p-4 rounded-xl border-2 text-sm font-bold text-left transition-all leading-snug disabled:cursor-default ${cls}`}
                    >
                      <span className="text-xs font-black opacity-40 mr-1.5">{String.fromCharCode(65 + i)}</span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              {/* Round result */}
              {phase === 'reveal' && roundResult && (
                <div className={`rounded-xl p-4 border text-center ${
                  roundResult === 'win' ? 'bg-emerald-950/40 border-emerald-700/40' :
                  roundResult === 'lose' ? 'bg-red-950/40 border-red-800/40' :
                  'bg-zinc-800/40 border-zinc-700/50'
                }`}>
                  <p className={`text-base font-black ${
                    roundResult === 'win' ? 'text-emerald-300' :
                    roundResult === 'lose' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {roundResult === 'win' ? 'You got it first!' : roundResult === 'lose' ? `${displayOpponent} was faster` : 'Tied!'}
                  </p>
                  {currentCard.answer && (
                    <p className="text-xs text-zinc-500 mt-1">Correct: <span className="text-white font-semibold">{currentCard.answer}</span></p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── COMPLETE ────────────────────────────────────────────────── */}
          {phase === 'complete' && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] gap-5 text-center">
              {/* Result icon */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                finalResult === 'win' ? 'bg-emerald-950/50 border-emerald-500/50' :
                finalResult === 'lose' ? 'bg-red-950/50 border-red-700/50' :
                'bg-zinc-800 border-zinc-600'
              }`}>
                {finalResult === 'win' ? (
                  <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                ) : finalResult === 'lose' ? (
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                )}
              </div>

              <div>
                <p className={`text-4xl font-black mb-1 ${
                  finalResult === 'win' ? 'text-emerald-300' : finalResult === 'lose' ? 'text-red-400' : 'text-zinc-300'
                }`}>
                  {finalResult === 'win' ? 'Victory!' : finalResult === 'lose' ? 'Defeated' : 'Draw'}
                </p>
                <p className="text-zinc-500 text-sm">
                  <span className="text-white font-bold">{userScore}</span>
                  <span className="mx-2 text-zinc-700">–</span>
                  <span className="text-zinc-400 font-bold">{opponentScore}</span>
                  <span className="ml-2">vs {displayOpponent}</span>
                </p>
              </div>

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={resetToLobby}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-sm border border-zinc-700"
                >
                  Play Again
                </button>
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
