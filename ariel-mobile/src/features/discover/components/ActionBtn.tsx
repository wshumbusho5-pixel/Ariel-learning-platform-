import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export interface ActionBtnProps {
  icon: string;
  iconFilled: string;
  active: boolean;
  count?: number;
  color?: string;
  size?: number;
  onPress: () => void;
}

export function ActionBtn({
  icon,
  iconFilled,
  active,
  count,
  color = '#ffffff',
  size = 26,
  onPress,
}: ActionBtnProps) {
  // Reanimated 3 spring scale — TikTok-style press-in/out pulse
  const scale = useSharedValue(1);

  function handlePressIn() {
    scale.value = withSpring(0.85, { damping: 10, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1.15, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    });
    onPress();
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.actionBtn}
    >
      <Animated.View style={animStyle}>
        <Ionicons
          name={(active ? iconFilled : icon) as any}
          size={size}
          color={active ? color : 'rgba(255,255,255,0.85)'}
        />
      </Animated.View>
      {count != null && count > 0 && (
        <Text style={[styles.actionCount, active && { color }]}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

export const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    gap: 3,
    minWidth: 36,
  },
  actionCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
});
