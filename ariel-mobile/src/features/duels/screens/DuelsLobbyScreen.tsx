import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { quickMatch, challengeUser } from '@/features/duels/api/duelsApi';
import { COLORS } from '@/shared/constants/theme';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';
import apiClient from '@/shared/api/client';
import { SOCIAL } from '@/shared/api/endpoints';

type Props = NativeStackScreenProps<DuelsStackParamList, 'DuelsLobby'>;
type GameMode = 'bot' | 'quick' | 'challenge';
interface UserResult { id: string; username: string | null; full_name: string | null; }
const ROUND_OPTIONS = [5, 10, 15, 20];

export function DuelsLobbyScreen({ navigation }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const isShort = H < 720;
  const [mode, setMode] = useState<GameMode>('bot');
  const [rounds, setRounds] = useState(5);
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiClient.get<UserResult[]>(SOCIAL.SEARCH_USERS, { params: { q: searchQuery.trim(), limit: 8 } });
        setSearchResults(res.data ?? []);
      } catch { setSearchResults([]); } finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleQuickMatch = async () => {
    setLoadingQuick(true);
    try {
      const { room_id } = await quickMatch(rounds);
      navigation.navigate('DuelRoom', { roomId: room_id });
    } catch { Alert.alert('Matchmaking', 'Could not find a match right now. Try again!'); }
    finally { setLoadingQuick(false); }
  };

  const handleChallenge = async (username: string) => {
    setSendingTo(username);
    try {
      const { room_id } = await challengeUser(username, rounds);
      navigation.navigate('DuelRoom', { roomId: room_id });
    } catch { Alert.alert('Challenge', `Could not challenge @${username}. Try again.`); }
    finally { setSendingTo(null); }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[s.scroll, isShort && { gap: 10, paddingBottom: 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[s.header, isShort && { paddingTop: 12, gap: 2 }]}>
          <Text style={[s.title, isShort && { fontSize: 24 }]}>Duels</Text>
          <Text style={s.subtitle}>Head-to-head knowledge battles</Text>
        </View>

        <View style={s.modeRow}>
          {([
            { key: 'bot', icon: 'hardware-chip-outline', label: 'vs Bot', sub: 'No waiting' },
            { key: 'quick', icon: 'flash-outline', label: 'Quick Match', sub: 'Random player' },
            { key: 'challenge', icon: 'person-outline', label: 'Challenge', sub: 'Pick a player' },
          ] as { key: GameMode; icon: any; label: string; sub: string }[]).map(({ key, icon, label, sub }) => (
            <TouchableOpacity key={key} style={[s.modeCard, mode === key && s.modeCardActive, isShort && { padding: 9 }]} onPress={() => setMode(key)} activeOpacity={0.8}>
              {mode === key && <View style={s.modeActiveDot} />}
              <View style={[s.modeIconBox, mode === key && s.modeIconBoxActive]}>
                <Ionicons name={icon} size={20} color={mode === key ? COLORS.violet[300] : '#52525b'} />
              </View>
              <Text style={[s.modeLabel, mode === key && s.modeLabelActive]}>{label}</Text>
              <Text style={s.modeSub}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.card, isShort && { padding: 14, gap: 10 }]}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Rounds</Text>
            <Text style={s.cardSub}>~{rounds * 20}s total</Text>
          </View>
          <View style={s.roundRow}>
            {ROUND_OPTIONS.map(n => (
              <TouchableOpacity key={n} style={[s.roundBtn, rounds === n && s.roundBtnActive, isShort && { paddingVertical: 7 }]} onPress={() => setRounds(n)} activeOpacity={0.7}>
                <Text style={[s.roundBtnText, rounds === n && s.roundBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {mode === 'bot' && (
          <View style={[s.card, isShort && { padding: 14, gap: 10 }]}>
            <View style={s.vsRow}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={[s.avatar, { backgroundColor: '#0f172a' }]}><Text style={{ color: '#60a5fa', fontSize: 20, fontWeight: '900' }}>Y</Text></View>
                <Text style={s.avatarLabel}>You</Text>
              </View>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Ionicons name="flash" size={16} color={COLORS.violet[400]} />
                <Text style={s.vsText}>VS</Text>
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={[s.avatar, { backgroundColor: '#1c1c1e' }]}><Ionicons name="hardware-chip-outline" size={22} color="#71717a" /></View>
                <Text style={s.avatarLabel}>Bot</Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {[
                { color: COLORS.violet[400], text: `${rounds} rounds · 15 sec each` },
                { color: '#34d399', text: '4 answer choices per question' },
                { color: '#fbbf24', text: 'Fastest correct answer wins round' },
              ].map(({ color, text }, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, flexShrink: 0 }} />
                  <Text style={{ color: '#71717a', fontSize: 13 }}>{text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[s.primaryBtn, isShort && { paddingVertical: 12 }]} onPress={() => navigation.navigate('BotDuel', { rounds })} activeOpacity={0.85}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Start Duel</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'quick' && (
          <View style={[s.card, isShort && { padding: 14, gap: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={s.quickIcon}>
                <Ionicons name="flash" size={26} color={COLORS.violet[300]} />
                <View style={s.onlineDot} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.cardTitle}>Random Opponent</Text>
                <Text style={s.cardSub}>Matched with someone online right now</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.primaryBtn, loadingQuick && s.primaryBtnDisabled, isShort && { paddingVertical: 12 }]} onPress={handleQuickMatch} disabled={loadingQuick} activeOpacity={0.85}>
              {loadingQuick
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={s.primaryBtnText}>Finding...</Text></>
                : <><Ionicons name="flash" size={18} color="#fff" /><Text style={s.primaryBtnText}>Find Opponent</Text></>
              }
            </TouchableOpacity>
          </View>
        )}

        {mode === 'challenge' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Search for a player</Text>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={16} color="#52525b" />
              <TextInput style={s.searchInput} placeholder="Search by username..." placeholderTextColor="#52525b" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
              {searchLoading && <ActivityIndicator size="small" color="#52525b" />}
            </View>
            {searchResults.map(user => (
              <View key={user.id} style={s.resultRow}>
                <View style={s.resultAvatar}><Text style={s.resultAvatarText}>{(user.username?.[0] ?? '?').toUpperCase()}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.resultUsername}>@{user.username}</Text>
                  {user.full_name ? <Text style={s.resultName}>{user.full_name}</Text> : null}
                </View>
                <TouchableOpacity style={[s.challengeBtn, sendingTo === user.username && s.challengeBtnDisabled]} onPress={() => user.username && handleChallenge(user.username)} disabled={sendingTo === user.username || !user.username} activeOpacity={0.8}>
                  {sendingTo === user.username ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.challengeBtnText}>Challenge</Text>}
                </TouchableOpacity>
              </View>
            ))}
            {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <Text style={s.emptySearch}>No players found</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  header: { paddingTop: 20, gap: 4 },
  title: { color: '#fafafa', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#52525b', fontSize: 13 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCard: { flex: 1, backgroundColor: '#18181b', borderWidth: 1.5, borderColor: '#27272a', borderRadius: 16, padding: 12, alignItems: 'flex-start', position: 'relative' },
  modeCardActive: { borderColor: '#7c3aed99', backgroundColor: '#1c1525' },
  modeActiveDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.violet[400] },
  modeIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  modeIconBoxActive: { backgroundColor: '#7c3aed33' },
  modeLabel: { color: '#71717a', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  modeLabelActive: { color: '#fafafa' },
  modeSub: { color: '#3f3f46', fontSize: 10 },
  card: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 20, padding: 18, gap: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#fafafa', fontSize: 15, fontWeight: '700' },
  cardSub: { color: '#52525b', fontSize: 12 },
  roundRow: { flexDirection: 'row', gap: 8 },
  roundBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center' },
  roundBtnActive: { backgroundColor: COLORS.violet[600] },
  roundBtnText: { color: '#71717a', fontSize: 14, fontWeight: '700' },
  roundBtnTextActive: { color: '#fff' },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  vsText: { color: '#3f3f46', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { color: '#52525b', fontSize: 11, fontWeight: '600' },
  quickIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#3730a31a', borderWidth: 1.5, borderColor: '#3730a340', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#18181b' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#27272a', borderRadius: 12, borderWidth: 1, borderColor: '#3f3f46', paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, color: '#fafafa', fontSize: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  resultAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resultAvatarText: { color: '#a1a1aa', fontSize: 14, fontWeight: '700' },
  resultUsername: { color: '#fafafa', fontSize: 14, fontWeight: '600' },
  resultName: { color: '#52525b', fontSize: 12 },
  challengeBtn: { backgroundColor: COLORS.violet[600], paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, minWidth: 82, alignItems: 'center' },
  challengeBtnDisabled: { backgroundColor: '#27272a' },
  challengeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptySearch: { color: '#3f3f46', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.violet[600], paddingVertical: 15, borderRadius: 14 },
  primaryBtnDisabled: { backgroundColor: '#27272a' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
