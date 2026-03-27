import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  return `${API_BASE}${uri}`;
}

export function UserAvatar({ uri, username, size = 40 }: { uri?: string | null; username?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const resolved = resolveUri(uri);
  const letter = (username ?? 'U').charAt(0).toUpperCase();
  if (resolved && !err) {
    return (
      <Image
        source={{ uri: resolved }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.38 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: '#a78bfa', fontWeight: '700' },
});
