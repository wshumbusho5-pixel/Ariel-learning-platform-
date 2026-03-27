import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ViewToken,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReelPlayer } from '@/features/reels/components/ReelPlayer';
import { ReelThumbnail } from '@/features/reels/components/ReelThumbnail';
import { ReelOverlay } from '@/features/reels/components/ReelOverlay';
import { ReelCommentSheet } from '@/features/reels/components/ReelCommentSheet';
import { useReels } from '@/features/reels/hooks/useReels';
import { useReelPlayer } from '@/features/reels/hooks/useReelPlayer';
import { likeReel, saveToDeck } from '@/features/reels/api/reelsApi';
import type { ReelResponse } from '@/shared/types/reel';

const viewabilityConfig = {
  itemVisiblePercentThreshold: 80,
};

// ─── Reel Item ─────────────────────────────────────────────────────────────────

interface ReelItemProps {
  reel: ReelResponse;
  isActive: boolean;
  onComment: (reelId: string) => void;
  screenWidth: number;
  screenHeight: number;
}

function ReelItem({ reel, isActive, onComment, screenWidth, screenHeight }: ReelItemProps) {
  const [liked, setLiked] = useState(reel.liked_by_current_user);
  const [saved, setSaved] = useState(false);

  const handleLike = useCallback(async () => {
    setLiked((prev) => !prev);
    try {
      await likeReel(reel.id);
    } catch {
      // Revert optimistic update on error
      setLiked((prev) => !prev);
    }
  }, [reel.id]);

  const handleSave = useCallback(async () => {
    setSaved((prev) => !prev);
    try {
      await saveToDeck(reel.id);
    } catch {
      setSaved((prev) => !prev);
    }
  }, [reel.id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out "${reel.title}" on Ariel!`,
        title: reel.title,
      });
    } catch {
      // User cancelled — no-op
    }
  }, [reel.title]);

  const isVideo = !!reel.video_url;

  return (
    <View style={[styles.reelItem, { width: screenWidth, height: screenHeight }]}>
      {isVideo ? (
        <ReelPlayer
          uri={reel.video_url!}
          isActive={isActive}
          thumbnail={reel.thumbnail_url ?? undefined}
        />
      ) : (
        <ReelThumbnail
          thumbnailUri={reel.thumbnail_url}
          title={reel.title}
          category={reel.category}
        />
      )}

      <ReelOverlay
        reel={reel}
        liked={liked}
        saved={saved}
        onLike={handleLike}
        onComment={() => onComment(reel.id)}
        onShare={handleShare}
        onSave={handleSave}
      />
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export function ReelsScreen() {
  const { width: W, height: H } = useWindowDimensions();

  const {
    reels,
    currentIndex,
    onViewableIndexChange,
    isFetchingNextPage,
    isLoading,
  } = useReels();

  const { isActive } = useReelPlayer({ activeIndex: currentIndex });

  const [commentReelId, setCommentReelId] = useState<string | null>(null);

  const viewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        onViewableIndexChange(first.index);
      }
    },
  );

  const keyExtractor = useCallback((item: ReelResponse) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ReelResponse; index: number }) => (
      <ReelItem
        reel={item}
        isActive={isActive(index)}
        onComment={setCommentReelId}
        screenWidth={W}
        screenHeight={H}
      />
    ),
    [isActive, W, H],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: H,
      offset: H * index,
      index,
    }),
    [H],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList<ReelResponse>
        data={reels}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={viewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        style={[styles.list, { width: W, height: H }]}
      />

      {/* Comments bottom sheet */}
      <ReelCommentSheet
        reelId={commentReelId ?? ''}
        visible={!!commentReelId}
        onClose={() => setCommentReelId(null)}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  list: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelItem: {
    // width/height are set inline via useWindowDimensions in ReelItem
    backgroundColor: '#000',
  },
});
