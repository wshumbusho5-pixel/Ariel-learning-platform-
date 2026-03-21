import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import type { Card } from '@/shared/types/card';

interface SnapCardProps {
  card: Card;
  width: number;
  headerHeight: number;
  onFlipped?: (flipped: boolean) => void;
}

// Space below card for floating rating buttons + tab bar
const RATING_AREA = 148;

export function SnapCard({ card, width, headerHeight, onFlipped }: SnapCardProps) {
  const { height: screenHeight } = useWindowDimensions();
  const [flipped, setFlipped] = useState(false);

  const handleTap = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, onFlipped]);

  return (
    // Explicit height = full screen so the card fills the space properly
    <View style={[styles.screenContainer, { width, height: screenHeight }]}>
      <TouchableWithoutFeedback
        onPress={handleTap}
        accessible
        accessibilityRole="button"
        accessibilityLabel={flipped ? 'Tap to show question' : 'Tap to reveal answer'}
      >
        <View
          style={[
            styles.card,
            flipped && styles.cardFlipped,
            {
              // Card sits below the floating header, above the rating buttons
              marginTop: headerHeight + 8,
              marginBottom: RATING_AREA,
            },
          ]}
        >
          {!flipped ? (
            /* ── Question side ── */
            <View style={styles.questionSide}>
              <Text style={styles.questionText}>{card.question}</Text>
              <Text style={styles.tapHint}>tap to reveal</Text>
            </View>
          ) : (
            /* ── Answer side — scrollable when long ── */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.answerContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* Faded question at top */}
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
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.70,
    shadowRadius: 40,
    elevation: 20,
  },
  cardFlipped: {
    backgroundColor: '#fffbeb', // amber-50
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

  // Answer side
  answerContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  questionFaded: {
    fontFamily: 'Kalam_400Regular',
    fontSize: 18,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  answerText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 30,
    lineHeight: 42,
    color: '#18181b',
    textAlign: 'center',
  },
  explanationBox: {
    marginTop: 20,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
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
