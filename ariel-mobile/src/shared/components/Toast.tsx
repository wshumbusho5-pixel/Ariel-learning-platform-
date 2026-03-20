import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
}

const TYPE_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error:   '#ef4444',
  info:    '#7c3aed',
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

const DURATION_MS = 3000;
const ANIMATION_MS = 300;

export function Toast({ message, type = 'info', visible, onHide }: ToastProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: ANIMATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_MS,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [visible, translateY, opacity, onHide]);

  const accentColor = TYPE_COLORS[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={[styles.icon, { color: accentColor }]}>{TYPE_ICONS[type]}</Text>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#27272a',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  accent: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  icon: {
    fontSize: 15,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  message: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});
