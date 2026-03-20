import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, SHADOWS } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerState = 'idle' | 'correct' | 'wrong';

interface DuelCardProps {
  question: string | null;
  choices: string[];
  /** Called when user selects an answer */
  onAnswer: (choice: string) => void;
  /** Disabled until round_start; also locked after answering */
  disabled?: boolean;
  /** Correct answer revealed after round ends */
  correctAnswer?: string | null;
  /** Whether the player's last answer was correct */
  wasCorrect?: boolean | null;
  /** The answer the player submitted */
  submittedAnswer?: string | null;
}

// ─── Choice label helpers ─────────────────────────────────────────────────────

const LABELS = ['A', 'B', 'C', 'D'];

// ─── Component ────────────────────────────────────────────────────────────────

export function DuelCard({
  question,
  choices,
  onAnswer,
  disabled = false,
  correctAnswer = null,
  wasCorrect = null,
  submittedAnswer = null,
}: DuelCardProps): React.ReactElement {
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  // Reset local selection whenever question changes
  React.useEffect(() => {
    setLocalSelected(null);
  }, [question]);

  const hasAnswered = localSelected !== null || submittedAnswer !== null;
  const isLocked = disabled || hasAnswered;

  const handlePress = (choice: string) => {
    if (isLocked) return;
    setLocalSelected(choice);
    onAnswer(choice);
  };

  // Determine button appearance after answer
  const getChoiceStyle = (choice: string): AnswerState => {
    if (!hasAnswered) return 'idle';
    // Reveal correct answer (from round_result)
    if (correctAnswer) {
      if (choice === correctAnswer) return 'correct';
      if (choice === (localSelected ?? submittedAnswer)) return 'wrong';
    } else if (choice === (localSelected ?? submittedAnswer)) {
      // Pre-result: just highlight selected
      return wasCorrect === true ? 'correct' : wasCorrect === false ? 'wrong' : 'idle';
    }
    return 'idle';
  };

  return (
    <View style={styles.card}>
      {/* Question */}
      <View style={styles.questionContainer}>
        {question ? (
          <Text style={styles.questionText}>{question}</Text>
        ) : (
          <Text style={styles.placeholderText}>Get ready...</Text>
        )}
      </View>

      {/* Choices */}
      <View style={styles.choicesContainer}>
        {choices.length > 0
          ? choices.map((choice, idx) => {
              const state = getChoiceStyle(choice);
              return (
                <TouchableOpacity
                  key={`${choice}-${idx}`}
                  style={[
                    styles.choiceButton,
                    state === 'correct' && styles.choiceCorrect,
                    state === 'wrong' && styles.choiceWrong,
                    (localSelected ?? submittedAnswer) === choice &&
                      state === 'idle' &&
                      styles.choiceSelected,
                    isLocked && styles.choiceLocked,
                  ]}
                  onPress={() => handlePress(choice)}
                  activeOpacity={isLocked ? 1 : 0.75}
                  disabled={isLocked}
                >
                  {/* Label chip */}
                  <View
                    style={[
                      styles.labelChip,
                      state === 'correct' && styles.labelChipCorrect,
                      state === 'wrong' && styles.labelChipWrong,
                    ]}
                  >
                    <Text
                      style={[
                        styles.labelText,
                        (state === 'correct' || state === 'wrong') &&
                          styles.labelTextActive,
                      ]}
                    >
                      {LABELS[idx] ?? String(idx + 1)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.choiceText,
                      state === 'correct' && styles.choiceTextCorrect,
                      state === 'wrong' && styles.choiceTextWrong,
                    ]}
                    numberOfLines={2}
                  >
                    {choice}
                  </Text>
                </TouchableOpacity>
              );
            })
          : // Placeholder skeleton choices
            LABELS.map((label) => (
              <View key={label} style={[styles.choiceButton, styles.choicePlaceholder]}>
                <View style={[styles.labelChip, styles.labelChipPlaceholder]} />
                <View style={styles.textPlaceholder} />
              </View>
            ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS['2xl'],
    marginHorizontal: SPACING.lg,
    padding: SPACING['2xl'],
    ...SHADOWS.lg,
  },

  // Question
  questionContainer: {
    marginBottom: SPACING['2xl'],
    minHeight: 80,
    justifyContent: 'center',
  },
  questionText: {
    color: '#09090b',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    lineHeight: TYPOGRAPHY.fontSize.xl * 1.4,
    textAlign: 'center',
  },
  placeholderText: {
    color: '#a1a1aa',
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Choices
  choicesContainer: {
    gap: SPACING.sm,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#f4f4f5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  choiceSelected: {
    borderColor: COLORS.violet[600],
    backgroundColor: COLORS.violet[50],
  },
  choiceCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: COLORS.success,
  },
  choiceWrong: {
    backgroundColor: '#fee2e2',
    borderColor: COLORS.error,
  },
  choiceLocked: {
    opacity: 0.85,
  },
  choicePlaceholder: {
    opacity: 0.4,
  },

  // Label chip (A/B/C/D)
  labelChip: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelChipCorrect: {
    backgroundColor: COLORS.success,
  },
  labelChipWrong: {
    backgroundColor: COLORS.error,
  },
  labelChipPlaceholder: {
    backgroundColor: '#d4d4d8',
  },
  labelText: {
    color: '#52525b',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  labelTextActive: {
    color: '#ffffff',
  },

  // Choice text
  choiceText: {
    flex: 1,
    color: '#18181b',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  choiceTextCorrect: {
    color: '#15803d',
  },
  choiceTextWrong: {
    color: '#dc2626',
  },

  // Placeholder shimmer bar
  textPlaceholder: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#d4d4d8',
  },
});
