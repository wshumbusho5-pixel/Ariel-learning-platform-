import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserAvatar } from './UserAvatar';
import apiClient from '@/shared/api/client';
import { SOCIAL } from '@/shared/api/endpoints';
import type { SearchUserResult } from '@/features/discover/api/discoverApi';

export function PeopleCard({ user }: { user: SearchUserResult }) {
  const [following, setFollowing] = useState(user.is_following);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const prev = following;
    setFollowing(!prev);
    setPending(true);
    try {
      await apiClient.post(SOCIAL.FOLLOW(user.id));
    } catch {
      setFollowing(prev);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.card}>
      <UserAvatar uri={user.profile_picture} username={user.username} size={52} />
      <Text style={styles.name} numberOfLines={1}>{user.full_name ?? user.username}</Text>
      <Text style={styles.username} numberOfLines={1}>@{user.username}</Text>
      <TouchableOpacity
        onPress={toggle}
        disabled={pending}
        activeOpacity={0.75}
        style={[styles.btn, following && styles.followingBtn]}
      >
        <Text style={[styles.btnText, following && styles.followingBtnText]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 90, alignItems: 'center', gap: 4 },
  name: { color: '#e4e4e7', fontSize: 12, fontWeight: '700', textAlign: 'center', width: '100%' },
  username: { color: '#71717a', fontSize: 10, textAlign: 'center', width: '100%' },
  btn: {
    marginTop: 4, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999, backgroundColor: '#7c3aed',
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3f3f46' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  followingBtnText: { color: '#71717a' },
});
