import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../AuthNavigator';
import { ArielWordmark } from '@/shared/components/ArielWordmark';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SW, height: SH } = Dimensions.get('window');

// Phone mockup sized to leave room for all content below
const PHONE_H = SH * 0.36;
const PHONE_W = PHONE_H * 0.503;

type Tab = 'Flashcards' | 'Social Feed' | 'Clips';
const TABS: Tab[] = ['Flashcards', 'Social Feed', 'Clips'];

// ─── Flashcard preview ────────────────────────────────────────────────────────

function CramPreview() {
  return (
    <View style={p.screen}>
      <View style={p.statusBar}>
        <Text style={p.statusTime}>9:41</Text>
      </View>
      <View style={p.cramHeader}>
        <Text style={p.cramBack}>←</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={p.cramTitle}>History</Text>
          <Text style={p.cramSub}>Card 3 of 12</Text>
        </View>
        <Text style={p.cramBookmark}>⊡</Text>
      </View>
      <View style={p.cramProgressTrack}>
        <View style={[p.cramProgressFill, { width: '25%' }]} />
      </View>
      <View style={p.cramCardWrap}>
        <View style={p.cramCard}>
          <View style={p.cramCardTop}>
            <View style={p.answerPill}>
              <Text style={p.answerPillText}>ANSWER</Text>
            </View>
            <Text style={p.cramSubjectLabel}>📖 History</Text>
          </View>
          <Text style={p.cramQuestion}>What caused the fall of the Roman Empire?</Text>
          <Text style={p.cramAnswer}>Economic turmoil, political instability, and sustained barbarian pressure.</Text>
        </View>
      </View>
      <View style={p.ratingRow}>
        <View style={[p.ratingBtn, { backgroundColor: '#7f1d1d' }]}><Text style={p.ratingText}>Again</Text></View>
        <View style={[p.ratingBtn, { backgroundColor: '#422006' }]}><Text style={p.ratingText}>Hard</Text></View>
        <View style={[p.ratingBtn, { backgroundColor: '#14532d' }]}><Text style={p.ratingText}>Got it ✓</Text></View>
      </View>
      <MiniBottomNav active={0} />
    </View>
  );
}

// ─── Feed preview ─────────────────────────────────────────────────────────────

function FeedPreview() {
  return (
    <View style={p.screen}>
      <View style={p.statusBar}>
        <Text style={p.statusTime}>9:41</Text>
      </View>
      <View style={p.feedHeader}>
        <View style={p.feedAvatar} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ArielWordmark size={11} />
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={p.feedIcon} /><View style={p.feedIcon} />
        </View>
      </View>
      <View style={p.feedTabs}>
        <Text style={[p.feedTab, p.feedTabActive]}>For You</Text>
        <Text style={p.feedTab}>Following</Text>
      </View>
      <View style={p.feedCard}>
        <View style={p.feedCardRow}>
          <View style={[p.feedAvatar, { width: 16, height: 16, borderRadius: 8 }]} />
          <View style={{ marginLeft: 5 }}>
            <Text style={p.feedAuthor}>Dr. Priya K.</Text>
            <Text style={p.feedCardMeta}>Economics</Text>
          </View>
        </View>
        <Text style={p.feedCaption} numberOfLines={2}>Most people confuse these two. Once you see it, you can't unsee it.</Text>
        <View style={p.questionBox}>
          <View style={p.questionPill}><Text style={p.questionPillText}>QUESTION</Text></View>
          <Text style={p.questionText} numberOfLines={2}>What is the difference between GDP and GNP?</Text>
        </View>
        <View style={p.commentRow}>
          <View style={[p.feedAvatar, { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }]} />
          <Text style={p.commentText}>Maya S. Never thought about it this way</Text>
        </View>
        <View style={p.commentRow}>
          <View style={[p.feedAvatar, { width: 12, height: 12, borderRadius: 6, backgroundColor: '#eab308' }]} />
          <Text style={p.commentText}>Xav Saving this for my next exam 📚</Text>
        </View>
      </View>
      <MiniBottomNav active={1} />
    </View>
  );
}

// ─── Clips preview ────────────────────────────────────────────────────────────

