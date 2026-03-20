import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';
import {
  getChallenges,
  joinChallenge,
} from '@/features/gamification/api/gamificationApi';
import { ChallengeCard } from '@/features/gamification/components/ChallengeCard';
import type { ChallengeWithProgress } from '@/shared/types/gamification';

export function ChallengesScreen() {
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.CHALLENGES.active(),
    queryFn: getChallenges,
    staleTime: 1000 * 60 * 5,
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => joinChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGES.active() });
    },
  });

  const renderItem: ListRenderItem<ChallengeWithProgress> = ({ item }) => (
    <ChallengeCard
      challenge={item}
      onJoin={(id) => joinMutation.mutate(id)}
      joining={joinMutation.isPending && joinMutation.variables === item.id}
    />
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Challenges</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.violet[400]} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load challenges</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                No active challenges — check back soon
              </Text>
            </View>
          }
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
  },

  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['4xl'],
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
    gap: SPACING.md,
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
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
    borderRadius: 8,
  },

  retryText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
});
