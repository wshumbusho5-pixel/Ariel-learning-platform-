import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface ArielWordmarkProps {
  size?: number;
}

/**
 * The Ariel brand wordmark — Cormorant Garamond 700 italic "ariel"
 * with a violet #9B7FFF 'i'. Matches the web exactly.
 */
export function ArielWordmark({ size = 28 }: ArielWordmarkProps) {
  const letterSpacing = Math.max(1, (size / 96) * 12);
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize: size, letterSpacing }]}>ar</Text>
      <Text style={[styles.text, styles.violet, { fontSize: size, letterSpacing }]}>i</Text>
      <Text style={[styles.text, { fontSize: size, letterSpacing }]}>el</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    fontStyle: 'italic',
    color: '#ffffff',
  },
  violet: {
    color: '#9B7FFF',
  },
});
