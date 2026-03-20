import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shouldPulse = streak >= 7;

  useEffect(() => {
    if (!shouldPulse) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [shouldPulse, pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.flameEmoji, { transform: [{ scale: pulseAnim }] }]}
        accessibilityLabel="Fire emoji"
      >
        🔥
      </Animated.Text>
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.xs,
  },

  flameEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },

  count: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    lineHeight: TYPOGRAPHY.fontSize['3xl'] * 1.2,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
});
