import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MatchmakingSpinnerProps {
  yourUsername: string | null;
  onCancel: () => void;
}

// ─── Dot component ────────────────────────────────────────────────────────────

function Dot({ delay }: { delay: number }): React.ReactElement {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// ─── Avatar circle ────────────────────────────────────────────────────────────

function AvatarCircle({
  label,
  pulsing = false,
}: {
  label: string;
  pulsing?: boolean;
}): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulsing) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulsing, scale]);

  return (
    <Animated.View style={[styles.avatar, { transform: [{ scale }] }]}>
      <Text style={styles.avatarText}>{label}</Text>
    </Animated.View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MatchmakingSpinner({
  yourUsername,
  onCancel,
}: MatchmakingSpinnerProps): React.ReactElement {
  const initial = yourUsername ? yourUsername.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Finding opponent...</Text>

      {/* Avatar row */}
      <View style={styles.avatarRow}>
        <AvatarCircle label={initial} pulsing />

        {/* Animated dots between avatars */}
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>

        {/* Opponent placeholder — dashed pulsing circle */}
        <AvatarCircle label="?" pulsing />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Matching you with a player of similar level
      </Text>

      {/* Cancel button */}
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.75}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2xl'],
    paddingHorizontal: SPACING['3xl'],
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    textAlign: 'center',
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.6,
  },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
    borderWidth: 2,
    borderColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Connecting dots
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet[500],
  },

  // Cancel
  cancelButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['3xl'],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
});
