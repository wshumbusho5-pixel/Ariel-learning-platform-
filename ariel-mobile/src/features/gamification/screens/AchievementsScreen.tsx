import React from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { getAchievements } from '@/features/gamification/api/gamificationApi';
import { AchievementCard } from '@/features/gamification/components/AchievementCard';
import type { AchievementProgress } from '@/shared/types/gamification';
import type { AchievementDefinition } from '@/shared/types/gamification';

function buildLockedProgress(def: AchievementDefinition): AchievementProgress {
  return {
    achievement_id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    category: def.category,
    rarity: def.rarity,
    current_value: 0,
    target_value: def.requirement_value,
    percentage: 0,
    is_unlocked: false,
    unlocked_at: null,
    points_reward: def.points_reward,
  };
}

/**
 * Groups achievements into rows of 3 for our manual grid.
 */
function chunkIntoRows<T>(arr: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += cols) {
    rows.push(arr.slice(i, i + cols));
  }
  return rows;
}

const COLS = 3;

export function AchievementsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.GAMIFICATION.achievements(),
    queryFn: getAchievements,
    staleTime: 1000 * 60 * 5,
  });

  const unlockedIds = new Set((data?.unlocked ?? []).map((a) => a.achievement_id));
  const unlocked = data?.unlocked ?? [];
  const lockedDefs = (data?.all ?? []).filter((d) => !unlockedIds.has(d.id));
  const lockedProgress: AchievementProgress[] = lockedDefs.map(buildLockedProgress);

  const totalAll = (data?.all ?? []).length;
  const totalUnlocked = unlocked.length;

  const unlockedRows = chunkIntoRows(unlocked, COLS);
  const lockedRows = chunkIntoRows(lockedProgress, COLS);

  type SectionData = AchievementProgress[][];

  const sections: Array<{ title: string; data: SectionData }> = [];
  if (unlocked.length > 0) {
    sections.push({ title: `Unlocked (${totalUnlocked})`, data: unlockedRows });
  }
  if (lockedProgress.length > 0) {
    sections.push({ title: `Locked (${totalAll - totalUnlocked})`, data: lockedRows });
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        {!isLoading && !isError && (
          <Text style={styles.headerSub}>
            {totalUnlocked} / {totalAll} unlocked
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.violet[400]} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load achievements</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No achievements yet — keep studying!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(row, index) =>
            `row-${index}-${row.map((a) => a.achievement_id).join(',')}`
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((achievement) => (
                <AchievementCard
                  key={achievement.achievement_id}
                  achievement={achievement}
                />
              ))}
              {/* Fill empty cells in last row */}
              {row.length < COLS &&
                Array.from({ length: COLS - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.emptyCell} />
                ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },

  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  headerSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },

  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },

  sectionHeader: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },

  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: SPACING.xs,
  },

  emptyCell: {
    width: 90 + SPACING.xs,
    marginHorizontal: SPACING.xs / 2,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },

  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  retryBtn: {
    backgroundColor: COLORS.surface2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },

  retryText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },
});
