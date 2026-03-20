import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { Card } from '@/shared/types/card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);

type CardStatus = 'due' | 'new' | 'learning' | 'mastered';

const STATUS_META: Record<CardStatus, { label: string; bg: string; text: string; border: string }> = {
  due:      { label: 'Review',   bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  new:      { label: 'New',      bg: 'rgba(14,165,233,0.15)', text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  learning: { label: 'Learning', bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  mastered: { label: 'Mastered', bg: 'rgba(34,197,94,0.15)',  text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
};

function getCardStatus(card: Card): CardStatus {
  if (card.review_count === 0) return 'new';
  if (card.interval >= 21) return 'mastered';
  if (card.next_review && new Date(card.next_review) <= new Date()) return 'due';
  return 'learning';
}

interface SnapCardProps {
  card: Card;
  /** Called when the card is flipped (so parent can enable rating buttons) */
  onFlipped?: (flipped: boolean) => void;
}

export function SnapCard({ card, onFlipped }: SnapCardProps) {
  const [flipped, setFlipped] = useState(false);
  const status = getCardStatus(card);
  const statusMeta = STATUS_META[status];
  const subjectKey = normalizeSubjectKey(card.subject ?? card.topic) as SubjectKey;
  const subjectMeta = SUBJECT_META[subjectKey] ?? SUBJECT_META.other;

  const handleTap = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, onFlipped]);

  return (
    <View style={styles.screenContainer}>
      {/* Status pill + subject label row */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
          ]}
        >
          <Text style={[styles.statusPillText, { color: statusMeta.text }]}>
            {statusMeta.label}
          </Text>
        </View>
        <View style={styles.subjectLabel}>
          <Text style={styles.subjectIcon}>{subjectMeta.icon}</Text>
          <Text style={styles.subjectLabelText}>{subjectMeta.short}</Text>
        </View>
      </View>

      {/* Card face */}
      <TouchableWithoutFeedback
        onPress={handleTap}
        accessible
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}
      >
        <View
          style={[
            styles.cardFace,
            { width: CARD_WIDTH },
            flipped && styles.cardFaceFlipped,
          ]}
        >
          {/* Subject accent strip */}
          <View
            style={[
              styles.accentStrip,
              { backgroundColor: subjectMeta.color },
            ]}
          />

          <View style={styles.cardBody}>
            {!flipped ? (
              /* Question side */
              <View style={styles.questionSide}>
                <Text style={styles.questionText}>{card.question}</Text>
                <Text style={styles.tapHint}>tap to reveal</Text>
              </View>
            ) : (
              /* Answer side */
              <View style={styles.answerSide}>
                <Text style={styles.questionFaded} numberOfLines={2}>
                  {card.question}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.answerLabel}>ANSWER</Text>
                <Text style={styles.answerText}>{card.answer}</Text>
                {!!card.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>Explanation</Text>
                    <Text style={styles.explanationText}>{card.explanation}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120, // space for rating buttons
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subjectLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subjectIcon: {
    fontSize: 14,
  },
  subjectLabelText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  cardFace: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 240,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  cardFaceFlipped: {
    backgroundColor: '#fffbeb',
  },
  accentStrip: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    padding: 24,
  },
  questionSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  questionText: {
    color: '#1a1a1a',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '400',
    textAlign: 'center',
  },
  tapHint: {
    color: '#a1a1aa',
    fontSize: 13,
    fontStyle: 'italic',
  },
  answerSide: {
    flex: 1,
  },
  questionFaded: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#fde68a',
    marginBottom: 12,
  },
  answerLabel: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  answerText: {
    color: '#1a1a1a',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
    textAlign: 'center',
  },
  explanationBox: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  explanationLabel: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  explanationText: {
    color: '#78350f',
    fontSize: 13,
    lineHeight: 20,
  },
});
