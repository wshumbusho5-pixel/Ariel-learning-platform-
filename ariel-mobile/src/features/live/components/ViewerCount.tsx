import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { TYPOGRAPHY } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ViewerCountProps {
  count: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ViewerCount({ count }: ViewerCountProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current) {
      prevCountRef.current = count;
      // Brief pop animation on count change
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.35,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, scaleAnim]);

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👁</Text>
      <Animated.Text style={[styles.count, { transform: [{ scale: scaleAnim }] }]}>
        {formatted}
      </Animated.Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  count: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
});
