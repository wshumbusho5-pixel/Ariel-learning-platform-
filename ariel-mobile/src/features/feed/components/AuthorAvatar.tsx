import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { SUBJECT_META } from '@/shared/constants/subjects';

// Gradient-like fallback colors paired by index
const FALLBACK_COLORS: [string, string][] = [
  ['#4f46e5', '#7c3aed'],
  ['#0ea5e9', '#1d4ed8'],
  ['#10b981', '#0284c7'],
  ['#8b5cf6', '#4f46e5'],
  ['#f97316', '#be123c'],
  ['#14b8a6', '#0ea5e9'],
  ['#d946ef', '#7c3aed'],
  ['#d97706', '#b45309'],
];

function getFallbackColor(username?: string | null): string {
  if (!username) return FALLBACK_COLORS[0][0];
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (Math.imul(31, h) + username.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length][0];
}

function getInitial(username?: string | null, fullName?: string | null): string {
  const name = fullName ?? username;
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

interface AuthorAvatarProps {
  size?: number;
  username?: string | null;
  fullName?: string | null;
  profilePicture?: string | null;
}

export function AuthorAvatar({
  size = 40,
  username,
  fullName,
  profilePicture,
}: AuthorAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !profilePicture || imageError;
  const fallbackColor = getFallbackColor(username ?? fullName);
  const initial = getInitial(username, fullName);
  const fontSize = Math.max(10, Math.floor(size * 0.4));

  if (showFallback) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fallbackColor,
          },
        ]}
      >
        <Text
          style={[styles.initial, { fontSize }]}
          numberOfLines={1}
        >
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: profilePicture! }}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});
