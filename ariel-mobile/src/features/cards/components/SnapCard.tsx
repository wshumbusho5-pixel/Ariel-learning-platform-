import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import type { Card } from '@/shared/types/card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SnapCardProps {
  card: Card;
  onFlipped?: (flipped: boolean) => void;
}

export function SnapCard({ card, onFlipped }: SnapCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleTap = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, onFlipped]);

  return (
    <View style={styles.screenContainer}>
      <TouchableWithoutFeedback
        onPress={handleTap}
        accessible
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}
      >
        <View style={[styles.card, flipped && styles.cardFlipped]}>
          {!flipped ? (
            /* ── Question side ── */
            <View style={styles.questionSide}>
              <Text style={styles.questionText}>{card.question}</Text>
              <Text style={styles.tapHint}>tap to reveal</Text>
            </View>
          ) : (
            /* ── Answer side ── */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.answerSide}
              showsVerticalScrollIndicator={false}
            >
              {/* Faded question at top */}
              <Text style={styles.questionFaded}>{card.question}</Text>
              <View style={styles.divider} />
              <Text style={styles.answerLabel}>ANSWER</Text>
              <Text style={styles.answerText}>{card.answer}</Text>
              {!!card.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>EXPLANATION</Text>
                  <Text style={styles.explanationText}>{card.explanation}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 130, // space for rating buttons
    paddingTop: 16,
  },

  card: {
    width: '100%',
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  cardFlipped: {
    backgroundColor: '#f5f0e8',
  },

  // Question side
  questionSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  questionText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 26,
    lineHeight: 38,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  tapHint: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 14,
    color: '#b0a898',
    textAlign: 'center',
  },

  // Answer side
  answerSide: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  questionFaded: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 15,
    color: '#c4b8a8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8ddd0',
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#a09080',
    textAlign: 'center',
    marginBottom: 14,
  },
  answerText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 22,
    lineHeight: 34,
    color: '#1a1a1a',
    textAlign: 'center',
  },

  explanationBox: {
    marginTop: 20,
    backgroundColor: 'rgba(200,180,150,0.2)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#c4a882',
  },
  explanationLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#9a7a5a',
    marginBottom: 6,
  },
  explanationText: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 14,
    color: '#6b5040',
    lineHeight: 21,
  },
});
