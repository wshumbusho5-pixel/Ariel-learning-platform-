import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META } from '@/shared/constants/subjects';

const SUBJECT_LIST = Object.entries(SUBJECT_META).map(([key, meta]) => ({
  key,
  label: meta.label,
  icon: meta.icon,
}));

interface SubjectPickerProps {
  value: string;
  onChange: (v: string) => void;
}

export function SubjectPicker({ value, onChange }: SubjectPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = SUBJECT_LIST.find((s) => s.key === value);

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>
          {selected ? `${selected.icon} ${selected.label}` : 'Select subject\u2026'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#71717a"
        />
      </TouchableOpacity>

      {open && (
        <ScrollView style={styles.dropdown} nestedScrollEnabled>
          <TouchableOpacity
            style={styles.option}
            onPress={() => { onChange(''); setOpen(false); }}
          >
            <Text style={styles.optionText}>None</Text>
          </TouchableOpacity>
          {SUBJECT_LIST.filter((s) => s.key !== 'other').map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.option, value === s.key && styles.optionActive]}
              onPress={() => { onChange(s.key); setOpen(false); }}
            >
              <Text style={styles.optionText}>
                {s.icon} {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerText: { color: '#d4d4d8', fontSize: 14 },
  dropdown: {
    maxHeight: '40%' as any,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginTop: 4,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionActive: { backgroundColor: 'rgba(139,92,246,0.12)' },
  optionText: { color: '#d4d4d8', fontSize: 14 },
});
