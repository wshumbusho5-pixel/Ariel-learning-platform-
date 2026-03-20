import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StoryRing } from '@/features/stories/components/StoryRing';
import { useStories } from '@/features/stories/hooks/useStories';
import { COLORS, SPACING } from '@/shared/constants/theme';

// Extend RootStackParamList locally — screens will register StoryViewer
type NavProp = NativeStackNavigationProp<Record<string, object | undefined>>;

export function StoriesRow(): React.ReactElement {
  const { storyGroups, isGroupSeen } = useStories();
  const navigation = useNavigation<NavProp>();

  function handleGroupPress(groupIndex: number) {
    navigation.navigate('StoryViewer', { groupIndex });
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
          profilePicture={null}
          username={null}
          seen={true}
          size={56}
          showAddButton
          onPress={handleAddStoryPress}
        />
      </View>

      {/* User story groups */}
      {storyGroups.map((group, index) => (
        <View key={group.user_id} style={styles.item}>
          <StoryRing
            profilePicture={group.profile_picture}
            username={group.username ?? group.full_name}
            seen={isGroupSeen(group)}
            size={56}
            onPress={() => handleGroupPress(index)}
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
