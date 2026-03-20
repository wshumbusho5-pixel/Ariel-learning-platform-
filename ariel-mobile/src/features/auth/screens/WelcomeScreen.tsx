import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../AuthNavigator';
import { ArielWordmark } from '@/shared/components/ArielWordmark';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SW } = Dimensions.get('window');
const PHONE_W = SW * 0.72;
const PHONE_H = PHONE_W * 1.95;

type Tab = 'Flashcards' | 'Social Feed' | 'Clips';
const TABS: Tab[] = ['Flashcards', 'Social Feed', 'Clips'];

// ─── Flashcard preview ────────────────────────────────────────────────────────

function CramPreview() {
  return (
    <View style={preview.screen}>
      {/* Mini status bar */}
      <View style={preview.statusBar}>
        <Text style={preview.statusTime}>9:41</Text>
        <View style={preview.statusIcons}>
          <View style={[preview.dot, { width: 6 }]} />
          <View style={[preview.dot, { width: 6 }]} />
          <View style={[preview.dot, { width: 6 }]} />
        </View>
      </View>

      {/* Header */}
      <View style={preview.cramHeader}>
        <Text style={preview.cramBack}>←</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={preview.cramTitle}>History</Text>
          <Text style={preview.cramSub}>Card 3 of 12</Text>
        </View>
        <Text style={preview.cramBookmark}>⊡</Text>
      </View>

      {/* Progress bar */}
      <View style={preview.cramProgressTrack}>
        <View style={[preview.cramProgressFill, { width: '25%' }]} />
      </View>

      {/* Card */}
      <View style={preview.cramCardWrap}>
        <View style={preview.cramCard}>
          <View style={preview.cramCardTop}>
            <View style={preview.answerPill}>
              <Text style={preview.answerPillText}>ANSWER</Text>
            </View>
            <Text style={preview.cramSubject}>📖 History</Text>
          </View>
          <Text style={preview.cramQuestion}>
            What caused the fall of the Roman Empire?
          </Text>
          <Text style={preview.cramAnswer}>
            Economic turmoil, political instability, and sustained barbarian
            pressure — eroding the empire over three centuries.
          </Text>
        </View>
      </View>

      {/* Rating buttons */}
      <View style={preview.ratingRow}>
        <View style={[preview.ratingBtn, { backgroundColor: '#7f1d1d' }]}>
          <Text style={preview.ratingText}>Again</Text>
        </View>
        <View style={[preview.ratingBtn, { backgroundColor: '#422006' }]}>
          <Text style={preview.ratingText}>Hard</Text>
        </View>
        <View style={[preview.ratingBtn, { backgroundColor: '#14532d' }]}>
          <Text style={preview.ratingText}>Got it ✓</Text>
        </View>
      </View>

      {/* Bottom nav */}
      <BottomNav active={0} />
    </View>
  );
}

// ─── Feed preview ─────────────────────────────────────────────────────────────

