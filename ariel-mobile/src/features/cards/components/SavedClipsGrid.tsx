import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSavedReels } from '@/features/reels/api/reelsApi';
import type { ReelResponse } from '@/shared/types/reel';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  return `${API_BASE}${uri}`;
}

const NUM_COLUMNS = 3;
const GAP = 2;

function ClipThumbnail({ reel, size }: { reel: ReelResponse; size: number }) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const thumb = resolveUri(reel.thumbnail_url);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Reels', { reelId: reel.id })}
      style={[styles.thumb, { width: size, height: size * 1.5 }]}
    >
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name="play-circle-outline" size={32} color="#52525b" />
        </View>
      )}
      {/* Views overlay */}
      <View style={styles.viewsOverlay}>
        <Ionicons name="play" size={10} color="#fff" />
        <Text style={styles.viewsText}>
          {reel.views >= 1000 ? `${(reel.views / 1000).toFixed(1)}k` : reel.views}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function SavedClipsGrid() {
  const { width: W } = useWindowDimensions();
  const tileSize = (W - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const [reels, setReels] = useState<ReelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getSavedReels()
      .then(setReels)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color="#52525b" />
        <Text style={styles.emptyTitle}>Couldn't load clips</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="film-outline" size={48} color="#3f3f46" />
        <Text style={styles.emptyTitle}>No saved clips yet</Text>
        <Text style={styles.emptySub}>Save clips from the Reels feed and they'll appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reels}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      renderItem={({ item }) => <ClipThumbnail reel={item} size={tileSize} />}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ gap: GAP }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    color: '#52525b',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#27272a',
  },
  retryText: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
  thumb: {
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
  },
  viewsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
