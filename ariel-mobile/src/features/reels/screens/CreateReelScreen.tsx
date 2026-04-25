import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY } from '@/shared/constants/theme';
import { CANONICAL_SUBJECT_KEYS, SUBJECT_META, SubjectKey } from '@/shared/constants/subjects';
import apiClient from '@/shared/api/client';
import { REELS } from '@/shared/api/endpoints';

type UploadPhase = 'pick' | 'edit' | 'uploading';

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  public_id: string;
  api_key: string;
  cloud_name: string;
}

export function CreateReelScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const videoRef = useRef<Video>(null);

  const [phase, setPhase] = useState<UploadPhase>('pick');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SubjectKey | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload reels.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setPhase('edit');
    }
  };

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to record reels.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setPhase('edit');
    }
  };

  const uploadReel = async () => {
    if (!videoUri || !title.trim()) {
      Alert.alert('Missing info', 'Please add a title for your reel.');
      return;
    }

    setPhase('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Get signed upload params from backend
      const signRes = await apiClient.get<CloudinarySignature>(REELS.SIGN_UPLOAD);
      const { signature, timestamp, public_id, api_key, cloud_name } = signRes.data;

      // Step 2: Upload video directly to Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'reel.mp4',
      } as any);
      formData.append('signature', signature);
      formData.append('timestamp', String(timestamp));
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      setUploadProgress(10);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      setUploadProgress(70);

      if (!cloudinaryRes.ok) {
        throw new Error('Video upload failed');
      }

      const cloudinaryData = await cloudinaryRes.json();
      const videoUrl: string = cloudinaryData.secure_url;

      // Step 3: Save reel metadata to backend
      const hashtagList = hashtags
        .split(/[#,\s]+/)
        .map((h) => h.trim())
        .filter(Boolean);

      await apiClient.post(REELS.SAVE, {
        video_url: videoUrl,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category ?? undefined,
        hashtags: hashtagList.length > 0 ? hashtagList : undefined,
      });

      setUploadProgress(100);

      Alert.alert('Reel posted!', 'Your reel is now live.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setPhase('edit');
      Alert.alert('Upload failed', 'Could not upload your reel. Please try again.');
    }
  };

  // ── Pick Phase ────────────────────────────────────────────────────────────────

  if (phase === 'pick') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Reel</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.pickContent}>
          <View style={styles.pickIconWrapper}>
            <Ionicons name="videocam" size={48} color={COLORS.violet[400]} />
          </View>
          <Text style={styles.pickTitle}>Create a study reel</Text>
          <Text style={styles.pickSubtitle}>
            Share a quick tip, explain a concept, or quiz your followers.
          </Text>

          <TouchableOpacity style={styles.pickBtn} onPress={recordVideo} activeOpacity={0.7}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.pickBtnText}>Record video</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickBtnOutline} onPress={pickVideo} activeOpacity={0.7}>
            <Ionicons name="images" size={22} color={COLORS.textPrimary} />
            <Text style={styles.pickBtnOutlineText}>Choose from library</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Uploading Phase ───────────────────────────────────────────────────────────

  if (phase === 'uploading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.uploadingContent}>
          <ActivityIndicator size="large" color={COLORS.violet[400]} />
          <Text style={styles.uploadingText}>Uploading your reel...</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.uploadingPercent}>{uploadProgress}%</Text>
        </View>
      </View>
    );
  }

  // ── Edit Phase ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase('pick')} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Reel</Text>
        <TouchableOpacity
          onPress={uploadReel}
          disabled={!title.trim()}
          hitSlop={12}
        >
          <Text style={[styles.postBtn, !title.trim() && styles.postBtnDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.editContent}>
        {/* Video Preview */}
        {videoUri && (
          <View style={styles.videoPreview}>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping
              useNativeControls
            />
          </View>
        )}

        {/* Title */}
        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this reel about?"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Add a description..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Category */}
        <Text style={styles.fieldLabel}>Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CANONICAL_SUBJECT_KEYS.map((key) => {
            const meta = SUBJECT_META[key];
            const active = category === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(active ? null : key)}
                activeOpacity={0.7}
              >
                <Ionicons name={meta.icon as any} size={14} color={active ? '#fff' : meta.color} />
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {meta.short ?? meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hashtags */}
        <Text style={styles.fieldLabel}>Hashtags</Text>
        <TextInput
          style={styles.input}
          placeholder="#studytip #physics #quickexplainer"
          placeholderTextColor={COLORS.textMuted}
          value={hashtags}
          onChangeText={setHashtags}
          maxLength={200}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  postBtn: {
    color: COLORS.violet[400],
    fontSize: 16,
    fontWeight: '700',
  },
  postBtnDisabled: {
    opacity: 0.4,
  },

  // Pick phase
  pickContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  pickIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  pickSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.violet[600],
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    justifyContent: 'center',
  },
  pickBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    justifyContent: 'center',
  },
  pickBtnOutlineText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Uploading phase
  uploadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  uploadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.violet[500],
    borderRadius: 2,
  },
  uploadingPercent: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  // Edit phase
  editContent: {
    padding: 16,
    gap: 8,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    maxHeight: 300,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.violet[600],
    borderColor: COLORS.violet[600],
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
});
