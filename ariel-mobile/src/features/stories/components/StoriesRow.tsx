import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { StoryRing } from '@/features/stories/components/StoryRing';
import { useStories } from '@/features/stories/hooks/useStories';
import { useAuthStore } from '@/shared/auth/authStore';
import { getFollowing } from '@/features/profile/api/profileApi';
import { COLORS, SPACING } from '@/shared/constants/theme';

type NavProp = NativeStackNavigationProp<Record<string, object | undefined>>;

interface StatusItem {
  userId: string;
  username: string | null;
  profilePicture: string | null;
  hasStory: boolean;
  storyGroupIndex: number | null; // index into storyGroups array
  seen: boolean;
}

export function StoriesRow(): React.ReactElement {
  const { storyGroups, isGroupSeen } = useStories();
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);

  const { data: following } = useQuery({
    queryKey: ['social', 'following', user?.id],
    queryFn: () => getFollowing(user!.id!),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Merge story groups + followed users into a single list
  const statusItems = useMemo<StatusItem[]>(() => {
    const storyUserIds = new Set(storyGroups.map((g) => g.user_id));

    // Users with stories — sorted unseen first
    const withStories: StatusItem[] = storyGroups.map((group, index) => ({
      userId: group.user_id,
      username: group.username ?? group.full_name,
      profilePicture: group.profile_picture,
      hasStory: true,
      storyGroupIndex: index,
      seen: isGroupSeen(group),
    }));

    // Followed users without stories
    const withoutStories: StatusItem[] = (following ?? [])
      .filter((f) => f.id && !storyUserIds.has(f.id))
      .map((f) => ({
        userId: f.id,
        username: f.username ?? f.full_name,
        profilePicture: f.profile_picture,
        hasStory: false,
        storyGroupIndex: null,
        seen: true, // no story = always "seen" (no ring)
      }));

    // Unseen stories first, then seen stories, then followed without stories
    const unseenStories = withStories.filter((s) => !s.seen);
    const seenStories = withStories.filter((s) => s.seen);
    return [...unseenStories, ...seenStories, ...withoutStories];
  }, [storyGroups, following, isGroupSeen]);

  function handlePress(item: StatusItem) {
    if (item.hasStory && item.storyGroupIndex !== null) {
      navigation.navigate('StoryViewer', { groupIndex: item.storyGroupIndex });
    } else {
      navigation.navigate('UserProfile', { userId: item.userId });
    }
  }

  function handleAddStoryPress() {
    navigation.navigate('StoryCreate', undefined);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {/* "Your story" add button */}
      <View style={styles.item}>
        <StoryRing
          profilePicture={user?.profile_picture ?? null}
          username={null}
          seen={true}
          size={56}
          showAddButton
          onPress={handleAddStoryPress}
        />
      </View>

      {/* Followed users — with or without stories */}
      {statusItems.map((item) => (
        <View key={item.userId} style={styles.item}>
          <StoryRing
            profilePicture={item.profilePicture}
            username={item.username}
            seen={item.hasStory ? item.seen : true}
            showRing={item.hasStory}
            size={56}
            onPress={() => handlePress(item)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingBottom: 4,
  },
  item: {
    marginRight: SPACING.md,
  },
});
