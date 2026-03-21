import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Rating = 'hard' | 'easy' | 'nailed';

interface RatingConfig {
  key: Rating;
  label: string;
  quality: 2 | 4 | 5;
  idleBg: string;
  idleBorder: string;
  idleIcon: string;
  activeBg: string;
}

const RATINGS: RatingConfig[] = [
  {
    key: 'hard',
    label: 'Hard',
    quality: 2,
    idleBg: 'rgba(136,19,55,0.85)',
    idleBorder: 'rgba(244,63,94,0.55)',
    idleIcon: '#fb7185',
    activeBg: '#f43f5e',
  },
  {
    key: 'easy',
    label: 'Easy',
    quality: 4,
    idleBg: 'rgba(120,53,15,0.85)',
    idleBorder: 'rgba(245,158,11,0.55)',
    idleIcon: '#fbbf24',
    activeBg: '#f59e0b',
  },
  {
    key: 'nailed',
    label: 'Nailed it',
    quality: 5,
    idleBg: 'rgba(6,78,59,0.85)',
    idleBorder: 'rgba(16,185,129,0.55)',
    idleIcon: '#34d399',
    activeBg: '#10b981',
  },
];

function HardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 18L18 6M6 6l12 12" />
    </Svg>
  );
}

function EasyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </Svg>
  );
}

function NailedIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  );
}

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
        const iconColor = isActive ? '#fff' : config.idleIcon;
        return (
          <TouchableOpacity
            key={config.key}
            style={styles.button}
            onPress={() => handlePress(config)}
            activeOpacity={0.7}
            disabled={disabled || !!pressed}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isActive ? config.activeBg : config.idleBg,
                  borderColor: isActive ? config.activeBg : config.idleBorder,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              {config.key === 'hard'   && <HardIcon color={iconColor} />}
              {config.key === 'easy'   && <EasyIcon color={iconColor} />}
              {config.key === 'nailed' && <NailedIcon color={iconColor} />}
            </View>
            <Text
              style={[
                styles.label,
                { color: disabled ? 'rgba(255,255,255,0.25)' : isActive ? config.idleIcon : 'rgba(255,255,255,0.5)' },
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
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
});
