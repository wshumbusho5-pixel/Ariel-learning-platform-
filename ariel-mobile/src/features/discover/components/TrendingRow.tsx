import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { TrendingCard } from '@/features/discover/api/discoverApi';

export function TrendingRow({ card, rank, onPress }: { card: TrendingCard; rank?: number; onPress: () => void }) {
  const subjectKey = normalizeSubjectKey(card.subject) as SubjectKey;
  const meta = SUBJECT_META[subjectKey];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      {rank != null && <Text style={styles.rank}>#{rank + 1}</Text>}
      <View style={[styles.accent, { backgroundColor: meta.color }]} />
      <View style={styles.body}>
        <Text style={styles.q} numberOfLines={2}>{card.question}</Text>
        <View style={styles.meta}>
          <View style={[styles.subjectPill, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name={meta.icon as any} size={10} color={meta.color} />
              <Text style={[styles.subjectText, { color: meta.color }]}>{meta.short}</Text>
            </View>
          </View>
          {card.author_username && (
            <Text style={styles.author} numberOfLines={1}>@{card.author_username}</Text>
          )}
          <View style={styles.likes}>
            <Ionicons name="heart" size={11} color="#f87171" />
            <Text style={styles.likeCount}>{card.likes}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#3f3f46" style={{ marginRight: 10 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
    gap: 0,
  },
  rank: {
    color: '#3f3f46',
    fontSize: 11,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
    flexShrink: 0,
  },
  accent: { width: 3, alignSelf: 'stretch', flexShrink: 0 },
  body: { flex: 1, padding: 12, gap: 6 },
  q: { color: '#e4e4e7', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  subjectPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  subjectText: { fontSize: 10, fontWeight: '700' },
  author: { color: '#71717a', fontSize: 11, flex: 1 },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  likeCount: { color: '#71717a', fontSize: 11 },
});
