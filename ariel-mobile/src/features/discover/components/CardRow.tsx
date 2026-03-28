import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { TrendingCard } from '@/features/discover/api/discoverApi';

export function CardRow({ card, onPress }: { card: TrendingCard; onPress: () => void }) {
  const subjectKey = normalizeSubjectKey(card.subject) as SubjectKey;
  const meta = SUBJECT_META[subjectKey];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={[styles.accent, { backgroundColor: meta.color }]} />
      <View style={styles.body}>
        <Text style={styles.q} numberOfLines={2}>{card.question}</Text>
        <View style={styles.meta}>
          <View style={[styles.pill, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name={meta.icon as any} size={10} color={meta.color} />
              <Text style={[styles.pillText, { color: meta.color }]}>{meta.short}</Text>
            </View>
          </View>
          {card.author_username && <Text style={styles.author}>@{card.author_username}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#3f3f46" style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#18181b', borderRadius: 12, borderWidth: 1, borderColor: '#27272a', overflow: 'hidden',
  },
  accent: { width: 3, flexShrink: 0 },
  body: { flex: 1, padding: 12, gap: 6 },
  q: { color: '#e4e4e7', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 10, fontWeight: '700' },
  author: { color: '#71717a', fontSize: 11 },
});
