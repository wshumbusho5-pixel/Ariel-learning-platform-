import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarEditorProps {
  user: { full_name?: string | null; username?: string | null; profile_picture?: string | null } | null;
  localAvatarUri: string | null;
  avatarUploading: boolean;
  onPickAvatar: () => void;
  isShort: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvatarEditor({
  user,
  localAvatarUri,
  avatarUploading,
  onPickAvatar,
  isShort,
}: AvatarEditorProps) {
  const displayUri = localAvatarUri ?? user?.profile_picture;

  return (
    <View style={[styles.avatarSection, isShort && styles.avatarSectionShort]}>
      <TouchableOpacity
        style={isShort ? styles.avatarWrapperShort : styles.avatarWrapper}
        onPress={onPickAvatar}
        disabled={avatarUploading}
        activeOpacity={0.8}
      >
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={isShort ? styles.avatarShort : styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={isShort ? styles.avatarFallbackShort : styles.avatarFallback}>
            <Text style={[styles.avatarInitial, isShort && styles.avatarInitialShort]}>
              {(user?.full_name ?? user?.username ?? '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          {avatarUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={14} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  avatarSectionShort: {
    paddingVertical: 2,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
  },
  avatarWrapperShort: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarShort: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarFallbackShort: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarInitial: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  avatarInitialShort: {
    fontSize: 24,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
});
