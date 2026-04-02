import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { DuelResultCard } from '@/features/duels/components/DuelResultCard';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';
import type { DuelGameOverResult } from '@/features/duels/hooks/useDuelSocket';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<DuelsStackParamList, 'DuelResult'>;

// ─── XP helper ───────────────────────────────────────────────────────────────

function xpFromResult(result: DuelGameOverResult): number {
  if (result.result === 'win') return 50;
  if (result.result === 'tie') return 25;
  return 15;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DuelResultScreen({ route, navigation }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const result = route.params.result as DuelGameOverResult;
  const xp = xpFromResult(result);

  // ── Share result ───────────────────────────────────────────────────────────

  const handleShare = async () => {
    const outcomeEmoji =
      result.result === 'win' ? '🏆' : result.result === 'tie' ? '🤝' : '💪';
    const outcomeText =
      result.result === 'win'
        ? 'just won'
        : result.result === 'tie'
        ? 'tied'
        : 'fought hard';

    try {
      await Share.share({
        message: `${outcomeEmoji} I ${outcomeText} a duel on Ariel and earned +${xp} XP! (${result.you_score} – ${result.opponent_score})\n\nChallenge me: https://ariel.app/duel`,
      });
    } catch (err) {
      Alert.alert('Share', 'Could not open share sheet.');
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handlePlayAgain = () => {
    navigation.navigate('DuelsLobby');
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg },
      ]}
    >
      {/* Close button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.navigate('DuelsLobby')}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Match Result</Text>
        <View style={styles.closeButton} />
      </View>

      {/* Result card — centered vertically */}
      <View style={styles.cardContainer}>
        <DuelResultCard result={result} xpEarned={xp} opponentUsername={null} />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.shareText}>Share result</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={handlePlayAgain}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color="#ffffff" />
          <Text style={styles.playAgainText}>Play again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },

  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Actions
  actions: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING['2xl'] - 4,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.violet[600],
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
});
