import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { TrendingCard } from '@/features/discover/api/discoverApi';

export function CardViewerModal({ card, onClose }: { card: TrendingCard | null; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const insets = useSafeAreaInsets();

  // Reset flip when card changes
  React.useEffect(() => { setFlipped(false); }, [card?.id]);

  if (!card) return null;
  const subjectKey = normalizeSubjectKey(card.subject) as SubjectKey;
  const meta = SUBJECT_META[subjectKey];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Subject + author */}
        <View style={styles.sheetHeader}>
          <View style={[styles.subjectPill, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.subjectText, { color: meta.color }]}>{meta.short}</Text>
            </View>
          </View>
          {card.author_username && (
            <Text style={styles.author}>@{card.author_username}</Text>
          )}
          <View style={{ flex: 1 }} />
          <View style={styles.likes}>
            <Ionicons name="heart" size={13} color="#f87171" />
            <Text style={styles.likeCount}>{card.likes}</Text>
          </View>
        </View>

        {/* Card face — tappable to flip */}
        <TouchableOpacity
          onPress={() => setFlipped(f => !f)}
          activeOpacity={0.95}
          style={[styles.card, { borderColor: flipped ? meta.color + '55' : '#27272a' }]}
        >
          <View style={[styles.cardAccent, { backgroundColor: flipped ? meta.color : '#3f3f46' }]} />
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, { color: flipped ? meta.color : '#52525b' }]}>
              {flipped ? 'Answer' : 'Question'}
            </Text>
            <Text style={[
              styles.cardText,
              { fontSize: card.question.length > 100 ? 18 : card.question.length > 60 ? 22 : 26 },
              flipped && { color: '#c4b5fd' },
            ]}>
              {flipped ? (card.answer ?? 'No answer') : card.question}
            </Text>
            {flipped && card.explanation ? (
              <View style={styles.explanation}>
                <Text style={styles.explanationLabel}>Why</Text>
                <Text style={styles.explanationText}>{card.explanation}</Text>
              </View>
            ) : null}
            <Text style={styles.tapHint}>
              {flipped ? 'tap to see question \u21ba' : 'tap to reveal answer \u2192'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  subjectText: { fontSize: 12, fontWeight: '700' },
  author: { color: '#71717a', fontSize: 13 },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: '#71717a', fontSize: 13 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    minHeight: 160,
  },
  cardAccent: { width: 4, flexShrink: 0 },
  cardContent: { flex: 1, padding: 20, gap: 10 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    color: '#f4f4f5',
    fontWeight: '600',
    lineHeight: 32,
  },
  explanation: {
    backgroundColor: '#0f0f11',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  explanationLabel: { color: '#52525b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  explanationText: { color: '#a1a1aa', fontSize: 13, lineHeight: 18 },
  tapHint: { color: '#3f3f46', fontSize: 12, marginTop: 4 },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  closeBtnText: { color: '#71717a', fontSize: 15, fontWeight: '600' },
});
