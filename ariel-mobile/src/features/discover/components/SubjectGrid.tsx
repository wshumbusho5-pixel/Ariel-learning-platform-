import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import {
  CANONICAL_SUBJECT_KEYS,
  SUBJECT_META,
} from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 16px padding each side + 3 gaps of 8px between 4 columns
const TILE_SIZE = (SCREEN_WIDTH - 32 - 24) / 4;

interface SubjectGridProps {
  onSubjectPress: (subjectKey: SubjectKey) => void;
}

interface SubjectTileProps {
  subjectKey: SubjectKey;
  onPress: (key: SubjectKey) => void;
}

function SubjectTile({ subjectKey, onPress }: SubjectTileProps) {
  const meta = SUBJECT_META[subjectKey];
  const color = meta.color;

  return (
    <TouchableOpacity
      onPress={() => onPress(subjectKey)}
      activeOpacity={0.7}
      style={[
        tileStyles.tile,
        {
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: `${color}33`, // 20% opacity hex
          borderColor: `${color}66`,     // 40% opacity hex
        },
      ]}
    >
      <Text style={tileStyles.emoji}>{meta.icon}</Text>
      <Text style={tileStyles.label} numberOfLines={1}>
        {meta.short}
      </Text>
    </TouchableOpacity>
  );
}

export function SubjectGrid({ onSubjectPress }: SubjectGridProps): React.ReactElement {
  const data = CANONICAL_SUBJECT_KEYS as unknown as SubjectKey[];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SubjectKey>) => (
      <SubjectTile subjectKey={item} onPress={onSubjectPress} />
    ),
    [onSubjectPress],
  );

  const keyExtractor = useCallback((item: SubjectKey) => item, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={4}
      scrollEnabled={false}
      columnWrapperStyle={tileStyles.row}
      contentContainerStyle={tileStyles.grid}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tileStyles = StyleSheet.create({
  grid: {
    paddingHorizontal: SPACING.lg,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  tile: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#e4e4e7',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
