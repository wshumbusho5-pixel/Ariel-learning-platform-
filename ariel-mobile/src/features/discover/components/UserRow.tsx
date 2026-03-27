import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserAvatar } from './UserAvatar';
import apiClient from '@/shared/api/client';
import { SOCIAL } from '@/shared/api/endpoints';
import type { SearchUserResult } from '@/features/discover/api/discoverApi';

export function UserRow({ user }: { user: SearchUserResult }) {
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
    <View style={styles.row}>
      <UserAvatar uri={user.profile_picture} username={user.username} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{user.full_name ?? user.username}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text> : null}
      </View>
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
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1c1c1e',
  },
  text: { flex: 1, gap: 1, minWidth: 0 },
  name: { color: '#e4e4e7', fontSize: 14, fontWeight: '700' },
  username: { color: '#71717a', fontSize: 12 },
  bio: { color: '#52525b', fontSize: 12, marginTop: 1 },
  btn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#7c3aed', flexShrink: 0 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3f3f46' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  followingBtnText: { color: '#71717a' },
});
