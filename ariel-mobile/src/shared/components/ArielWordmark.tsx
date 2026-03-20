import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface ArielWordmarkProps {
  size?: number;
}

/**
 * The Ariel brand wordmark — italic serif "ariel" with a violet 'i'.
 * Matches the web's Cormorant Garamond italic using system Georgia.
 */
export function ArielWordmark({ size = 28 }: ArielWordmarkProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize: size }]}>ar</Text>
      <Text style={[styles.text, styles.violet, { fontSize: size }]}>i</Text>
      <Text style={[styles.text, { fontSize: size }]}>el</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#fafafa',
    letterSpacing: -0.5,
  },
  violet: {
    color: '#9B7FFF',
  },
});
