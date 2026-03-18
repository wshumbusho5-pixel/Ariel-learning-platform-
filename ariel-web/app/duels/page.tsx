'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Round count selector
  const [rounds, setRounds] = useState(5);

  // Solo
  const [botName] = useState(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const botCorrectRef = useRef(false);  // whether the bot actually got this round right
  const botAnsweredRef = useRef(false); // whether the bot has "buzzed in" yet

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
  const gameStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickMatchInProgress = useRef(false);  // ref guard — immune to stale state

  const [incomingChallenge, setIncomingChallenge] = useState<{ roomId: string; from: string; notifId: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenNotifIds = useRef<Set<string>>(new Set());

  // Refs to avoid stale closures in async callbacks
  const phaseRef = useRef<Phase>('lobby');
  const userScoreRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const roundsRef = useRef(5);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundsRef.current = rounds; }, [rounds]);

  const currentCard = cards[currentIndex];
  const displayOpponent = mode === 'online' ? (opponentName || '...') : botName;

  // Handle join from notification link (/duels?join=<roomId>)
  useEffect(() => {
    const joinRoomId = searchParams.get('join');
    if (joinRoomId) {
      setMode('online');
      acceptChallenge(joinRoomId);
    }
    // If launched as deck challenge, default to online challenge tab
    if (searchParams.get('deckChallenge') === '1') {
      setMode('online');
      setOnlineTab('challenge');
    }
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
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
  }, []);

  // Poll for incoming challenges every 5s while in lobby
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
          n.notification_type === 'duel_challenge' &&
          !n.is_read &&
          n.metadata?.room_id &&
          !seenNotifIds.current.has(n.id)
        );
        if (pending) {
          seenNotifIds.current.add(pending.id);
          setIncomingChallenge({
            roomId: pending.metadata.room_id,
            from: pending.actor_username || 'Someone',
            notifId: pending.id,
          });
        }
      } catch {}
    };
    checkChallenges(); // immediate first check
    challengePollRef.current = setInterval(checkChallenges, 5000);
    return () => { if (challengePollRef.current) clearInterval(challengePollRef.current); };
  }, [phase]);

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

  // Deck challenge — cards passed from the session complete screen
  const isDeckChallenge = searchParams.get('deckChallenge') === '1';

  const loadSoloCards = async (): Promise<DuelCard[]> => {
    const rc = roundsRef.current;
    // If launched from deck session, use those cards (shuffled by duel)
    if (isDeckChallenge) {
      try {
        const raw = sessionStorage.getItem('ariel_deck_challenge_cards');
        if (raw) {
          const parsed: DuelCard[] = JSON.parse(raw);
          if (parsed.length >= rc) {
            // Shuffle — duel owns the order, not the user
            return [...parsed].sort(() => Math.random() - 0.5).slice(0, rc);
          }
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
          resolveRound(false, botAnsweredRef.current && botCorrectRef.current, idx + 1, allCards);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (mode === 'solo') {
      // Fresh delay + correctness each round so the bot doesn't always win/lose
      botAnsweredRef.current = false;
      botCorrectRef.current = Math.random() < 0.65; // bot gets ~65% right
      const delay = BOT_DELAYS[Math.floor(Math.random() * BOT_DELAYS.length)];
      botRef.current = setTimeout(() => {
        botAnsweredRef.current = true;
        setOpponentAnswered(true);
      }, delay);
    }
  }, [mode]); // eslint-disable-line

  const resolveRound = useCallback((userCorrect: boolean, opponentCorrect: boolean, nextIdx: number, allCards: DuelCard[]) => {
    clearTimers();
    let roundRes: 'win' | 'lose' | 'tie' = 'tie';

    if (userCorrect && !opponentCorrect) {
      userScoreRef.current += 1;
      setUserScore(userScoreRef.current);
      roundRes = 'win';
    } else if (opponentCorrect && !userCorrect) {
      opponentScoreRef.current += 1;
      setOpponentScore(opponentScoreRef.current);
      roundRes = 'lose';
    } else if (userCorrect && opponentCorrect) {
      userScoreRef.current += 1;
      opponentScoreRef.current += 1;
      setUserScore(userScoreRef.current);
      setOpponentScore(opponentScoreRef.current);
    }
    setRoundResult(roundRes);
    setPhase('reveal');

    setTimeout(() => {
      if (nextIdx >= roundsRef.current) {
        // Compare total scores — NOT just the last round result
        const u = userScoreRef.current;
        const o = opponentScoreRef.current;
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
      // Online: tell server, wait for round_result
      wsRef.current?.send(JSON.stringify({ type: 'submit_answer', answer: choice }));
    }
  };

  const startSoloDuel = async () => {
    const loaded = await loadSoloCards();
    setCards(loaded);
    setCurrentIndex(0);
    userScoreRef.current = 0;
    opponentScoreRef.current = 0;
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
    if (quickMatchInProgress.current) return;  // ref guard — blocks even before state updates
    quickMatchInProgress.current = true;
    setMatchmakingLoading(true);
    setWsError('');
    try {
      const data = await duelsAPI.quickMatch(roundsRef.current);
      setRoomId(data.room_id);
      setPhase('waiting');
      if (data.status === 'joined' && data.opponent_username) {
        setOpponentName(data.opponent_username);
        setMatchmakingStatus(`Found opponent! Connecting...`);
      } else {
        setMatchmakingStatus('Looking for an opponent...');
      }
      connectToRoom(data.room_id);
    } catch {
      setWsError('Could not connect. Please try again.');
      quickMatchInProgress.current = false;
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
      const deckCards = isDeckChallenge ? (() => {
        try { const raw = sessionStorage.getItem('ariel_deck_challenge_cards'); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
      })() : undefined;
      const data = await duelsAPI.challenge(username, deckCards, roundsRef.current);
      const rid = data.room_id;
      setRoomId(rid);
      setChallengeSent(username);
      setPhase('waiting');
      setMatchmakingStatus(`Waiting for ${username} to accept...`);

      // Connect WS immediately — server holds the connection open until opponent joins.
      // This ensures we're already connected when opponent arrives so player_joined fires instantly.
      connectToRoom(rid);

      // Poll only to update the opponent name label in the UI (not for game start)
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const room = await duelsAPI.getRoom(rid);
          if (room.p2_username) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setOpponentName(room.p2_username);
            setMatchmakingStatus(`${room.p2_username} accepted!`);
          }
          // If room no longer exists or is finished, bail
          if (room.status === 'finished') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
          }
        } catch {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
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

  // ── WebSocket ────────────────────────────────────────────────────────────────

  const connectToRoom = (rid: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setWsError('Not logged in.'); return; }
    // Null out old handlers before closing so the close doesn't trigger the error banner
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/api/duels/${rid}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Keepalive ping every 20s so the connection doesn't time out while waiting
      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
        }
      }, 20000);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleWsMessage(msg);
    };

    ws.onerror = () => {
      if (phaseRef.current === 'waiting' || phaseRef.current === 'lobby') {
        // Silently ignore errors while waiting — onclose will handle reconnect
      } else {
        setWsError('Connection error. Please try again.');
      }
    };
    ws.onclose = (event) => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      // Only show error if game was in progress and not cleanly finished
      if (phaseRef.current === 'question' || phaseRef.current === 'reveal') {
        setWsError('Disconnected from server.');
      }
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
        // Start the visual countdown immediately — don't wait for server's game_start
        setPhase('countdown');
        setCountdown(3);
        setUserScore(0);
        setOpponentScore(0);
        setCurrentIndex(0);
        {
          let c = 3;
          const cd = setInterval(() => {
            c -= 1;
            setCountdown(c);
            if (c === 0) clearInterval(cd);
          }, 1000);
        }
        // Safety: if game never starts after 8s, show error
        if (gameStartTimeoutRef.current) clearTimeout(gameStartTimeoutRef.current);
        gameStartTimeoutRef.current = setTimeout(() => {
          if (phaseRef.current !== 'question' && phaseRef.current !== 'complete') {
            setWsError('Game failed to start. Please try again.');
            setPhase('waiting');
          }
        }, 8000);
        break;

      case 'error':
        setWsError(msg.message || 'Something went wrong.');
        break;

      case 'game_start':
        // Countdown already started from player_joined — just clear the safety timeout
        if (gameStartTimeoutRef.current) clearTimeout(gameStartTimeoutRef.current);
        break;

      case 'round_start':
        if (msg.total) { setRounds(msg.total); roundsRef.current = msg.total; }
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
          if (msg.round >= roundsRef.current) {
            // game_over will arrive shortly
          } else {
            setCurrentIndex(msg.round);
          }
        }, 2200);
        break;

      case 'game_over':
        clearTimers();
        userScoreRef.current = msg.you_score;
        opponentScoreRef.current = msg.opponent_score;
        setUserScore(msg.you_score);
        setOpponentScore(msg.opponent_score);
        setFinalResult(msg.result === 'win' ? 'win' : msg.result === 'lose' ? 'lose' : 'tie');
        // Mark complete immediately via ref so ws.onclose doesn't fire error
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
    wsRef.current?.close();
    wsRef.current = null;
    userScoreRef.current = 0;
    opponentScoreRef.current = 0;
    quickMatchInProgress.current = false;
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

  const handleAcceptChallenge = async () => {
    if (!incomingChallenge) return;
    setIncomingChallenge(null);
    setMode('online');
    await acceptChallenge(incomingChallenge.roomId);
    // Mark notification as read
    try { await notificationsAPI.markAsRead(incomingChallenge.notifId); } catch {}
  };

  const handleDeclineChallenge = () => {
    if (incomingChallenge) {
      try { notificationsAPI.markAsRead(incomingChallenge.notifId); } catch {}
    }
    setIncomingChallenge(null);
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-20 page-enter">
        {/* Incoming challenge banner */}
        {incomingChallenge && (
          <div className="fixed top-0 left-0 right-0 lg:left-[72px] z-50 p-4 pt-safe">
            <div className="max-w-2xl mx-auto bg-violet-600 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">⚔️</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Challenge from @{incomingChallenge.from}!</p>
                <p className="text-violet-200 text-xs">Wants to duel you right now</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleDeclineChallenge}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptChallenge}
                  className="px-3 py-1.5 rounded-xl bg-white text-violet-700 text-xs font-bold"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="sticky top-0 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50 z-30">
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
            <SoloLobby opponent={botName} onStart={startSoloDuel} isDeckChallenge={isDeckChallenge} rounds={rounds} onRoundsChange={setRounds} />
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
              isDeckChallenge={isDeckChallenge}
              rounds={rounds}
              onRoundsChange={setRounds}
            />
          )}

          {/* ─── WAITING ─────────────────────────────────────────────────────── */}
          {phase === 'waiting' && (
            <>
              {wsError ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{wsError}</p>
                    <p className="text-zinc-500 text-sm mt-1">The opponent was found but the game couldn&apos;t start.</p>
                  </div>
                  <button onClick={resetToLobby} className="px-6 py-3 bg-violet-400 text-white font-bold rounded-xl">
                    Try Again
                  </button>
                </div>
              ) : (
                <WaitingRoom
                  status={matchmakingStatus}
                  roomId={roomId}
                  opponentName={opponentName}
                  onCancel={resetToLobby}
                />
              )}
            </>
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
              rounds={rounds}
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

const ROUND_OPTIONS = [5, 10, 15, 20];
const ROUND_TIMES: Record<number, string> = { 5: '~2m', 10: '~4m', 15: '~6m', 20: '~8m' };

function RoundSelector({ rounds, onChange }: { rounds: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 font-medium">Rounds</span>
      <div className="flex gap-1">
        {ROUND_OPTIONS.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-2.5 h-8 rounded-lg text-xs font-bold transition-all ${
              rounds === n ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {n}
            {rounds === n && <span className="ml-1 text-[9px] font-medium opacity-75">{ROUND_TIMES[n]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function SoloLobby({ opponent, onStart, isDeckChallenge, rounds, onRoundsChange }: { opponent: string; onStart: () => void; isDeckChallenge?: boolean; rounds: number; onRoundsChange: (n: number) => void }) {
  return (
    <div className="space-y-4">
      {isDeckChallenge && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <p className="text-orange-300 text-sm font-semibold">Using your deck cards · shuffled by the duel</p>
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-8 mb-6">
          <PlayerAvatar label="You" letter="Y" color="sky" />
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 text-violet-400 opacity-70" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L4.5 13H11l-1 9 9.5-11H13l1-9z"/></svg>
            <span className="text-zinc-500 font-black text-sm tracking-widest">VS</span>
          </div>
          <PlayerAvatar label={opponent} letter={opponent[0]} color="zinc" />
        </div>
        <div className="flex justify-center mb-4">
          <RoundSelector rounds={rounds} onChange={onRoundsChange} />
        </div>
        <RulesList rounds={rounds} />
        <button
          onClick={onStart}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-800/60 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L4.5 13H11l-1 9 9.5-11H13l1-9z"/></svg>
          Start duel
        </button>
      </div>
    </div>
  );
}

function OnlineLobby({
  tab, onTabChange, challengeQuery, setChallengeQuery, challengeResults,
  challengeSending, challengeSent, onChallenge, onQuickMatch, matchmakingLoading, wsError,
  isDeckChallenge, rounds, onRoundsChange,
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
  isDeckChallenge?: boolean;
  rounds: number;
  onRoundsChange: (n: number) => void;
}) {
  return (
    <div className="space-y-4">
      {isDeckChallenge && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <p className="text-orange-300 text-sm font-semibold">Challenge with your deck cards · duel shuffles them</p>
        </div>
      )}
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
            <svg className="w-12 h-12 mx-auto text-violet-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Find a Random Opponent</p>
            <p className="text-zinc-400 text-sm">Get matched with someone studying right now. Win to earn followers.</p>
          </div>
          <div className="flex justify-center mb-1">
            <RoundSelector rounds={rounds} onChange={onRoundsChange} />
          </div>
          <RulesList rounds={rounds} />
          <button
            onClick={onQuickMatch}
            disabled={matchmakingLoading}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40"
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
              <p className="text-white font-semibold">Challenge sent to <span className="text-violet-300">@{challengeSent}</span></p>
              <p className="text-zinc-400 text-sm">Waiting for them to accept. You&apos;ll be connected automatically.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm">Challenge anyone — even if they don&apos;t follow you</p>
                <RoundSelector rounds={rounds} onChange={onRoundsChange} />
              </div>
              <input
                type="text"
                placeholder="Search by username..."
                value={challengeQuery}
                onChange={e => setChallengeQuery(e.target.value)}
                className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/50"
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
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
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
      <div className="w-16 h-16 rounded-full border-4 border-violet-300/30 border-t-violet-300 animate-spin" />
      <div>
        <p className="text-white font-semibold text-lg">{status || 'Connecting...'}</p>
        {opponentName && (
          <p className="text-violet-300 font-bold mt-1">{opponentName} is ready!</p>
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
  opponentName, userAnswer, userAnswered, opponentAnswered, roundResult, onChoiceSelect, rounds,
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
  rounds: number;
}) {
  return (
    <div className="space-y-4">
      {/* Scoreboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1 text-center">
          <p className="text-xs text-zinc-500 mb-1">You</p>
          <p className="text-2xl font-black text-violet-300">{userScore}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Round</p>
          <p className="text-sm font-bold text-zinc-300">{currentIndex + 1} / {rounds}</p>
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
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 8 ? 'bg-violet-400' : timeLeft > 4 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-bold w-6 text-right ${timeLeft <= 4 ? 'text-red-400' : 'text-zinc-400'}`}>{timeLeft}</span>
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl px-6 py-7 shadow-xl shadow-black/50">
        {card.subject && (
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{card.subject}</p>
        )}
        <h2 className="text-2xl font-black text-zinc-900 leading-snug">{card.question}</h2>
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
          let cls = 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-violet-300/50 hover:bg-zinc-800';
          if (phase === 'reveal') {
            if (isCorrect) cls = 'border-violet-300 bg-violet-900/30 text-violet-300';
            else if (isSelected && !isCorrect) cls = 'border-red-600 bg-red-900/20 text-red-300';
            else cls = 'border-zinc-800 bg-zinc-900/50 text-zinc-600';
          }
          return (
            <button
              key={i}
              onClick={() => onChoiceSelect(choice)}
              disabled={userAnswered || phase === 'reveal'}
              className={`p-4 rounded-xl border-2 text-base font-bold text-left transition-all leading-snug ${cls} disabled:cursor-default`}
            >
              <span className="text-xs font-bold opacity-50 mr-1.5">{String.fromCharCode(65 + i)}.</span>
              {choice}
            </button>
          );
        })}
      </div>

      {/* Round result */}
      {phase === 'reveal' && roundResult && (
        <div className={`rounded-xl p-5 border text-center ${
          roundResult === 'win' ? 'bg-violet-900/20 border-violet-700/40' :
          roundResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
          'bg-zinc-800/40 border-zinc-700'
        }`}>
          <p className={`text-lg font-black mb-1 ${
            roundResult === 'win' ? 'text-violet-300' :
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
        finalResult === 'win' ? 'bg-violet-900/20 border-violet-700/40' :
        finalResult === 'lose' ? 'bg-red-900/20 border-red-800/40' :
        'bg-zinc-900 border-zinc-800'
      }`}>
        <p className="text-5xl font-black mb-3 text-white">
          {finalResult === 'win' ? 'You won!' : finalResult === 'lose' ? 'You lost' : 'Draw'}
        </p>
        <p className={`text-lg font-bold mb-6 ${
          finalResult === 'win' ? 'text-violet-300' :
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
            className="flex-1 py-3 bg-violet-400 hover:bg-violet-400 text-white font-bold rounded-xl transition-colors"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerAvatar({ label, letter, color }: { label: string; letter: string; color: 'sky' | 'zinc' | string }) {
  const isBot = color === 'zinc';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black ${
        isBot
          ? 'bg-zinc-800 border-2 border-zinc-600 text-zinc-400'
          : 'bg-sky-500/20 border-2 border-sky-400/50 text-sky-300'
      }`}>
        {isBot ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path strokeLinecap="round" d="M9 15h.01M15 15h.01M9 18h6" />
            <path strokeLinecap="round" d="M12 11V7" />
            <circle cx="12" cy="5.5" r="1.5" />
            <path strokeLinecap="round" d="M7 11V9a5 5 0 0110 0v2" />
          </svg>
        ) : letter}
      </div>
      <span className="text-xs font-semibold text-zinc-400">{label}</span>
    </div>
  );
}

function RulesList({ rounds }: { rounds: number }) {
  const rules = [
    {
      icon: (
        <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
        </svg>
      ),
      text: `${rounds} rounds · 15 seconds per question`,
    },
    {
      icon: (
        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'Choose the correct answer from 4 options',
    },
    {
      icon: (
        <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13H11l-1 9 9.5-11H13l1-9z" />
        </svg>
      ),
      text: 'Fastest correct answer wins the round',
    },
    {
      icon: (
        <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M5 3h14l-1.5 8H6.5L5 3zM5 3a2 2 0 00-2 2v0a2 2 0 002 2h14a2 2 0 002-2v0a2 2 0 00-2-2" />
        </svg>
      ),
      text: 'Most rounds won takes the duel',
    },
  ];
  return (
    <div className="space-y-2 text-left mb-6">
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {rule.icon}
          <span className="text-xs text-zinc-400">{rule.text}</span>
        </div>
      ))}
    </div>
  );
}
