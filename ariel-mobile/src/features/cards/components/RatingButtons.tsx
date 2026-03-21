import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Rating = 'hard' | 'easy' | 'nailed';

interface RatingConfig {
  key: Rating;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  quality: 2 | 4 | 5;
  idleBg: string;
  idleBorder: string;
  idleText: string;
  activeBg: string;
  activeText: string;
}

const RATINGS: RatingConfig[] = [
  {
    key: 'hard',
    label: 'Hard',
    icon: 'close-circle-outline',
    quality: 2,
    idleBg: 'rgba(244,63,94,0.1)',
    idleBorder: 'rgba(244,63,94,0.3)',
    idleText: '#fb7185',
    activeBg: '#f43f5e',
    activeText: '#ffffff',
  },
  {
    key: 'easy',
    label: 'Easy',
    icon: 'arrow-forward-circle-outline',
    quality: 4,
    idleBg: 'rgba(251,191,36,0.1)',
    idleBorder: 'rgba(251,191,36,0.3)',
    idleText: '#fbbf24',
    activeBg: '#f59e0b',
    activeText: '#ffffff',
  },
  {
    key: 'nailed',
    label: 'Nailed It',
    icon: 'checkmark-circle-outline',
    quality: 5,
    idleBg: 'rgba(16,185,129,0.1)',
    idleBorder: 'rgba(16,185,129,0.3)',
    idleText: '#34d399',
    activeBg: '#10b981',
    activeText: '#ffffff',
  },
];

interface RatingButtonsProps {
  onRate: (quality: 2 | 4 | 5) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  const [pressed, setPressed] = useState<Rating | null>(null);

  const handlePress = (config: RatingConfig) => {
    if (disabled || pressed) return;
    setPressed(config.key);
    onRate(config.quality);
  };

  return (
    <View style={styles.container}>
      {RATINGS.map((config) => {
        const isActive = pressed === config.key;
        return (
          <TouchableOpacity
            key={config.key}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? config.activeBg : config.idleBg,
                borderColor: isActive ? config.activeBg : config.idleBorder,
              },
              disabled && styles.buttonDisabled,
            ]}
            onPress={() => handlePress(config)}
            activeOpacity={0.7}
            disabled={disabled || !!pressed}
            accessibilityRole="button"
            accessibilityLabel={config.label}
          >
            <Ionicons
              name={config.icon}
              size={26}
              color={isActive ? config.activeText : config.idleText}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? config.activeText : config.idleText },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
