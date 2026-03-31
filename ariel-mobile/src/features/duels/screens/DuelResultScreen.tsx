import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { DuelResultCard } from '@/features/duels/components/DuelResultCard';
import { createStory } from '@/features/stories/api/storiesApi';
import { StoryType, StoryVisibility } from '@/shared/types/story';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';
import type { DuelGameOverResult } from '@/features/duels/hooks/useDuelSocket';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

type Props = NativeStackScreenProps<DuelsStackParamList, 'DuelResult'>;

function xpFromResult(result: DuelGameOverResult): number {
  if (result.result === 'win') return 50;
  if (result.result === 'tie') return 25;
  return 15;
}

export function DuelResultScreen({ route, navigation }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const result = route.params.result as DuelGameOverResult;
  const opponentUsername = route.params.opponentUsername || null;
  const opponentDisplay = opponentUsername ? `${opponentDisplay}` : 'their opponent';
  const xp = xpFromResult(result);
  const queryClient = useQueryClient();
  const [sharingStory, setSharingStory] = useState(false);
  const [storyShared, setStoryShared] = useState(false);

  const isWin = result.result === 'win';
  const isTie = result.result === 'tie';

  // Build a descriptive result string
  const resultLabel = isWin ? 'Victory' : isTie ? 'Draw' : 'Defeat';
  const scoreText = `${result.you_score} – ${result.opponent_score}`;

  // ── Share to native share sheet ─────────────────────────────────────────────
  const handleShare = async () => {
    const outcomeText = isWin ? 'just won' : isTie ? 'tied' : 'fought hard in';
    try {
      await Share.share({
        message: `I ${outcomeText} a duel on Ariel! ${scoreText} vs ${opponentDisplay} (+${xp} XP)\n\nChallenge me: https://ariel.app/duel`,
      });
    } catch {
      Alert.alert('Share', 'Could not open share sheet.');
    }
  };

  // ── Share to Story ──────────────────────────────────────────────────────────
  const handleShareToStory = async () => {
    if (sharingStory || storyShared) return;
    setSharingStory(true);
    try {
      const content = isWin
        ? `Defeated ${opponentDisplay} ${scoreText}\n+${xp} XP`
        : isTie
        ? `Tied ${opponentDisplay} ${scoreText}\nWhat a match!`
        : `Battled ${opponentDisplay} ${scoreText}`;

      await createStory({
        story_type: StoryType.ACHIEVEMENT,
        content,
        background_color: isWin ? '#b45309' : isTie ? '#1d4ed8' : '#52525b',
        achievement_id: isWin ? 'duel_win' : 'duel_played',
        visibility: StoryVisibility.FOLLOWERS,
      });

      setStoryShared(true);
      // Refresh stories feed
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    } catch {
      Alert.alert('Error', 'Could not share to story. Try again.');
    } finally {
      setSharingStory(false);
    }
  };

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
      {/* Top bar */}
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

      {/* Result card */}
      <View style={styles.cardContainer}>
        <DuelResultCard result={result} xpEarned={xp} opponentUsername={opponentUsername} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Share to Story — prominent for wins */}
        {isWin && (
          <TouchableOpacity
            style={[styles.storyButton, storyShared && styles.storyButtonDone]}
            onPress={handleShareToStory}
            disabled={sharingStory || storyShared}
            activeOpacity={0.8}
          >
            {sharingStory ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : storyShared ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.storyButtonText}>Shared to story!</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.storyButtonText}>Share to Story</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Share externally */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.shareText}>Share result</Text>
        </TouchableOpacity>

        {/* Play again */}
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
    borderBottomColor: '#2f3336',
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
    fontWeight: '600',
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
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  storyButtonDone: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  storyButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#16181c',
    borderWidth: 1,
    borderColor: '#2f3336',
  },
  shareText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '500',
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
    fontWeight: '700',
  },
});
