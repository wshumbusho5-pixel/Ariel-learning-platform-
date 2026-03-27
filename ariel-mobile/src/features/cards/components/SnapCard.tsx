import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { Card } from '@/shared/types/card';

const CARD_VERTICAL_PADDING = 44;

interface SnapCardProps {
  card: Card;
  width: number;
  height: number;
  onFlipped?: (flipped: boolean) => void;
}

export function SnapCard({ card, width, height, onFlipped }: SnapCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleTap = useCallback(() => {
    if (flipped) return; // can only flip question → answer; rating buttons advance
    setFlipped(true);
    onFlipped?.(true);
  }, [flipped, onFlipped]);

  const cardH = height - CARD_VERTICAL_PADDING * 2;

  return (
    <View style={[styles.screenContainer, { width, height }]}>
      {flipped ? (
        <View style={[styles.card, styles.cardFlipped, { height: cardH }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.answerContent}
            showsVerticalScrollIndicator={false}
            bounces
            nestedScrollEnabled
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
      ) : (
        <TouchableOpacity
          style={[styles.card, { height: cardH }]}
          onPress={handleTap}
          activeOpacity={0.95}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Tap to reveal answer"
        >
          <View style={styles.questionSide}>
            <Text style={styles.questionText}>{card.question}</Text>
            <Text style={styles.tapHint}>tap to reveal</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: 20,
    paddingTop: CARD_VERTICAL_PADDING,
    paddingBottom: CARD_VERTICAL_PADDING,
    justifyContent: 'center',
    alignItems: 'stretch',
  },

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
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardFlipped: {
    backgroundColor: '#fef9f0',
    paddingHorizontal: 0,
    paddingVertical: 0,
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

  scroll: {
    flex: 1,
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
