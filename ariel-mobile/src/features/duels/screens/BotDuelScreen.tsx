import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants/theme';
import type { DuelsStackParamList } from '@/features/duels/DuelsNavigator';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';

type Props = NativeStackScreenProps<DuelsStackParamList, 'BotDuel'>;

interface Card { id: string; question: string; answer: string; subject?: string; choices?: string[]; }

const BOT_NAMES = ['Alex', 'Jordan', 'Sam', 'Morgan', 'Riley'];
const BOT_NAME = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
const BOT_DELAYS = [2800, 4200, 6000, 8500, 12000];

const FALLBACK: Card[] = [
  { id: '1', question: 'What is the powerhouse of the cell?', answer: 'Mitochondria', subject: 'Biology' },
  { id: '2', question: 'Speed of light?', answer: '299,792,458 m/s', subject: 'Physics' },
  { id: '3', question: 'WW2 ended in?', answer: '1945', subject: 'History' },
  { id: '4', question: 'Chemical formula of water?', answer: 'H₂O', subject: 'Chemistry' },
  { id: '5', question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare', subject: 'Literature' },
  { id: '6', question: 'Capital of France?', answer: 'Paris', subject: 'Geography' },
  { id: '7', question: '12 × 12 = ?', answer: '144', subject: 'Mathematics' },
  { id: '8', question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', subject: 'Art' },
  { id: '9', question: 'Largest planet in solar system?', answer: 'Jupiter', subject: 'Science' },
  { id: '10', question: 'What gas do plants absorb?', answer: 'CO₂', subject: 'Biology' },
  { id: '11', question: 'How many bones in adult human body?', answer: '206', subject: 'Biology' },
  { id: '12', question: 'Currency of Japan?', answer: 'Yen', subject: 'Economics' },
  { id: '13', question: 'What is 15% of 200?', answer: '30', subject: 'Mathematics' },
  { id: '14', question: 'Author of 1984?', answer: 'George Orwell', subject: 'Literature' },
  { id: '15', question: 'Chemical symbol for gold?', answer: 'Au', subject: 'Chemistry' },
  { id: '16', question: 'First element on periodic table?', answer: 'Hydrogen', subject: 'Chemistry' },
  { id: '17', question: 'Longest river in the world?', answer: 'Nile', subject: 'Geography' },
  { id: '18', question: 'Year World Wide Web invented?', answer: '1989', subject: 'Technology' },
  { id: '19', question: 'Unit of electric resistance?', answer: 'Ohm', subject: 'Physics' },
  { id: '20', question: 'Number of continents?', answer: '7', subject: 'Geography' },
];

function buildChoices(card: Card, pool: Card[]): string[] {
  if (card.choices && card.choices.length > 1) return card.choices;
  const correct = card.answer;
  const distractors = pool.filter(c => c.id !== card.id).map(c => c.answer).filter(a => a.toLowerCase() !== correct.toLowerCase()).sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

type Phase = 'countdown' | 'question' | 'reveal' | 'complete';

export function BotDuelScreen({ route, navigation }: Props): React.ReactElement {
  const { rounds } = route.params;
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const isShort = H < 720;

  const [cards, setCards] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswered, setUserAnswered] = useState(false);
  const [botAnswered, setBotAnswered] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  const userScoreRef = useRef(0);
  const botScoreRef = useRef(0);
  const roundsRef = useRef(rounds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botCorrect = useRef(false);
  const botAnsweredRef = useRef(false);

  // Load cards
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<Card[]>(CARDS.TRENDING, { params: { limit: rounds * 2 } });
        const data: Card[] = res.data ?? [];
        const pool = data.length >= rounds ? data.slice(0, rounds) : [...data, ...FALLBACK].slice(0, rounds);
        setCards(pool);
      } catch {
        setCards(FALLBACK.slice(0, rounds));
      }
    };
    load();
  }, [rounds]);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
  };

  const resolveRound = useCallback((userCorrect: boolean, opponentCorrect: boolean, nextIdx: number, allCards: Card[]) => {
    clearTimers();
    let res: 'win' | 'lose' | 'tie' = 'tie';
    if (userCorrect && !opponentCorrect) { userScoreRef.current++; setUserScore(userScoreRef.current); res = 'win'; }
    else if (opponentCorrect && !userCorrect) { botScoreRef.current++; setBotScore(botScoreRef.current); res = 'lose'; }
    else if (userCorrect && opponentCorrect) { userScoreRef.current++; botScoreRef.current++; setUserScore(userScoreRef.current); setBotScore(botScoreRef.current); }
    setRoundResult(res);
    setPhase('reveal');
    setTimeout(() => {
      if (nextIdx >= roundsRef.current) {
        const u = userScoreRef.current; const b = botScoreRef.current;
        navigation.replace('DuelResult', { result: { you_score: u, opponent_score: b, result: u > b ? 'win' : b > u ? 'lose' : 'tie' } });
      } else {
        setCurrentIdx(nextIdx);
        beginQuestion(allCards, nextIdx);
      }
    }, 2000);
  }, [navigation]);

  const beginQuestion = useCallback((allCards: Card[], idx: number) => {
    setPhase('question');
    setUserAnswer('');
    setUserAnswered(false);
    setBotAnswered(false);
    setRoundResult(null);
    setTimeLeft(15);
    setChoices(buildChoices(allCards[idx], allCards));
    botAnsweredRef.current = false;
    botCorrect.current = Math.random() < 0.65;
    const delay = BOT_DELAYS[Math.floor(Math.random() * BOT_DELAYS.length)];
    botTimerRef.current = setTimeout(() => { botAnsweredRef.current = true; setBotAnswered(true); }, delay);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); resolveRound(false, botAnsweredRef.current && botCorrect.current, idx + 1, allCards); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [resolveRound]);

  // Start countdown then game
  useEffect(() => {
    if (cards.length === 0) return;
    let c = 3;
    const cd = setInterval(() => {
      c--;
      setCountdown(c);
      if (c === 0) { clearInterval(cd); beginQuestion(cards, 0); }
    }, 1000);
    return () => clearInterval(cd);
  }, [cards, beginQuestion]);

  useEffect(() => () => clearTimers(), []);

  const handleAnswer = (choice: string) => {
    if (userAnswered || phase !== 'question') return;
    setUserAnswered(true);
    setUserAnswer(choice);
    const correct = choice.trim().toLowerCase() === cards[currentIdx]?.answer.trim().toLowerCase();
    resolveRound(correct, botAnsweredRef.current && botCorrect.current, currentIdx + 1, cards);
  };

  const card = cards[currentIdx];

  if (phase === 'countdown' || cards.length === 0) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.countdownLabel}>Duel starting in</Text>
        <Text style={s.countdownNumber}>{countdown || 'GO'}</Text>
        <Text style={s.countdownVs}>vs {BOT_NAME} (Bot)</Text>
      </View>
    );
  }

  if (!card) return <View style={s.screen} />;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={[s.topBar, isShort && { paddingVertical: 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.exitBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color="#71717a" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Round {currentIdx + 1} / {rounds}</Text>
        <View style={s.exitBtn} />
      </View>

      <ScrollView contentContainerStyle={[s.content, isShort && { gap: 10, paddingBottom: 24 }]} showsVerticalScrollIndicator={false}>
        {/* Scoreboard */}
        <View style={s.scoreboard}>
          <View style={[s.scoreCol, isShort && { paddingVertical: 10 }]}>
            <Text style={s.scoreLabel}>You</Text>
            <Text style={[s.scoreValue, { color: COLORS.violet[300] }, isShort && { fontSize: 24 }]}>{userScore}</Text>
          </View>
          <View style={s.scoreDiv} />
          <View style={[s.scoreCol, isShort && { paddingVertical: 10 }]}>
            <Text style={s.scoreLabel}>{BOT_NAME}</Text>
            <Text style={[s.scoreValue, { color: '#71717a' }, isShort && { fontSize: 24 }]}>{botScore}</Text>
          </View>
        </View>

        {/* Timer */}
        {phase === 'question' && (
          <View style={s.timerRow}>
            <View style={s.timerTrack}>
              <View style={[s.timerFill, { width: `${(timeLeft / 15) * 100}%` as any, backgroundColor: timeLeft > 8 ? COLORS.violet[400] : timeLeft > 4 ? '#f59e0b' : '#ef4444' }]} />
            </View>
            <Text style={[s.timerNum, timeLeft <= 4 && { color: '#ef4444' }]}>{timeLeft}</Text>
          </View>
        )}

        {/* Question */}
        <View style={[s.questionCard, isShort && { paddingHorizontal: 16, paddingVertical: 16 }]}>
          {card.subject && <Text style={s.subject}>{card.subject.toUpperCase()}</Text>}
          <Text style={[s.question, isShort && { fontSize: 17, lineHeight: 24 }]}>{card.question}</Text>
        </View>

        {/* Bot status */}
        <View style={s.botStatus}>
          <View style={[s.botDot, botAnswered && s.botDotAnswered]} />
          <Text style={[s.botStatusText, botAnswered && { color: '#f59e0b' }]}>
            {botAnswered ? `${BOT_NAME} answered` : `${BOT_NAME} is thinking...`}
          </Text>
        </View>

        {/* Choices */}
        <View style={[s.choicesGrid, isShort && { gap: 6 }]}>
          {choices.map((choice, i) => {
            const isSelected = userAnswer === choice;
            const isCorrect = phase === 'reveal' && choice.trim().toLowerCase() === card.answer.trim().toLowerCase();
            const isWrong = phase === 'reveal' && isSelected && !isCorrect;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.choiceBtn,
                  isCorrect && s.choiceCorrect,
                  isWrong && s.choiceWrong,
                  isSelected && phase === 'question' && s.choiceSelected,
                  isShort && { padding: 12 },
                ]}
                onPress={() => handleAnswer(choice)}
                disabled={userAnswered || phase === 'reveal'}
                activeOpacity={0.8}
              >
                <Text style={[s.choiceLetter, (isCorrect || isWrong) && { opacity: 0.6 }]}>{String.fromCharCode(65 + i)}</Text>
                <Text style={[s.choiceText, isCorrect && { color: '#6ee7b7' }, isWrong && { color: '#fca5a5' }]}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Round result */}
        {phase === 'reveal' && roundResult && (
          <View style={[s.resultBanner,
            roundResult === 'win' && s.resultBannerWin,
            roundResult === 'lose' && s.resultBannerLose,
          ]}>
            <Text style={[s.resultText,
              roundResult === 'win' && { color: '#6ee7b7' },
              roundResult === 'lose' && { color: '#fca5a5' },
              roundResult === 'tie' && { color: '#a1a1aa' },
            ]}>
              {roundResult === 'win' ? 'You got it first!' : roundResult === 'lose' ? `${BOT_NAME} was faster` : 'Tied!'}
            </Text>
            <Text style={s.correctAnswer}>Correct: <Text style={{ color: '#fafafa', fontWeight: '700' }}>{card.answer}</Text></Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  countdownLabel: { color: '#52525b', fontSize: 12, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  countdownNumber: { color: '#fafafa', fontSize: 96, fontWeight: '900', lineHeight: 100 },
  countdownVs: { color: '#52525b', fontSize: 14, marginTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#18181b' },
  exitBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: '#71717a', fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  scoreboard: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: '#27272a', overflow: 'hidden' },
  scoreCol: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  scoreLabel: { color: '#52525b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  scoreValue: { fontSize: 30, fontWeight: '900' },
  scoreDiv: { width: 1, backgroundColor: '#27272a', marginVertical: 10 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerTrack: { flex: 1, height: 5, backgroundColor: '#27272a', borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerNum: { color: '#71717a', fontSize: 13, fontWeight: '900', width: 20, textAlign: 'right' },
  questionCard: { backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 24, gap: 8 },
  subject: { color: '#9ca3af', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  question: { color: '#111827', fontSize: 20, fontWeight: '900', lineHeight: 28 },
  botStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3f3f46' },
  botDotAnswered: { backgroundColor: '#f59e0b' },
  botStatusText: { color: '#52525b', fontSize: 12, fontWeight: '500' },
  choicesGrid: { gap: 8 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#27272a', backgroundColor: '#18181b' },
  choiceSelected: { borderColor: `${COLORS.violet[500]}99`, backgroundColor: '#1c1525' },
  choiceCorrect: { borderColor: '#059669', backgroundColor: '#052e16' },
  choiceWrong: { borderColor: '#dc2626', backgroundColor: '#450a0a' },
  choiceLetter: { color: '#3f3f46', fontSize: 12, fontWeight: '900', width: 18 },
  choiceText: { flex: 1, color: '#e4e4e7', fontSize: 15, fontWeight: '600', lineHeight: 20 },
  resultBanner: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  resultBannerWin: { backgroundColor: '#052e16', borderColor: '#14532d' },
  resultBannerLose: { backgroundColor: '#450a0a', borderColor: '#7f1d1d' },
  resultText: { fontSize: 16, fontWeight: '800' },
  correctAnswer: { color: '#52525b', fontSize: 12 },
});