function FeedPreview() {
  return (
    <View style={preview.screen}>
      <View style={preview.statusBar}>
        <Text style={preview.statusTime}>9:41</Text>
      </View>

      {/* Header */}
      <View style={preview.feedHeader}>
        <View style={preview.feedAvatar} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ArielWordmark size={13} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={preview.feedIcon} />
          <View style={preview.feedIcon} />
        </View>
      </View>

      {/* Tabs */}
      <View style={preview.feedTabs}>
        <Text style={[preview.feedTab, preview.feedTabActive]}>For You</Text>
        <Text style={preview.feedTab}>Following</Text>
      </View>

      {/* Card */}
      <View style={preview.feedCardWrap}>
        <View style={preview.feedCardHeader}>
          <View style={[preview.feedAvatar, { width: 18, height: 18, borderRadius: 9 }]} />
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={preview.feedAuthor}>Dr. Priya K.</Text>
            <Text style={preview.feedCardSubject}>Economics</Text>
          </View>
        </View>
        <Text style={preview.feedCardCaption} numberOfLines={2}>
          Most people confuse these two. Once you see the difference, you can't unsee it.
        </Text>
        <View style={preview.feedQuestion}>
          <View style={preview.questionPill}>
            <Text style={preview.questionPillText}>QUESTION</Text>
          </View>
          <Text style={preview.feedQuestionText} numberOfLines={2}>
            What is the difference between GDP and GNP?
          </Text>
        </View>

        {/* Comments preview */}
        <View style={preview.commentsRow}>
          <View style={[preview.feedAvatar, { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e' }]} />
          <Text style={preview.commentText}>Maya S. Never thought about it this way</Text>
        </View>
        <View style={preview.commentsRow}>
          <View style={[preview.feedAvatar, { width: 14, height: 14, borderRadius: 7, backgroundColor: '#eab308' }]} />
          <Text style={preview.commentText}>Xav Saving this for my next exam</Text>
        </View>
      </View>

      <BottomNav active={1} />
    </View>
  );
}

// ─── Clips preview ────────────────────────────────────────────────────────────

function ClipsPreview() {
  return (
    <View style={[preview.screen, { backgroundColor: '#111' }]}>
      {/* Full-bleed gradient background */}
      <View style={preview.clipsGradient}>
        {/* Simulate a person/video frame */}
        <View style={preview.clipsVideoFrame}>
          <View style={preview.clipsPersonCircle} />
          <View style={preview.clipsPersonBody} />
        </View>

        {/* CLIP badge */}
        <View style={preview.clipBadge}>
          <View style={preview.clipDot} />
          <Text style={preview.clipBadgeText}>CLIP</Text>
        </View>

        {/* Right actions */}
        <View style={preview.clipsActions}>
          {['♥', '💬', '↗', '⋯'].map((icon, i) => (
            <View key={i} style={preview.clipsActionBtn}>
              <Text style={preview.clipsActionIcon}>{icon}</Text>
            </View>
          ))}
        </View>

        {/* Bottom info */}
        <View style={preview.clipsBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[preview.feedAvatar, { width: 18, height: 18, borderRadius: 9 }]} />
            <Text style={preview.clipsAuthor}>@alexhistory</Text>
            <View style={preview.followBtn}>
              <Text style={preview.followBtnText}>+ Follow</Text>
            </View>
          </View>
          <Text style={preview.clipsCaption} numberOfLines={2}>
            Why the Roman Empire really fell — it wasn't what you think
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            <Text style={preview.clipsTag}>#history</Text>
            <Text style={preview.clipsTag}>#education</Text>
          </View>
        </View>
      </View>

      <BottomNav active={3} />
    </View>
  );
}

// ─── Shared bottom nav ────────────────────────────────────────────────────────

function BottomNav({ active }: { active: number }) {
  const icons = ['⊟', '⌂', '+', '⚡', '◯'];
  return (
    <View style={preview.bottomNav}>
      {icons.map((icon, i) => (
        <View
          key={i}
          style={[
            preview.navItem,
            i === 2 && preview.navPlus,
          ]}
        >
          <Text
            style={[
              preview.navIcon,
              i === 2 && preview.navPlusIcon,
              i === active && preview.navIconActive,
            ]}
          >
            {icon}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#7c3aed', '#22c55e', '#eab308', '#ef4444', '#3b82f6'];
const AVATAR_LETTERS = ['A', 'M', 'K', 'J', 'S'];

function AvatarStack() {
  return (
    <View style={styles.avatarRow}>
      <View style={styles.avatarStack}>
        {AVATAR_COLORS.map((color, i) => (
          <View
            key={i}
            style={[
              styles.avatar,
              { backgroundColor: color, marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i },
            ]}
          >
            <Text style={styles.avatarLetter}>{AVATAR_LETTERS[i]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.avatarLabel}>
        Join <Text style={styles.avatarBold}>500+</Text> students already learning
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Flashcards');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-cycle tabs every 3.4s
  useEffect(() => {
    const cycle = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveTab((prev) => {
          const idx = TABS.indexOf(prev);
          return TABS[(idx + 1) % TABS.length];
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    };
    const id = setInterval(cycle, 3400);
    return () => clearInterval(id);
  }, [fadeAnim]);

  const handleTabPress = (tab: Tab) => {
    if (tab === activeTab) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Wordmark */}
      <View style={styles.wordmarkRow}>
        <ArielWordmark size={52} />
      </View>

      {/* Tab pills */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabPill,
              activeTab === tab && styles.tabPillActive,
            ]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === tab && styles.tabPillTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone mockup */}
      <View style={styles.phoneFrame}>
        {/* Subtle purple glow behind */}
        <View style={styles.phoneGlow} />
        <View style={styles.phoneInner}>
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {activeTab === 'Flashcards' && <CramPreview />}
            {activeTab === 'Social Feed' && <FeedPreview />}
            {activeTab === 'Clips' && <ClipsPreview />}
          </Animated.View>
        </View>
      </View>

      {/* Below fold */}
      <View style={styles.belowFold}>
        <Text style={styles.eyebrow}>THE SOCIAL STUDY APP</Text>
        <View style={styles.headlineRow}>
          <Text style={styles.headlineBlack}>Go </Text>
          <Text style={styles.headlineViolet}>deeper.</Text>
        </View>
        <Text style={styles.subtitle}>
          Flashcards, a social feed, and short clips —{'\n'}the whole learning stack in one place.
        </Text>

        <AvatarStack />
      </View>

      {/* CTA */}
      <View style={[styles.ctaBlock, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <Text style={styles.createBtnText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginRow}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          By signing up you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text>
          {' & '}
          <Text style={styles.legalLink}>Privacy</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Preview component styles ─────────────────────────────────────────────────

const PREVIEW_BG = '#0a0a0a';
const preview = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PREVIEW_BG,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  statusTime: { color: '#fff', fontSize: 8, fontWeight: '600' },
  statusIcons: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { height: 6, backgroundColor: '#888', borderRadius: 3 },

  // Cram
  cramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cramBack: { color: '#aaa', fontSize: 10 },
  cramTitle: { color: '#fff', fontSize: 9, fontWeight: '700' },
  cramSub: { color: '#666', fontSize: 7 },
  cramBookmark: { color: '#aaa', fontSize: 9 },
  cramProgressTrack: { height: 1.5, backgroundColor: '#222', marginHorizontal: 10 },
  cramProgressFill: { height: 1.5, backgroundColor: '#7c3aed' },
  cramCardWrap: { flex: 1, padding: 10, justifyContent: 'center' },
  cramCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  cramCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  answerPillText: { color: '#15803d', fontSize: 6, fontWeight: '700' },
  cramSubject: { color: '#888', fontSize: 6.5 },
  cramQuestion: { color: '#000', fontSize: 8, fontWeight: '700', lineHeight: 11 },
  cramAnswer: { color: '#555', fontSize: 6.5, lineHeight: 9 },
  ratingRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingBottom: 8 },
  ratingBtn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  ratingText: { color: '#fff', fontSize: 7, fontWeight: '600' },

  // Feed
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  feedAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#7c3aed' },
  feedTabs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
    paddingBottom: 5,
  },
  feedTab: { color: '#666', fontSize: 7, fontWeight: '500', paddingBottom: 3 },
  feedTabActive: {
    color: '#fff',
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#7c3aed',
  },
  feedCardWrap: {
    margin: 8,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#222',
    gap: 5,
  },
  feedCardHeader: { flexDirection: 'row', alignItems: 'center' },
  feedAuthor: { color: '#fff', fontSize: 7, fontWeight: '600' },
  feedCardSubject: { color: '#666', fontSize: 6 },
  feedCardCaption: { color: '#aaa', fontSize: 6.5, lineHeight: 9 },
  feedQuestion: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 7,
    gap: 4,
  },
  questionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  questionPillText: { color: '#7c3aed', fontSize: 5.5, fontWeight: '700' },
  feedQuestionText: { color: '#fff', fontSize: 7, fontWeight: '600', lineHeight: 9.5 },
  feedIcon: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#222' },
  commentsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentText: { color: '#555', fontSize: 6 },

  // Clips
  clipsGradient: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    position: 'relative',
  },
  clipsVideoFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a0a2e',
  },
  clipsPersonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b1e6e',
    marginBottom: 8,
  },
  clipsPersonBody: {
    width: 60,
    height: 70,
    borderRadius: 30,
    backgroundColor: '#2a1550',
  },
  clipBadge: {
    position: 'absolute',
    top: 16,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 3,
  },
  clipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ef4444' },
  clipBadgeText: { color: '#fff', fontSize: 6, fontWeight: '700' },
  clipsActions: {
    position: 'absolute',
    right: 8,
    bottom: 70,
    gap: 10,
    alignItems: 'center',
  },
  clipsActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipsActionIcon: { fontSize: 11 },
  clipsBottom: {
    position: 'absolute',
    bottom: 52,
    left: 10,
    right: 46,
    gap: 4,
  },
  clipsAuthor: { color: '#fff', fontSize: 7, fontWeight: '700' },
  followBtn: {
    borderWidth: 0.5,
    borderColor: '#fff',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  followBtnText: { color: '#fff', fontSize: 6, fontWeight: '600' },
  clipsCaption: { color: '#fff', fontSize: 6.5, lineHeight: 9, fontWeight: '500' },
  clipsTag: { color: '#a78bfa', fontSize: 6 },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: PREVIEW_BG,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    flex: 0,
  },
  navIcon: { color: '#444', fontSize: 11 },
  navIconActive: { color: '#7c3aed' },
  navPlusIcon: { color: '#fff', fontSize: 11 },
});

// ─── Main screen styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },

  wordmarkRow: {
    marginTop: 24,
    marginBottom: 16,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  tabPillText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },
  tabPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Phone frame
  phoneFrame: {
    width: PHONE_W,
    height: PHONE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    width: PHONE_W * 0.8,
    height: PHONE_H * 0.6,
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,252,0.12)',
    top: '20%',
  },
  phoneInner: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.13)',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },

  // Below fold
  belowFold: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8,
  },
  eyebrow: {
    color: '#52525b',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headlineBlack: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headlineViolet: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    color: '#9B7FFF',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Avatar stack
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarLabel: {
    color: '#71717a',
    fontSize: 12,
  },
  avatarBold: {
    color: '#fff',
    fontWeight: '700',
  },

  // CTA
  ctaBlock: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  createBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {},
  loginText: {
    color: '#71717a',
    fontSize: 13,
  },
  loginLink: {
    color: '#fff',
    fontWeight: '700',
  },
  legalText: {
    color: '#3f3f46',
    fontSize: 11,
    textAlign: 'center',
  },
  legalLink: {
    color: '#7c3aed',
  },
});
