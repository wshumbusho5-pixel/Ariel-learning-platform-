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
// 44% of screen width, exact iPhone 16e aspect ratio (390:844 = 1:2.164)
// Screenshots fill with no crop — resizeMode contain
const PHONE_W = SW * 0.44;
const PHONE_H = PHONE_W * 2.164;

type Tab = 'Flashcards' | 'Social Feed' | 'Clips';
const TABS: Tab[] = ['Flashcards', 'Social Feed', 'Clips'];

// ─── Real app screenshots bundled as assets ────────────────────────────────────

const SCREEN_IMAGES: Record<Tab, ReturnType<typeof require>> = {
  'Flashcards':   require('../../../../assets/mockup-deck.jpg'),
  'Social Feed':  require('../../../../assets/mockup-feed.jpg'),
  'Clips':        require('../../../../assets/mockup-reels.jpg'),
};

// ─── Phone mockup with real screenshots ───────────────────────────────────────

function PhoneMockup({ activeTab, fade }: { activeTab: Tab; fade: Animated.Value }) {
  return (
    <View style={s.phoneWrap}>
      {/* Purple glow behind */}
      <View style={s.phoneGlow} />

      {/* Phone shell */}
      <View style={s.phoneFrame}>
        {/* Screenshot — contain so full screen shows with no crop */}
        <Animated.Image
          source={SCREEN_IMAGES[activeTab]}
          style={[s.phoneScreenshot, { opacity: fade }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

// ─── Avatar stack — fetches real users from API ───────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

function AvatarStack() {
  const [avatarUris, setAvatarUris] = useState<string[]>([]);

  useEffect(() => {
    // Fetch suggested users with profile pictures from the database
    fetch(`${BASE_URL}/api/social/suggested-users?limit=8`)
      .then((r) => r.json())
      .then((data: any[]) => {
        const pics = data
          .filter((u) => u.profile_picture)
          .map((u) => u.profile_picture as string)
          .slice(0, 5);
        if (pics.length >= 3) setAvatarUris(pics);
      })
      .catch(() => {
        // If API not reachable (unauthenticated), fall back to pravatar
        setAvatarUris([
          'https://i.pravatar.cc/100?img=47',
          'https://i.pravatar.cc/100?img=32',
          'https://i.pravatar.cc/100?img=11',
          'https://i.pravatar.cc/100?img=25',
          'https://i.pravatar.cc/100?img=68',
        ]);
      });
  }, []);

  if (avatarUris.length === 0) {
    // Placeholder while loading
    return (
      <View style={s.avatarRow}>
        <View style={s.avatarStack}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[s.avatar, s.avatarPlaceholder, { marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }]}
            />
          ))}
        </View>
        <Text style={s.avatarLabel}>
          Join <Text style={s.avatarBold}>500+</Text> students already learning
        </Text>
      </View>
    );
  }

  return (
    <View style={s.avatarRow}>
      <View style={s.avatarStack}>
        {avatarUris.map((uri, i) => (
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

  // Auto-cycle tabs every 3.4s
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
        <ArielWordmark size={42} />
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

      {/* Phone mockup with real screenshots */}
      <PhoneMockup activeTab={activeTab} fade={fade} />

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
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <Text style={s.createBtnText}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={s.loginText}>
            Already have an account? <Text style={s.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
        <Text style={s.legal}>
          By signing up you agree to our{' '}
          <Text style={s.legalLink}>Terms</Text> & <Text style={s.legalLink}>Privacy</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },

  wordmarkWrap: {
    marginTop: 8,
    marginBottom: 8,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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

  // Phone frame
  phoneWrap: {
    width: PHONE_W + 12,
    height: PHONE_H + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    width: PHONE_W * 0.8,
    height: PHONE_H * 0.5,
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,252,0.16)',
    top: '20%',
  },
  phoneFrame: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: PHONE_W * 0.12, // scales with phone size (~47px on 390 screen)
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  phoneScreenshot: {
    width: '100%',
    height: '100%',
  },

  // Hero block
  heroBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 3,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headlineItalic: {
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    fontStyle: 'italic',
    color: '#9B7FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Avatar stack
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
  avatarPlaceholder: {
    backgroundColor: '#1a1a1a',
  },

  avatarLabel: { color: '#52525b', fontSize: 11 },
  avatarBold: { color: '#fff', fontWeight: '700' },

  // CTAs
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
