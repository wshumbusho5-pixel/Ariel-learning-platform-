import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseWebSocketManager } from '@/shared/api/websocket';
import { useAuthStore } from '@/shared/auth/authStore';
import { DUELS } from '@/shared/api/endpoints';
import type {
  DuelWsMessage,
  DuelWsClientMessage,
  DuelWsRoundStart,
  DuelWsGameOver,
  DuelWsRoundResult,
} from '@/shared/types/duel';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface DuelScores {
  you: number;
  opponent: number;
}

export interface DuelGameOverResult {
  you_score: number;
  opponent_score: number;
  result: 'win' | 'lose' | 'tie';
}

export interface UseDuelSocketOptions {
  roomId: string;
  onGameOver: (result: DuelGameOverResult) => void;
}

export interface UseDuelSocketReturn {
  /** Current question text, null between rounds */
  currentQuestion: string | null;
  /** Current choices (A/B/C/D), empty between rounds */
  choices: string[];
  /** Seconds remaining this round (counts down from time_limit) */
  timeLeft: number;
  /** Latest scores for both players */
  scores: DuelScores;
  /** True once game_over has been received */
  gameOver: boolean;
  /** Round result (correct answer + who got it right) */
  roundResult: DuelWsRoundResult | null;
  /** Whether we are waiting for a second player */
  waitingForOpponent: boolean;
  /** Opponent's username once they join */
  opponentUsername: string | null;
  /** Your username as confirmed by the server */
  yourUsername: string | null;
  /** Submit an answer choice */
  submitAnswer: (choice: string) => void;
  /** Whether the WS is connected */
  isConnected: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDuelSocket({
  roomId,
  onGameOver,
}: UseDuelSocketOptions): UseDuelSocketReturn {
  const token = useAuthStore((s) => s.token);

  const wsRef = useRef(
    new BaseWebSocketManager<DuelWsMessage, DuelWsClientMessage>({ maxRetries: 3 }),
  );

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [scores, setScores] = useState<DuelScores>({ you: 0, opponent: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [roundResult, setRoundResult] = useState<DuelWsRoundResult | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);
  const [opponentUsername, setOpponentUsername] = useState<string | null>(null);
  const [yourUsername, setYourUsername] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // ── Countdown helpers ──────────────────────────────────────────────────────

  const clearCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (seconds: number) => {
      clearCountdown();
      setTimeLeft(seconds);
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearCountdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearCountdown],
  );

  // ── Message handler ────────────────────────────────────────────────────────

  useEffect(() => {
    const ws = wsRef.current;

    const removeHandler = ws.onMessage((msg: DuelWsMessage) => {
      switch (msg.type) {
        case 'connected': {
          setIsConnected(true);
          setYourUsername(msg.your_username);
          if (msg.opponent_username) {
            setOpponentUsername(msg.opponent_username);
            setWaitingForOpponent(false);
          }
          break;
        }

        case 'waiting': {
          setWaitingForOpponent(true);
          break;
        }

        case 'player_joined': {
          setOpponentUsername(msg.opponent_username);
          setWaitingForOpponent(false);
          break;
        }

        case 'game_start': {
          // Server countdown before first round — reset scores
          setScores({ you: 0, opponent: 0 });
          setRoundResult(null);
          break;
        }

        case 'round_start': {
          const rs = msg as DuelWsRoundStart;
          setCurrentQuestion(rs.question);
          setChoices(rs.choices);
          setRoundResult(null);
          startCountdown(15);
          break;
        }

        case 'round_result': {
          clearCountdown();
          setTimeLeft(0);
          setRoundResult(msg as DuelWsRoundResult);
          setScores({ you: msg.you_score, opponent: msg.opponent_score });
          break;
        }

        case 'game_over': {
          clearCountdown();
          const go = msg as DuelWsGameOver;
          setGameOver(true);
          setScores({ you: go.you_score, opponent: go.opponent_score });
          onGameOver({
            you_score: go.you_score,
            opponent_score: go.opponent_score,
            result: go.result,
          });
          break;
        }

        case 'opponent_disconnected': {
          // Treat as waiting state again
          setWaitingForOpponent(true);
          setOpponentUsername(null);
          break;
        }

        case 'error': {
          console.warn('[DuelSocket] Server error:', msg.message);
          break;
        }
      }
    });

    return removeHandler;
  }, [onGameOver, startCountdown, clearCountdown]);

  // ── Connect / disconnect on mount ──────────────────────────────────────────

  useEffect(() => {
    const ws = wsRef.current;
    ws.connect(DUELS.WS(roomId), token ?? undefined);

    return () => {
      clearCountdown();
      ws.disconnect();
    };
  // token and roomId are stable for the lifetime of the room screen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── submitAnswer ───────────────────────────────────────────────────────────

  const submitAnswer = useCallback(
    (choice: string) => {
      clearCountdown();
      wsRef.current.send({ type: 'submit_answer', answer: choice });
    },
    [clearCountdown],
  );

  return {
    currentQuestion,
    choices,
    timeLeft,
    scores,
    gameOver,
    roundResult,
    waitingForOpponent,
    opponentUsername,
    yourUsername,
    submitAnswer,
    isConnected,
  };
}
