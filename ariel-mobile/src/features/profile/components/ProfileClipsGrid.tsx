import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getMyReels } from '@/features/reels/api/reelsApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { normalizeSubjectKey } from '@/shared/constants/subjects';
import type { ReelResponse } from '@/shared/types/reel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 1.5;
const CELL_W = (SCREEN_WIDTH - GAP * 2) / 3;
const CELL_H = CELL_W * 1.6; // portrait 9:16-ish ratio, like IG reels

// ─── Subject bg fallback (same palette as ReelThumbnail) ─────────────────────

const SUBJECT_BG: Record<string, string> = {
  mathematics: '#1e1b4b',
  sciences:    '#022c22',
  technology:  '#0c1a2e',
  history:     '#1c0a00',
  literature:  '#1c0700',
  economics:   '#12004e',
  languages:   '#012120',
  health:      '#1a0202',
  psychology:  '#03061a',
  geography:   '#0a1500',
  gospel:      '#1a1200',
  business:    '#041020',
  law:         '#0d0d0d',
  arts:        '#130020',
  engineering: '#1a1200',
};

function categoryBg(category?: string | null): string {
  const key = normalizeSubjectKey(category ?? '');
  return SUBJECT_BG[key] ?? '#18181b';
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── Single cell ──────────────────────────────────────────────────────────────

function ClipCell({ reel }: { reel: ReelResponse }) {
  const [imgErr, setImgErr] = React.useState(false);
  const hasThumbnail = !!reel.thumbnail_url && !imgErr;

  return (
    <View style={s.cell}>
      {/* Thumbnail or dark fallback */}
      {hasThumbnail ? (
        <Image
          source={{ uri: reel.thumbnail_url! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: categoryBg(reel.category) }]}>
          <Text style={s.fallbackInitial}>{(reel.title[0] ?? '?').toUpperCase()}</Text>
        </View>
      )}

      {/* Play icon — top left, like Instagram */}
      <View style={s.playBadge}>
        <Ionicons name="play" size={11} color="#fff" />
      </View>

      {/* View count — bottom left */}
      {reel.views > 0 && (
        <View style={s.viewsBadge}>
          <Ionicons name="play-outline" size={10} color="#fff" />
          <Text style={s.viewsText}>{formatViews(reel.views)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCell() {
  return <View style={[s.cell, s.skeleton]} />;
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface ProfileClipsGridProps {
  ListHeaderComponent?: React.ReactElement | null;
}

export function ProfileClipsGrid({ ListHeaderComponent }: ProfileClipsGridProps) {
  const { data: reels = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.REELS.my(),
    queryFn: getMyReels,
  });

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ReelResponse>) => <ClipCell reel={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: ReelResponse) => item.id,
    [],
  );

  if (isLoading) {
    return (
      <View style={s.container}>
        {ListHeaderComponent}
        <View style={s.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCell key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={reels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      columnWrapperStyle={s.row}
      contentContainerStyle={s.list}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="videocam-outline" size={32} color="#52525b" />
          </View>
          <Text style={s.emptyTitle}>No clips yet</Text>
          <Text style={s.emptySub}>Clips you post will appear here.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={9}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { paddingBottom: 100 },
  row: { gap: GAP, marginBottom: GAP },

  cell: {
    width: CELL_W,
    height: CELL_H,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.05)',
    alignSelf: 'center',
    top: '30%',
  },

  // Play badge — top left
  playBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },

  // View count — bottom left
  viewsBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  skeleton: {
    backgroundColor: '#111',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#71717a',
    fontSize: 13,
  },
});
