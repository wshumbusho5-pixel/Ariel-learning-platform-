import React from 'react';
import { View } from 'react-native';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';

interface SubjectAccentProps {
  subjectKey: SubjectKey | string;
  height?: number | string;
}

export function SubjectAccent({ subjectKey, height = '100%' }: SubjectAccentProps) {
  const key = normalizeSubjectKey(subjectKey) as SubjectKey;
  const color = SUBJECT_META[key]?.color ?? SUBJECT_META.other.color;

  return (
    <View
      style={{
        width: 3,
        height: height as number,
        backgroundColor: color,
        borderTopLeftRadius: 3,
        borderBottomLeftRadius: 3,
      }}
    />
  );
}
