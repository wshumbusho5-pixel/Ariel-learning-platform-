import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, SHADOWS } from '@/shared/constants/theme';
import type { DuelGameOverResult } from '@/features/duels/hooks/useDuelSocket';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DuelResultCardProps {
  result: DuelGameOverResult;
  xpEarned: number;
  opponentUsername: string | null;
}

// ─── Config per outcome ───────────────────────────────────────────────────────

const OUTCOME_CONFIG = {
  win: {
    icon: '🏆',
    headline: 'You won!',
    subtext: 'Outstanding performance!',
    accentColor: COLORS.warning,       // amber
    bgColor: '#1c1300',
    borderColor: COLORS.warning,
    textColor: COLORS.warning,
  },
  lose: {
    icon: '💪',
    headline: 'Keep going!',
    subtext: "Every loss is a lesson. You've got this.",
    accentColor: COLORS.surface2,      // zinc
    bgColor: '#18181b',
    borderColor: COLORS.border,
    textColor: COLORS.textSecondary,
  },
  tie: {
    icon: '🤝',
    headline: 'Tie game!',
    subtext: "Perfectly matched — rematch to settle it!",
    accentColor: COLORS.info,
    bgColor: '#0c1a2e',
    borderColor: COLORS.info,
    textColor: COLORS.info,
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function DuelResultCard({
  result,
  xpEarned,
  opponentUsername,
}: DuelResultCardProps): React.ReactElement {
  const config = OUTCOME_CONFIG[result.result];

  // Entrance animation
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: config.bgColor,
          borderColor: config.accentColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Trophy / Icon */}
      <Text style={styles.icon}>{config.icon}</Text>

      {/* Headline */}
      <Text style={[styles.headline, { color: config.textColor }]}>
        {config.headline}
      </Text>

      {/* XP earned */}
      <View style={[styles.xpBadge, { backgroundColor: config.accentColor + '22' }]}>
        <Text style={[styles.xpText, { color: config.accentColor }]}>
          +{xpEarned} XP
        </Text>
      </View>

      {/* Score breakdown */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>You</Text>
          <Text style={[styles.scoreNum, { color: config.textColor }]}>
            {result.you_score}
          </Text>
        </View>
        <Text style={styles.scoreDivider}>—</Text>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>
            {opponentUsername ?? 'Opponent'}
          </Text>
          <Text style={styles.scoreNum}>{result.opponent_score}</Text>
        </View>
      </View>

      {/* Sub-text */}
      <Text style={styles.subtext}>{config.subtext}</Text>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1.5,
    padding: SPACING['3xl'],
    alignItems: 'center',
    gap: SPACING.lg,
    marginHorizontal: SPACING.lg,
    ...SHADOWS.lg,
  },

  icon: {
    fontSize: 64,
  },

  headline: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold as '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  xpBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
  },
  xpText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Score breakdown
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    marginVertical: SPACING.xs,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 2,
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreNum: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  scoreDivider: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xl,
  },

  subtext: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.6,
  },
});
