import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { Card } from '@/shared/types/card';

interface SnapCardProps {
  card: Card;
  width: number;
  height: number;
  onFlipped?: (flipped: boolean) => void;
}

export function SnapCard({ card, width, height, onFlipped }: SnapCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleTap = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, onFlipped]);

  return (
    <View style={[styles.screenContainer, { width, height }]}>
      <TouchableWithoutFeedback
        onPress={handleTap}
        accessible
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}
      >
        {/* ── Question side — auto-sized, centered ── */}
        {!flipped ? (
          <View style={styles.card}>
            <View style={styles.questionSide}>
              <Text style={styles.questionText}>{card.question}</Text>
              <Text style={styles.tapHint}>tap to reveal</Text>
            </View>
          </View>
        ) : (
          /* ── Answer side — fills available height, scrolls inside ── */
          <View style={styles.cardFlipped}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.answerContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              <Text style={styles.questionFaded}>{card.question}</Text>
              <View style={styles.divider} />
              <Text style={styles.answerLabel}>Answer</Text>
              <Text style={styles.answerText}>{card.answer}</Text>
              {!!card.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>Why</Text>
                  <Text style={styles.explanationText}>{card.explanation}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
  },

  // ── Question side: auto-height, centered ──
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 36,
    elevation: 20,
  },
  questionSide: {
    alignItems: 'center',
    gap: 24,
  },
  questionText: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 30,
    lineHeight: 42,
    color: '#18181b',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Answer side: fills height, scrolls inside ──
  cardFlipped: {
    flex: 1,
    backgroundColor: '#fef9f0',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 36,
    elevation: 20,
    overflow: 'hidden',
  },
  answerContent: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
  },
  questionFaded: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 16,
    color: '#c4b5c8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e8dfd0',
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  answerText: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 30,
    lineHeight: 44,
    color: '#18181b',
    textAlign: 'center',
  },
  explanationBox: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#f0e8d8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0d0b8',
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  explanationText: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 16,
    color: '#52525b',
    lineHeight: 22,
  },
});