function ClipsPreview() {
  return (
    <View style={[p.screen, { backgroundColor: '#0d0d18' }]}>
      <View style={p.clipsVideo}>
        <View style={p.clipsPerson} />
        <View style={p.clipsPersonBody} />
      </View>
      <View style={p.clipBadge}>
        <View style={p.clipDot} /><Text style={p.clipBadgeText}>CLIP</Text>
      </View>
      <View style={p.clipsActions}>
        {['♥','💬','↗'].map((ic, i) => (
          <View key={i} style={p.clipsBtn}><Text style={p.clipsBtnText}>{ic}</Text></View>
        ))}
      </View>
      <View style={p.clipsBottom}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[p.feedAvatar, { width: 14, height: 14, borderRadius: 7 }]} />
          <Text style={p.clipsAuthor}>@alexhistory</Text>
          <View style={p.followBtn}><Text style={p.followText}>+ Follow</Text></View>
        </View>
        <Text style={p.clipsCaption} numberOfLines={2}>Why the Roman Empire really fell — it wasn't what you think</Text>
        <Text style={p.clipsTag}>#history  #education</Text>
      </View>
      <MiniBottomNav active={3} dark />
    </View>
  );
}

function MiniBottomNav({ active, dark }: { active: number; dark?: boolean }) {
  const icons = ['⊟', '⌂', '+', '⚡', '◯'];
  return (
    <View style={[p.bottomNav, dark && { backgroundColor: 'transparent', borderTopColor: '#222' }]}>
      {icons.map((icon, i) => (
        <View key={i} style={i === 2 ? p.navPlus : p.navItem}>
          <Text style={[p.navIcon, i === 2 ? p.navPlusIcon : i === active ? p.navActive : {}]}>{icon}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

// Real human face photos (diverse, student-aged, free stock)
const AVATAR_URIS = [
  'https://i.pravatar.cc/100?img=47',
  'https://i.pravatar.cc/100?img=32',
  'https://i.pravatar.cc/100?img=11',
  'https://i.pravatar.cc/100?img=25',
  'https://i.pravatar.cc/100?img=68',
];

function AvatarStack() {
  return (
    <View style={s.avatarRow}>
      <View style={s.avatarStack}>
        {AVATAR_URIS.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={[s.avatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }]}
          />
        ))}
      </View>
      <Text style={s.avatarLabel}>
        Join <Text style={s.avatarBold}>500+</Text> students already learning
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Flashcards');
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setActiveTab(prev => {
          const idx = TABS.indexOf(prev);
          return TABS[(idx + 1) % TABS.length];
        });
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    };
    const id = setInterval(cycle, 3400);
    return () => clearInterval(id);
  }, [fade]);

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="light-content" />

      {/* Wordmark */}
      <View style={s.wordmarkWrap}>
        <ArielWordmark size={44} />
      </View>

      {/* Tab pills */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tabPill, activeTab === tab && s.tabPillActive]}
            onPress={() => switchTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone frame */}
      <View style={s.phoneWrap}>
        <View style={s.phoneGlow} />
        <View style={s.phoneFrame}>
          <Animated.View style={{ flex: 1, opacity: fade }}>
            {activeTab === 'Flashcards' && <CramPreview />}
            {activeTab === 'Social Feed' && <FeedPreview />}
            {activeTab === 'Clips' && <ClipsPreview />}
          </Animated.View>
        </View>
      </View>

      {/* Headline block */}
      <View style={s.heroBlock}>
        <Text style={s.eyebrow}>THE SOCIAL STUDY APP</Text>
        <View style={s.headlineRow}>
          <Text style={s.headlineBold}>Go </Text>
          <Text style={s.headlineItalic}>deeper.</Text>
        </View>
        <Text style={s.subtitle}>
          Flashcards, a social feed, and short clips —{'\n'}the whole learning stack in one place.
        </Text>
        <AvatarStack />
      </View>

      {/* CTAs */}
      <View style={s.ctaBlock}>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.9}>
          <Text style={s.createBtnText}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={s.loginText}>
            Already have an account? <Text style={s.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
        <Text style={s.legal}>
          By signing up you agree to our <Text style={s.legalLink}>Terms</Text> & <Text style={s.legalLink}>Privacy</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Preview styles (mini scaled UI inside phone) ─────────────────────────────

const p = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0a' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 5, paddingBottom: 1 },
  statusTime: { color: '#fff', fontSize: 7, fontWeight: '600' },

  cramHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  cramBack: { color: '#aaa', fontSize: 8 },
  cramTitle: { color: '#fff', fontSize: 7, fontWeight: '700' },
  cramSub: { color: '#555', fontSize: 5.5 },
  cramBookmark: { color: '#aaa', fontSize: 8 },
  cramProgressTrack: { height: 1.5, backgroundColor: '#1e1e1e', marginHorizontal: 8 },
  cramProgressFill: { height: 1.5, backgroundColor: '#7c3aed' },
  cramCardWrap: { flex: 1, padding: 8, justifyContent: 'center' },
  cramCard: { backgroundColor: '#fff', borderRadius: 8, padding: 8, gap: 5 },
  cramCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerPill: { backgroundColor: '#dcfce7', paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 3 },
  answerPillText: { color: '#15803d', fontSize: 5, fontWeight: '700' },
  cramSubjectLabel: { color: '#888', fontSize: 5.5 },
  cramQuestion: { color: '#000', fontSize: 7, fontWeight: '700', lineHeight: 10 },
  cramAnswer: { color: '#555', fontSize: 5.5, lineHeight: 8 },
  ratingRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingBottom: 6 },
  ratingBtn: { flex: 1, borderRadius: 5, paddingVertical: 4, alignItems: 'center' },
  ratingText: { color: '#fff', fontSize: 6, fontWeight: '600' },

  feedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5 },
  feedAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#7c3aed' },
  feedTabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#222', paddingBottom: 4 },
  feedTab: { color: '#555', fontSize: 6, fontWeight: '500' },
  feedTabActive: { color: '#fff', fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#7c3aed' },
  feedCard: { margin: 7, backgroundColor: '#111', borderRadius: 8, padding: 7, borderWidth: 0.5, borderColor: '#1e1e1e', gap: 4 },
  feedCardRow: { flexDirection: 'row', alignItems: 'center' },
  feedAuthor: { color: '#fff', fontSize: 6, fontWeight: '600' },
  feedCardMeta: { color: '#555', fontSize: 5 },
  feedCaption: { color: '#888', fontSize: 5.5, lineHeight: 8 },
  feedIcon: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#1e1e1e' },
  questionBox: { backgroundColor: '#1a1a1a', borderRadius: 5, padding: 6, gap: 3 },
  questionPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.12)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 },
  questionPillText: { color: '#7c3aed', fontSize: 5, fontWeight: '700' },
  questionText: { color: '#fff', fontSize: 6, fontWeight: '600', lineHeight: 8.5 },
  commentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentText: { color: '#444', fontSize: 5.5 },

  clipsVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a0a2e' },
  clipsPerson: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b1e6e', marginBottom: 6 },
  clipsPersonBody: { width: 50, height: 60, borderRadius: 25, backgroundColor: '#2a1550' },
  clipBadge: { position: 'absolute', top: 12, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1.5, gap: 2 },
  clipDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444' },
  clipBadgeText: { color: '#fff', fontSize: 5.5, fontWeight: '700' },
  clipsActions: { position: 'absolute', right: 6, bottom: 60, gap: 8, alignItems: 'center' },
  clipsBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  clipsBtnText: { fontSize: 9 },
  clipsBottom: { position: 'absolute', bottom: 44, left: 8, right: 36, gap: 3 },
  clipsAuthor: { color: '#fff', fontSize: 6, fontWeight: '700' },
  followBtn: { borderWidth: 0.5, borderColor: '#fff', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 0.5 },
  followText: { color: '#fff', fontSize: 5, fontWeight: '600' },
  clipsCaption: { color: '#fff', fontSize: 6, lineHeight: 8.5, fontWeight: '500' },
  clipsTag: { color: '#a78bfa', fontSize: 5.5 },

  bottomNav: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#1a1a1a', paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center', backgroundColor: '#0a0a0a' },
  navItem: { flex: 1, alignItems: 'center' },
  navPlus: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3, flex: 0 },
  navIcon: { color: '#333', fontSize: 9 },
  navActive: { color: '#7c3aed' },
  navPlusIcon: { color: '#fff', fontSize: 9 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },

  wordmarkWrap: {
    marginTop: 12,
    marginBottom: 10,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  tabText: { color: '#52525b', fontSize: 11, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  phoneWrap: {
    width: PHONE_W,
    height: PHONE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    width: PHONE_W * 0.9,
    height: PHONE_H * 0.7,
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,252,0.14)',
  },
  phoneFrame: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.13)',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },

  heroBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 5,
  },
  eyebrow: {
    color: '#3f3f46',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headlineBold: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headlineItalic: {
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    fontStyle: 'italic',
    color: '#9B7FFF',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#52525b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarLabel: { color: '#52525b', fontSize: 11 },
  avatarBold: { color: '#fff', fontWeight: '700' },

  ctaBlock: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 10,
  },
  createBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  loginText: { color: '#52525b', fontSize: 12 },
  loginLink: { color: '#fff', fontWeight: '700' },
  legal: { color: '#27272a', fontSize: 10, textAlign: 'center' },
  legalLink: { color: '#7c3aed' },
});
