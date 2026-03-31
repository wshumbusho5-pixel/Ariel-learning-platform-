import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '@/shared/constants/theme';

// Stable fallback background colors derived from username
const AVATAR_COLORS = [
  '#7c3aed', '#6d28d9', '#4f46e5', '#0369a1',
  '#0f766e', '#15803d', '#b45309', '#c2410c',
  '#9f1239', '#7e22ce',
];

function getAvatarColor(username: string): string {
  const code = username.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export interface StoryRingProps {
  profilePicture?: string | null;
  username?: string | null;
  seen: boolean;
  size?: number;
  onPress?: () => void;
  onAddPress?: () => void; // separate handler for the + badge
  showAddButton?: boolean;
  showRing?: boolean;
}

export function StoryRing({
  profilePicture,
  username,
  seen,
  size = 56,
  onPress,
  onAddPress,
  showAddButton = false,
  showRing = true,
}: StoryRingProps): React.ReactElement {
  const displayName = username ?? '?';
  const initials = displayName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(displayName);
  const borderRadius = size / 2;
  const innerSize = size - 6; // 3px ring on each side
  const innerRadius = innerSize / 2;
  const addBadgeSize = Math.round(size * 0.32);

  const ringColor = !showRing ? 'transparent' : seen ? COLORS.border : COLORS.violet[600];

  const avatarInner = profilePicture ? (
    <Image
      source={{ uri: profilePicture }}
      style={[
        styles.avatar,
        { width: innerSize, height: innerSize, borderRadius: innerRadius },
      ]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        styles.avatarPlaceholder,
        {
          width: innerSize,
          height: innerSize,
          borderRadius: innerRadius,
          backgroundColor: avatarBg,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.round(innerSize * 0.38) }]}>
        {initials}
      </Text>
    </View>
  );

  const content = (
    <View style={styles.wrapper}>
      {/* Ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius,
            borderColor: ringColor,
          },
        ]}
      >
        {avatarInner}
      </View>

      {/* Add (+) badge for "Your story" — tappable if onAddPress provided */}
      {showAddButton && (
        <TouchableOpacity
          style={[
            styles.addBadge,
            {
              width: addBadgeSize,
              height: addBadgeSize,
              borderRadius: addBadgeSize / 2,
              bottom: 16,
              right: -2,
            },
          ]}
          onPress={onAddPress}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="add" size={addBadgeSize * 0.7} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Username label */}
      <Text
        style={styles.username}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {showAddButton ? 'Your story' : displayName}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 72,
  },
  ring: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addBadge: {
    position: 'absolute',
    backgroundColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
    maxWidth: 68,
    textAlign: 'center',
  },
});
