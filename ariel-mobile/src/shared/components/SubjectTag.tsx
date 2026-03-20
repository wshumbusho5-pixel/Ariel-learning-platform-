import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';

interface SubjectTagProps {
  subject: string;
  size?: 'sm' | 'md';
}

export function SubjectTag({ subject, size = 'md' }: SubjectTagProps): React.ReactElement {
  const key = normalizeSubjectKey(subject);
  const meta = SUBJECT_META[key];
  const label = meta?.short ?? subject;
  const color = meta?.color ?? '#71717a';

  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        isSm ? styles.containerSm : styles.containerMd,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <Text
        style={[
          styles.text,
          isSm ? styles.textSm : styles.textMd,
          { color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  containerMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
});
