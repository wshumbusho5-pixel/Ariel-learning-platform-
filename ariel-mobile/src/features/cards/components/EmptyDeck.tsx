import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EmptyDeck({ label }: { label: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {label === 'All' ? 'Your deck is empty' : `No ${label.toLowerCase()} cards`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {label === 'All'
          ? 'Ask Ariel to generate cards or create your own.'
          : `No cards in "${label}" right now.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#fafafa', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: '#52525b', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
