import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../AuthNavigator';
import { ArielWordmark } from '@/shared/components/ArielWordmark';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;


type Tab = 'Flashcards' | 'Social Feed' | 'Clips';
const TABS: Tab[] = ['Flashcards', 'Social Feed', 'Clips'];

// ─── Real app screenshots bundled as assets ────────────────────────────────────

const SCREEN_IMAGES: Record<Tab, ReturnType<typeof require>> = {
  'Flashcards':   require('../../../../assets/mockup-deck.jpg'),
  'Social Feed':  require('../../../../assets/mockup-feed.jpg'),
  'Clips':        require('../../../../assets/mockup-reels.jpg'),
};

// ─── Phone mockup with real screenshots ───────────────────────────────────────

function PhoneMockup({ activeTab, fade, phoneW, phoneH }: { activeTab: Tab; fade: Animated.Value; phoneW: number; phoneH: number }) {
  return (
    <View style={[s.phoneWrap, { width: phoneW + 12, height: phoneH + 12 }]}>
      {/* Purple glow behind */}
      <View style={[s.phoneGlow, { width: phoneW * 0.8, height: phoneH * 0.5 }]} />

      {/* Phone shell */}
      <View style={[s.phoneFrame, { width: phoneW, height: phoneH, borderRadius: phoneW * 0.12 }]}>
        {/* Screenshot — contain so full screen shows with no crop */}
        <Animated.Image
          source={SCREEN_IMAGES[activeTab] as any}
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
  const { width: W, height: H } = useWindowDimensions();
  const isShort = H < 720;
  const phoneW = W * (isShort ? 0.36 : 0.44);
  const phoneH = phoneW * 2.164;
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
      <View style={[s.wordmarkWrap, { marginTop: isShort ? 4 : 8, marginBottom: isShort ? 4 : 8 }]}>
        <ArielWordmark size={isShort ? 32 : 42} />
      </View>

      {/* Tab pills */}
      <View style={[s.tabRow, { marginBottom: isShort ? 4 : 8 }]}>
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
      <PhoneMockup activeTab={activeTab} fade={fade} phoneW={phoneW} phoneH={phoneH} />

      {/* Headline block */}
      <View style={[s.heroBlock, { marginTop: isShort ? 4 : 10, gap: isShort ? 2 : 3 }]}>
        <Text style={s.eyebrow}>THE SOCIAL STUDY APP</Text>
        <View style={s.headlineRow}>
          <Text style={[s.headlineBold, { fontSize: isShort ? 20 : 24 }]}>Go </Text>
          <Text style={[s.headlineItalic, { fontSize: isShort ? 20 : 24 }]}>deeper.</Text>
        </View>
        <Text style={s.subtitle}>
          Flashcards, a social feed, and short clips —{'\n'}the whole learning stack in one place.
        </Text>
        <AvatarStack />
      </View>

      {/* CTAs */}
      <View style={s.ctaBlock}>
        <TouchableOpacity
          style={[s.createBtn, { paddingVertical: isShort ? 13 : 16 }]}
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
    // marginTop/marginBottom applied inline (isShort-aware)
  },

  tabRow: {
    flexDirection: 'row',
    gap: 6,
    // marginBottom applied inline (isShort-aware)
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

  // Phone frame — width/height/borderRadius applied inline (isShort-aware)
  phoneWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,252,0.16)',
    top: '20%',
  },
  phoneFrame: {
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

  // Hero block — marginTop/gap applied inline (isShort-aware)
  heroBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
    // paddingVertical applied inline (isShort-aware)
    alignItems: 'center',
  },
  createBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  loginText: { color: '#52525b', fontSize: 12 },
  loginLink: { color: '#fff', fontWeight: '700' },
  legal: { color: '#27272a', fontSize: 10, textAlign: 'center' },
  legalLink: { color: '#7c3aed' },
});
