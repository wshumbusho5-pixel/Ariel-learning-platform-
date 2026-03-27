import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StoryViewer } from '@/features/stories/components/StoryViewer';
import { useStories } from '@/features/stories/hooks/useStories';
import { viewStory } from '@/features/stories/api/storiesApi';

type RouteParams = {
  StoryViewer: { groupIndex: number };
};

type NavProp = NativeStackNavigationProp<Record<string, object | undefined>>;

export function StoryViewerScreen(): React.ReactElement {
  const { width: SCREEN_WIDTH, height: H } = useWindowDimensions();
  const isShort = H < 720;
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<RouteParams, 'StoryViewer'>>();
  const { storyGroups, markSeen } = useStories();

  const initialGroup = route.params?.groupIndex ?? 0;
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroup);

  const flatListRef = useRef<FlatList>(null);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const goToGroup = useCallback(
    (index: number) => {
      if (index < 0 || index >= storyGroups.length) {
        navigation.goBack();
        return;
      }
      setCurrentGroupIndex(index);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    },
    [storyGroups.length, navigation],
  );

  const handleStoryVisible = useCallback(
    (storyId: string | null) => {
      if (!storyId) return;
      markSeen(storyId);
      viewStory(storyId).catch(() => {
        // Silently ignore view errors
      });
    },
    [markSeen],
  );

  if (storyGroups.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlatList
        ref={flatListRef}
        data={storyGroups}
        keyExtractor={(item) => item.user_id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // programmatic navigation only — swipes handled inside StoryViewer
        initialScrollIndex={initialGroup}
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <StoryViewer
              group={item}
              initialStoryIndex={0}
              onComplete={() => goToGroup(index + 1)}
              onClose={handleClose}
              onPrevGroup={() => goToGroup(index - 1)}
              onNextGroup={() => goToGroup(index + 1)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    flex: 1,
  },
});
