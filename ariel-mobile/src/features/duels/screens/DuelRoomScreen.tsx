import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useDuelSocket } from '@/features/duels/hooks/useDuelSocket';
import { CountdownTimer } from '@/features/duels/components/CountdownTimer';
import { PlayerStats } from '@/features/duels/components/PlayerStats';
import { DuelCard } from '@/features/duels/components/DuelCard';
import { MatchmakingSpinner } from '@/features/duels/components/MatchmakingSpinner';
import { DuelResultCard } from '@/features/duels/components/DuelResultCard';
import type { DuelGameOverResult } from '@/features/duels/hooks/useDuelSocket';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';

import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<DuelsStackParamList, 'DuelRoom'>;

// XP is server-provided in game_over; we approximate here if not available
const XP_FOR_WIN = 50;
const XP_FOR_TIE = 25;
const XP_FOR_LOSS = 15;

function xpFromResult(result: 'win' | 'lose' | 'tie'): number {
  if (result === 'win') return XP_FOR_WIN;
  if (result === 'tie') return XP_FOR_TIE;
  return XP_FOR_LOSS;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DuelRoomScreen({ route, navigation }: Props): React.ReactElement {
  const { roomId } = route.params;
  const insets = useSafeAreaInsets();

  const [gameResult, setGameResult] = useState<DuelGameOverResult | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);

  // Overlay fade-in for result modal
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handleGameOver = useCallback(
    (result: DuelGameOverResult) => {
      setGameResult(result);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    },
    [overlayOpacity],
  );

  const {
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
  } = useDuelSocket({ roomId, onGameOver: handleGameOver });

  // Wrap submitAnswer to track what was submitted
  const handleAnswer = useCallback(
    (choice: string) => {
      setSubmittedAnswer(choice);
      submitAnswer(choice);
    },
    [submitAnswer],
  );

  // Reset per-round state when a new round starts
  React.useEffect(() => {
    setSubmittedAnswer(null);
  }, [currentQuestion]);

  // ── Handle cancel / back ───────────────────────────────────────────────────

  const handleCancel = () => {
    navigation.goBack();
  };

  const handlePlayAgain = () => {
    navigation.navigate('DuelsLobby');
  };

  const handleViewResult = () => {
    if (!gameResult) return;
    navigation.navigate('DuelResult', { result: gameResult });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.roomLabel}>Room {roomId.slice(0, 6).toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>

      {/* ── Matchmaking spinner ────────────────────────────────────────────── */}
      {waitingForOpponent && !gameOver ? (
        <MatchmakingSpinner yourUsername={yourUsername} onCancel={handleCancel} />
      ) : (
        <View style={styles.content}>
          {/* Player stats */}
          <PlayerStats
            you={{ username: yourUsername ?? 'You', score: scores.you }}
            opponent={
              opponentUsername
                ? { username: opponentUsername, score: scores.opponent }
                : null
            }
            winnerUsername={gameOver && gameResult ? (
              gameResult.result === 'win' ? yourUsername : opponentUsername
            ) : null}
          />

          {/* Countdown timer */}
          <View style={styles.timerWrapper}>
            <CountdownTimer timeLimit={15} timeLeft={timeLeft} />
            <Text style={styles.timerLabel}>{timeLeft}s</Text>
          </View>

          {/* Question card */}
          <DuelCard
            question={currentQuestion}
            choices={choices}
            onAnswer={handleAnswer}
            disabled={waitingForOpponent || gameOver || choices.length === 0}
            correctAnswer={roundResult?.correct_answer ?? null}
            wasCorrect={roundResult?.you_correct ?? null}
            submittedAnswer={submittedAnswer}
          />

          {/* Status text */}
          <View style={styles.statusBar}>
            {roundResult && !gameOver && (
              <Text
                style={[
                  styles.statusText,
                  roundResult.you_correct ? styles.statusCorrect : styles.statusWrong,
                ]}
              >
                {roundResult.you_correct
                  ? '✓ Correct! Next round coming up...'
                  : `✗ The answer was: ${roundResult.correct_answer}`}
              </Text>
            )}
            {gameOver && (
              <Text style={styles.statusText}>Game over — see your result!</Text>
            )}
          </View>
        </View>
      )}

      {/* ── Game over overlay ─────────────────────────────────────────────── */}
      {gameOver && gameResult && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <View style={styles.overlayContent}>
            <DuelResultCard
              result={gameResult}
              xpEarned={xpFromResult(gameResult.result)}
              opponentUsername={opponentUsername}
            />

            {/* Actions */}
            <View style={styles.overlayActions}>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={handleViewResult}
                activeOpacity={0.8}
              >
                <Text style={styles.detailButtonText}>View result</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rematchButton}
                onPress={handlePlayAgain}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color="#ffffff" />
                <Text style={styles.rematchButtonText}>Rematch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Main content
  content: {
    flex: 1,
    gap: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },

  // Timer
  timerWrapper: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  timerLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // Status bar
  statusBar: {
    paddingHorizontal: SPACING.lg,
    minHeight: 24,
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    color: COLORS.textSecondary,
  },
  statusCorrect: {
    color: COLORS.success,
  },
  statusWrong: {
    color: COLORS.error,
  },

  // Game over overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    width: '100%',
    gap: SPACING.xl,
  },
  overlayActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  detailButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  rematchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.violet[600],
  },
  rematchButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});
