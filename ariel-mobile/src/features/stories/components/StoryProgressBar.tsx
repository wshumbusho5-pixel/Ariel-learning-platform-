import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export type ProgressState = 'upcoming' | 'active' | 'completed';

export interface StoryProgressBarProps {
  state: ProgressState;
  duration?: number; // ms — used only when state === 'active'
  onComplete?: () => void;
}

export function StoryProgressBar({
  state,
  duration = 5000,
  onComplete,
}: StoryProgressBarProps): React.ReactElement {
  const progress = useRef(new Animated.Value(state === 'completed' ? 1 : 0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Cancel any ongoing animation when state changes
    animationRef.current?.stop();

    if (state === 'completed') {
      progress.setValue(1);
      return;
    }

    if (state === 'upcoming') {
      progress.setValue(0);
      return;
    }

    // Active: animate from current value to 1 over `duration`
    progress.setValue(0);
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });

    return () => {
      animationRef.current?.stop();
    };
  }, [state, duration]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          state === 'upcoming' ? styles.upcoming : styles.activeOrCompleted,
          { width: fillWidth },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
  activeOrCompleted: {
    backgroundColor: '#ffffff',
  },
  upcoming: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
