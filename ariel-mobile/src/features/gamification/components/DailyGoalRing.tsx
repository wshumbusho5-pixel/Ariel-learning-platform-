import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/shared/constants/theme';

interface DailyGoalRingProps {
  completed: number;
  target: number;
}

const RING_SIZE = 100;
const STROKE_WIDTH = 8;
const HALF_RING = RING_SIZE / 2;

/**
 * Two half-circles technique (no SVG required):
 *
 * We render:
 *   - A full gray outer circle as background
 *   - Two "half disc" views (left half, right half) that we rotate to reveal
 *     progress like a clock hand sweeping from 0 → 360 degrees.
 *
 * For percentage P (0–1):
 *   - If P <= 0.5: Only right half is revealed. Rotate right disc from -180° to 0°.
 *   - If P > 0.5:  Right half fully revealed (0°). Left half fills from 0° to 180°
 *                  proportional to how much past 50% we are.
 *
 * The center "cutout" circle masks the inner area so only the stroke ring shows.
 */
export function DailyGoalRing({ completed, target }: DailyGoalRingProps) {
  const pct = target > 0 ? Math.min(1, completed / target) : 0;

  // Color logic
  let ringColor: string;
  if (pct >= 1) {
    ringColor = COLORS.violet[500];
  } else if (pct > 0) {
    ringColor = COLORS.warning;
  } else {
    ringColor = COLORS.textMuted;
  }

  // Right half: rotates from -180deg (hidden) to 0deg (fully shown) for first 50%
  const rightRotation = pct <= 0.5
    ? -180 + pct * 2 * 180   // -180 → 0
    : 0;

  // Left half: starts at 0deg, rotates to 180deg for the second 50%
  const leftRotation = pct <= 0.5
    ? 0
    : (pct - 0.5) * 2 * 180; // 0 → 180

  return (
    <View style={styles.wrapper}>
      {/* Background full circle */}
      <View style={[styles.ring, styles.ringBg]} />

      {/* Right half mask clip */}
      <View style={[styles.halfContainer, styles.rightContainer]}>
        <View style={[
          styles.halfDisc,
          styles.rightDisc,
          { backgroundColor: ringColor, transform: [{ rotate: `${rightRotation}deg` }] },
        ]} />
      </View>

      {/* Left half mask clip */}
      <View style={[styles.halfContainer, styles.leftContainer]}>
        <View style={[
          styles.halfDisc,
          styles.leftDisc,
          {
            backgroundColor: pct > 0.5 ? ringColor : 'transparent',
            transform: [{ rotate: `${leftRotation}deg` }],
          },
        ]} />
      </View>

      {/* Inner cutout to create ring effect */}
      <View style={styles.innerCutout} />

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={[styles.countText, { color: ringColor }]}>
          {completed}/{target}
        </Text>
      </View>
    </View>
  );
}

const INNER_SIZE = RING_SIZE - STROKE_WIDTH * 2;

const styles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: HALF_RING,
  },

  ringBg: {
    backgroundColor: COLORS.surface2,
  },

  // Clip containers — each hides one half of the disc
  halfContainer: {
    position: 'absolute',
    top: 0,
    width: HALF_RING,
    height: RING_SIZE,
    overflow: 'hidden',
  },

  rightContainer: {
    right: 0,
  },

  leftContainer: {
    left: 0,
  },

  // Full circle disc anchored to their respective edge
  halfDisc: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: HALF_RING,
  },

  // Right disc is anchored left (so rotation pivots around ring center)
  rightDisc: {
    left: -HALF_RING,
    // rotate from right edge = transform-origin right center
  },

  // Left disc is anchored right
  leftDisc: {
    right: -HALF_RING,
  },

  // White (background) inner circle to cut out center
  innerCutout: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: COLORS.background,
  },

  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    letterSpacing: 0.5,
  },
});
