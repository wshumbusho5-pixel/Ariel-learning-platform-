import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SessionCompleteProps {
  totalReviewed: number;
  hardCount: number;
  easyCount: number;
  nailedCount: number;
  onRestart: () => void;
}

export function SessionComplete({
  totalReviewed,
  hardCount,
  easyCount,
  nailedCount,
  onRestart,
}: SessionCompleteProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Trophy icon */}
      <View style={styles.trophyCircle}>
        <Text style={styles.trophyIcon}>🏆</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Session complete!</Text>
      <Text style={styles.subtitle}>{totalReviewed} card{totalReviewed !== 1 ? 's' : ''} reviewed</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
            <Ionicons name="close-circle" size={22} color="#fb7185" />
          </View>
          <Text style={styles.statCount}>{hardCount}</Text>
          <Text style={styles.statLabel}>Hard</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
            <Ionicons name="arrow-forward-circle" size={22} color="#fbbf24" />
          </View>
          <Text style={styles.statCount}>{easyCount}</Text>
          <Text style={styles.statLabel}>Easy</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#34d399" />
          </View>
          <Text style={styles.statCount}>{nailedCount}</Text>
          <Text style={styles.statLabel}>Nailed</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Let's Duel */}
        <TouchableOpacity
          style={styles.duelButton}
          activeOpacity={0.85}
          onPress={() => {
            // Navigate to Duels tab
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- navigation type not strongly typed here
            (navigation as any).navigate('Duels');
          }}
          accessibilityRole="button"
          accessibilityLabel="Let's Duel"
        >
          <Ionicons name="flash" size={18} color="#ffffff" />
          <Text style={styles.duelButtonText}>Let's Duel</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Restart */}
        <TouchableOpacity
          style={styles.restartButton}
          activeOpacity={0.7}
          onPress={onRestart}
          accessibilityRole="button"
          accessibilityLabel="Restart session"
        >
          <Ionicons name="refresh" size={16} color="#a1a1aa" />
          <Text style={styles.restartButtonText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  trophyIcon: {
    fontSize: 36,
  },
  title: {
    color: '#fafafa',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    color: '#fafafa',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#27272a',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  duelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  duelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  restartButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
});
