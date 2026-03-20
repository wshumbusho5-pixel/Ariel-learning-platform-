import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { quickMatch, challengeUser } from '@/features/duels/api/duelsApi';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, SHADOWS } from '@/shared/constants/theme';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<DuelsStackParamList, 'DuelsLobby'>;

// ─── Mock recent duel history (replace with real API call when available) ─────

const RECENT_DUELS = [
  { id: '1', opponent: 'alex_dev', result: 'win' as const, xp: 40 },
  { id: '2', opponent: 'chem_queen', result: 'lose' as const, xp: 15 },
  { id: '3', opponent: 'mathwiz99', result: 'win' as const, xp: 40 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecentDuelRow({
  opponent,
  result,
  xp,
}: {
  opponent: string;
  result: 'win' | 'lose';
  xp: number;
}): React.ReactElement {
  const isWin = result === 'win';
  return (
    <View style={styles.recentRow}>
      {/* Avatar */}
      <View style={styles.recentAvatar}>
        <Text style={styles.recentAvatarText}>{opponent.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.recentInfo}>
        <Text style={styles.recentOpponent}>{opponent}</Text>
        <Text style={styles.recentXp}>+{xp} XP</Text>
      </View>

      <View style={[styles.resultBadge, isWin ? styles.resultBadgeWin : styles.resultBadgeLose]}>
        <Text style={[styles.resultText, isWin ? styles.resultTextWin : styles.resultTextLose]}>
          {isWin ? 'W' : 'L'}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DuelsLobbyScreen({ navigation }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [challengeInput, setChallengeInput] = useState('');
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  // ── Quick match ────────────────────────────────────────────────────────────

  const handleQuickMatch = async () => {
    setLoadingQuick(true);
    try {
      const { room_id } = await quickMatch();
      navigation.navigate('DuelRoom', { roomId: room_id });
    } catch (err) {
      Alert.alert('Matchmaking', 'Could not find a match right now. Try again!');
    } finally {
      setLoadingQuick(false);
    }
  };

  // ── Challenge friend ───────────────────────────────────────────────────────

  const handleChallenge = async () => {
    const username = challengeInput.trim();
    if (!username) return;
    setLoadingChallenge(true);
    try {
      const { room_id } = await challengeUser(username);
      setChallengeInput('');
      navigation.navigate('DuelRoom', { roomId: room_id });
    } catch (err) {
      Alert.alert('Challenge', `Could not challenge @${username}. Check the username and try again.`);
    } finally {
      setLoadingChallenge(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="flash" size={28} color={COLORS.violet[400]} />
            <Text style={styles.headerTitle}>Duels</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Compete head-to-head in real-time quizzes
          </Text>
        </View>

        {/* ── Quick Match ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.quickMatchButton}
          onPress={handleQuickMatch}
          disabled={loadingQuick}
          activeOpacity={0.85}
        >
          {loadingQuick ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="flash" size={24} color="#ffffff" />
          )}
          <Text style={styles.quickMatchText}>
            {loadingQuick ? 'Finding match...' : 'Quick Match'}
          </Text>
        </TouchableOpacity>

        {/* ── Challenge a friend ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge a friend</Text>
          <View style={styles.challengeRow}>
            <TextInput
              style={styles.challengeInput}
              placeholder="Enter username..."
              placeholderTextColor={COLORS.textMuted}
              value={challengeInput}
              onChangeText={setChallengeInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleChallenge}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!challengeInput.trim() || loadingChallenge) && styles.sendButtonDisabled,
              ]}
              onPress={handleChallenge}
              disabled={!challengeInput.trim() || loadingChallenge}
              activeOpacity={0.8}
            >
              {loadingChallenge ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent Duels ──────────────────────────────────────────────── */}
        {RECENT_DUELS.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent duels</Text>
            <View style={styles.recentList}>
              {RECENT_DUELS.map((duel) => (
                <RecentDuelRow
                  key={duel.id}
                  opponent={duel.opponent}
                  result={duel.result}
                  xp={duel.xp}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Tip ───────────────────────────────────────────────────────── */}
        <View style={styles.tip}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.tipText}>
            Beat 3 opponents today for{' '}
            <Text style={styles.tipHighlight}>+100 bonus XP</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: SPACING.lg,
    gap: SPACING['2xl'],
  },

  // Header
  header: {
    paddingTop: SPACING.xl,
    gap: SPACING.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold as '800',
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // Quick Match button
  quickMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.violet[600],
    paddingVertical: SPACING['2xl'],
    borderRadius: BORDER_RADIUS['2xl'],
    ...SHADOWS.lg,
    shadowColor: COLORS.violet[600],
    shadowOpacity: 0.5,
  },
  quickMatchText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: 0.3,
  },

  // Section
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Challenge row
  challengeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  challengeInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surface2,
  },

  // Recent duel list
  recentList: {
    gap: SPACING.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
  recentOpponent: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  recentXp: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeWin: {
    backgroundColor: '#14532d',
  },
  resultBadgeLose: {
    backgroundColor: '#450a0a',
  },
  resultText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  resultTextWin: {
    color: COLORS.success,
  },
  resultTextLose: {
    color: COLORS.error,
  },

  // Tip
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#1c1300',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '33',
  },
  tipText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
  },
  tipHighlight: {
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});
