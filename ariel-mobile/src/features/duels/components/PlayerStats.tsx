import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayerStats {
  username: string;
  score: number;
}

interface PlayerStatsProps {
  you: PlayerStats;
  opponent: PlayerStats | null;
  /** When game ends, pass the winner's username to highlight them */
  winnerUsername?: string | null;
}

// ─── Sub-component: single player column ─────────────────────────────────────

interface PlayerColumnProps {
  player: PlayerStats;
  isWinner: boolean;
  align: 'left' | 'right';
}

function PlayerColumn({ player, isWinner, align }: PlayerColumnProps): React.ReactElement {
  const isLeft = align === 'left';

  return (
    <View style={[styles.column, isLeft ? styles.columnLeft : styles.columnRight]}>
      {/* Avatar */}
      <View style={[styles.avatar, isWinner && styles.avatarWinner]}>
        <Text style={styles.avatarText}>
          {player.username.charAt(0).toUpperCase()}
        </Text>
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>W</Text>
          </View>
        )}
      </View>

      {/* Username */}
      <Text
        style={[styles.username, isWinner && styles.usernameWinner]}
        numberOfLines={1}
      >
        {player.username}
      </Text>

      {/* Score */}
      <Text style={[styles.score, isWinner && styles.scoreWinner]}>
        {player.score}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayerStats({
  you,
  opponent,
  winnerUsername,
}: PlayerStatsProps): React.ReactElement {
  const youWin = winnerUsername === you.username;
  const opponentWin = winnerUsername != null && winnerUsername === opponent?.username;

  return (
    <View style={styles.container}>
      <PlayerColumn player={you} isWinner={youWin} align="left" />

      {/* VS divider */}
      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      {opponent ? (
        <PlayerColumn player={opponent} isWinner={opponentWin} align="right" />
      ) : (
        <View style={[styles.column, styles.columnRight]}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <Text style={[styles.username, styles.usernamePlaceholder]}>
            Waiting...
          </Text>
          <Text style={styles.score}>0</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  columnLeft: {
    alignItems: 'flex-start',
  },
  columnRight: {
    alignItems: 'flex-end',
  },

  // Avatar
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  avatarWinner: {
    borderColor: COLORS.warning,
    // Subtle amber glow
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarPlaceholder: {
    borderColor: COLORS.borderSubtle,
    borderStyle: 'dashed',
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Winner badge overlay
  winnerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Username
  username: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    maxWidth: 100,
  },
  usernameWinner: {
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  usernamePlaceholder: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // Score
  score: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold as '800',
    letterSpacing: -1,
  },
  scoreWinner: {
    color: COLORS.warning,
  },

  // VS
  vsContainer: {
    width: 40,
    alignItems: 'center',
  },
  vsText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: 2,
  },
});
