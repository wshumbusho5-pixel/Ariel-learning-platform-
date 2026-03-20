import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CountdownTimerProps {
  /** Total seconds for the round */
  timeLimit: number;
  /** Current seconds remaining */
  timeLeft: number;
}

// ─── Helper: derive bar color ─────────────────────────────────────────────────

function barColor(timeLeft: number): string {
  if (timeLeft < 4) return COLORS.error;      // red
  if (timeLeft < 8) return COLORS.warning;    // yellow
  return COLORS.success;                       // green
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CountdownTimer({ timeLimit, timeLeft }: CountdownTimerProps): React.ReactElement {
  const widthAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(timeLeft)).current;

  // Animate width whenever timeLeft changes
  useEffect(() => {
    const ratio = timeLimit > 0 ? timeLeft / timeLimit : 0;
    Animated.timing(widthAnim, {
      toValue: ratio,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, timeLimit, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const color = barColor(timeLeft);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: animatedWidth,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});
