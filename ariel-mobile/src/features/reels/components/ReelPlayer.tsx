import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelPlayerProps {
  uri: string;
  isActive: boolean;
  thumbnail?: string;
}

export function ReelPlayer({ uri, isActive, thumbnail }: ReelPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<Video>(null);

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="play-circle-outline" size={64} color="rgba(255,255,255,0.3)" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Thumbnail shown while video is loading */}
      {isLoading && thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : isLoading ? (
        // Solid black placeholder while loading with no thumbnail
        <View style={[StyleSheet.absoluteFill, styles.loadingFallback]} />
      ) : null}

      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isActive}
        isLooping
        isMuted={false}
        onReadyForDisplay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  errorState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingFallback: {
    backgroundColor: '#000',
  },
});
