import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { Reaction } from '@/features/live/hooks/useLiveSocket';

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJI: Record<'heart' | 'fire' | 'clap', string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
};

const FLOAT_DISTANCE = 100; // px to float upward
const ANIMATION_DURATION = 1500; // ms

// ─── Single floating reaction ─────────────────────────────────────────────────

interface FloatingReactionProps {
  reaction: Reaction;
}

function FloatingReaction({ reaction }: FloatingReactionProps): React.ReactElement {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -FLOAT_DISTANCE,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const emoji = REACTION_EMOJI[reaction.type] ?? '❤️';

  return (
    <Animated.View
      style={[
        styles.floatingReaction,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveReactionBarProps {
  reactions: Reaction[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveReactionBar({ reactions }: LiveReactionBarProps): React.ReactElement {
  return (
    <View style={styles.container} pointerEvents="none">
      {reactions.map((reaction) => (
        <FloatingReaction key={reaction.key} reaction={reaction} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 50,
    alignItems: 'center',
    // Reactions stack on top of each other — each animates independently
  },

  floatingReaction: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    fontSize: 28,
  },
});
