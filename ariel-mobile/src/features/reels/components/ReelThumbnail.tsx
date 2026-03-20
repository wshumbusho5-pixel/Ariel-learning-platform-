import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/shared/constants/theme';
import { normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map subject key to a background color used as a solid fallback gradient
const SUBJECT_BG: Partial<Record<SubjectKey, string>> = {
  mathematics:  '#1e1b4b',
  sciences:     '#022c22',
  technology:   '#0c1a2e',
  history:      '#1c0a00',
  literature:   '#1c0700',
  economics:    '#12004e',
  languages:    '#012120',
  health:       '#1a0202',
  psychology:   '#03061a',
  geography:    '#0a1500',
  gospel:       '#1a1200',
  business:     '#041020',
  law:          '#0d0d0d',
  arts:         '#130020',
  engineering:  '#1a1200',
};

function getSubjectBg(category?: string | null): string {
  const key = normalizeSubjectKey(category ?? '') as SubjectKey;
  return SUBJECT_BG[key] ?? '#18181b';
}

interface ReelThumbnailProps {
  thumbnailUri?: string | null;
  title: string;
  category?: string | null;
}

export function ReelThumbnail({ thumbnailUri, title, category }: ReelThumbnailProps) {
  const subjectBg = getSubjectBg(category);

  if (thumbnailUri) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: thumbnailUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Bottom fade overlay for text legibility (simulated gradient) */}
        <View style={styles.bottomFade} />
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>
    );
  }

  // Fallback: subject-tinted dark screen + first-letter initial + title
  return (
    <View style={[styles.container, { backgroundColor: subjectBg }]}>
      {/* Radial-like glow: a centered circle with subject color at low opacity */}
      <View style={styles.glowCircle} />
      <Text style={styles.initial} numberOfLines={1}>
        {(title[0] ?? '?').toUpperCase()}
      </Text>
      {/* Bottom fade */}
      <View style={styles.bottomFade} />
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'center',
    top: SCREEN_HEIGHT / 2 - 150,
  },
  initial: {
    fontSize: 120,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.06)',
    position: 'absolute',
  },
  // Simulated gradient: two overlapping semi-transparent views
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 200,
    left: 16,
    right: 80,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    lineHeight: TYPOGRAPHY.fontSize.xl * 1.25,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
