import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// Simple stable color derived from username first char
const AVATAR_COLORS = [
  '#7c3aed', '#6d28d9', '#4f46e5', '#0369a1',
  '#0f766e', '#15803d', '#b45309', '#c2410c',
  '#9f1239', '#7e22ce',
];

function getAvatarColor(username: string): string {
  const code = username.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface AvatarProps {
  uri?: string | null;
  username: string;
  size?: number;
  onPress?: () => void;
}

export function Avatar({ uri, username, size = 40, onPress }: AvatarProps): React.ReactElement {
  const initials = username.charAt(0).toUpperCase();
  const bgColor = getAvatarColor(username);
  const fontSize = Math.round(size * 0.4);
  const borderRadius = size / 2;

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size, borderRadius }]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
