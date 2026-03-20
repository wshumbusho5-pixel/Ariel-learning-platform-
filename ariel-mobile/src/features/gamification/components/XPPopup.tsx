import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/shared/constants/theme';

export interface XPPopupHandle {
  show: (amount: number) => void;
}

interface XPPopupProps {
  // No external props needed — controlled via ref
}

/**
 * Animated XP earned popup.
 *
 * Usage:
 *   const xpPopupRef = useRef<XPPopupHandle>(null);
 *   xpPopupRef.current?.show(50);
 *
 *   <XPPopup ref={xpPopupRef} />
 */
export const XPPopup = forwardRef<XPPopupHandle, XPPopupProps>((_props, ref) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [xpAmount, setXpAmount] = React.useState(0);

  useImperativeHandle(ref, () => ({
    show(amount: number) {
      setXpAmount(amount);

      // Reset position
      translateY.setValue(0);
      opacity.setValue(1);

      Animated.sequence([
        // Float up
        Animated.timing(translateY, {
          toValue: -60,
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade out while continuing to rise
        Animated.timing(opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    },
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.pill}>
        <Text style={styles.text}>+{xpAmount} XP</Text>
      </View>
    </Animated.View>
  );
});

XPPopup.displayName = 'XPPopup';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9999,
    bottom: '50%',
  },

  pill: {
    backgroundColor: `${COLORS.violet[600]}ee`,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.violet[400],
  },

  text: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold as any,
    letterSpacing: 1,
  },
});
