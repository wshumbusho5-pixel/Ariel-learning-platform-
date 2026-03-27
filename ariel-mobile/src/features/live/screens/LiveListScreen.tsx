import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { getActiveStreams } from '@/features/live/api/liveApi';
import { LiveCard } from '@/features/live/components/LiveCard';
import type { LiveStreamWithStreamer } from '@/shared/types/livestream';
import type { LiveStackParamList } from '@/features/live/LiveNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveListNavProp = NativeStackNavigationProp<LiveStackParamList, 'LiveList'>;

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  return (
    <View style={[styles.emptyContainer, isShort && { paddingTop: 40 }]}>
      <Text style={[styles.emptyIcon, isShort && { fontSize: 40, marginBottom: 4 }]}>📡</Text>
      <Text style={styles.emptyTitle}>No one is live right now.</Text>
      <Text style={styles.emptySubtitle}>Be the first!</Text>
    </View>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard(): React.ReactElement {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonInner} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveListScreen(): React.ReactElement {
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LiveListNavProp>();

  const {
    data: streams,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.LIVE.discover(),
    queryFn: getActiveStreams,
    refetchInterval: 10_000, // auto-refresh every 10s
  });

  const handleStreamPress = useCallback(
    (stream: LiveStreamWithStreamer) => {
      navigation.navigate('LiveViewer', { streamId: stream.id });
    },
    [navigation],
  );

  const handleGoLive = useCallback(() => {
    navigation.navigate('LiveHost');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LiveStreamWithStreamer>) => (
      <LiveCard stream={item} onPress={handleStreamPress} />
    ),
    [handleStreamPress],
  );

  const keyExtractor = useCallback(
    (item: LiveStreamWithStreamer) => item.id,
    [],
  );

  const activeStreams = streams ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isShort && { paddingTop: SPACING.xs, paddingBottom: 4 }]}>
        <Text style={[styles.headerTitle, isShort && { fontSize: TYPOGRAPHY.fontSize.xl }]}>Live Now 🔴</Text>
        <TouchableOpacity
          style={[styles.goLiveButton, isShort && { paddingHorizontal: 12, paddingVertical: 6 }]}
          onPress={handleGoLive}
          activeOpacity={0.85}
        >
          <Text style={styles.goLiveText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={activeStreams}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.error}
              colors={[COLORS.error]}
            />
          }
          contentContainerStyle={
            activeStreams.length === 0
              ? styles.emptyFlatList
              : [styles.gridContent, isShort && { paddingTop: 4, paddingBottom: 12 }]
          }
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={10}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: -0.5,
  },
  goLiveButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  goLiveText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  // Grid
  gridContent: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  skeletonCard: {
    flex: 1,
    margin: 6,
    height: 150,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: COLORS.surface2,
  },

  // Empty
  emptyFlatList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['4xl'],
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },
});
