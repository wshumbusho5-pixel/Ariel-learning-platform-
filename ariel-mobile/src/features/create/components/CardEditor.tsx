import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CardDraft {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

interface CardEditorProps {
  card: CardDraft;
  index: number;
  onUpdate: (id: string, field: keyof CardDraft, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function CardEditor({ card, index, onUpdate, onRemove, canRemove }: CardEditorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.num}>Card {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={() => onRemove(card.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={17} color="#52525b" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Question *</Text>
      <TextInput
        style={styles.input}
        value={card.question}
        onChangeText={(v) => onUpdate(card.id, 'question', v)}
        placeholder="e.g. What is the powerhouse of the cell?"
        placeholderTextColor="#52525b"
        multiline
        maxLength={500}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>Answer *</Text>
      <TextInput
        style={styles.input}
        value={card.answer}
        onChangeText={(v) => onUpdate(card.id, 'answer', v)}
        placeholder="e.g. The mitochondria"
        placeholderTextColor="#52525b"
        multiline
        maxLength={500}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>
        Explanation <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        value={card.explanation}
        onChangeText={(v) => onUpdate(card.id, 'explanation', v)}
        placeholder="Add a hint or deeper context\u2026"
        placeholderTextColor="#52525b"
        multiline
        maxLength={1000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  num: { color: '#71717a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  label: { color: '#a1a1aa', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  optional: { color: '#52525b', fontWeight: '400' },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fafafa',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 44,
    textAlignVertical: 'top',
  },
});
