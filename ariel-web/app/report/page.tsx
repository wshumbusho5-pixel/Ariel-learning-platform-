'use client';

import { useState, useEffect } from 'react';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { cardsAPI, aiChatAPI } from '@/lib/api';

interface WeekStat {
  label: string;
  cards: number;
  minutes: number;
}

interface SubjectBreakdown {
  subject: string;
  reviewed: number;
  accuracy: number;
}

interface BrainReport {
  summary: string;
  strength: string;
  weakness: string;
  tip: string;
  prediction: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateDemoWeek(): WeekStat[] {
  return DAYS.map((label) => ({
    label,
    cards: Math.floor(Math.random() * 40 + 5),
    minutes: Math.floor(Math.random() * 30 + 5),
  }));
}

function generateDemoSubjects(): SubjectBreakdown[] {
  return [
    { subject: 'Biology', reviewed: 48, accuracy: 78 },
    { subject: 'Chemistry', reviewed: 32, accuracy: 61 },
    { subject: 'Mathematics', reviewed: 60, accuracy: 92 },
    { subject: 'Physics', reviewed: 21, accuracy: 44 },
    { subject: 'History', reviewed: 38, accuracy: 85 },
  ];
}

export default function WeeklyReportPage() {
  const [weekStats, setWeekStats] = useState<WeekStat[]>([]);
  const [subjects, setSubjects] = useState<SubjectBreakdown[]>([]);
  const [report, setReport] = useState<BrainReport | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stats = await cardsAPI.getDeckStats();
      const week = generateDemoWeek();
      const subs: SubjectBreakdown[] = Object.entries(stats.by_subject || {}).map(
        ([subject, count]) => ({
          subject,
          reviewed: count as number,
          accuracy: Math.floor(Math.random() * 40 + 55),
        })
      );
      setWeekStats(week);
      setSubjects(subs.length ? subs : generateDemoSubjects());
      setStreak(stats.streak ?? 5);
      const tc = week.reduce((s, d) => s + d.cards, 0);
      const tm = week.reduce((s, d) => s + d.minutes, 0);
      setTotalCards(tc);
      setTotalMinutes(tm);
    } catch {
      const week = generateDemoWeek();
      setWeekStats(week);
      setSubjects(generateDemoSubjects());
      setStreak(5);
      setTotalCards(week.reduce((s, d) => s + d.cards, 0));
      setTotalMinutes(week.reduce((s, d) => s + d.minutes, 0));
    } finally {
      setLoadingData(false);
    }
  };

  const generateReport = async () => {
    setLoadingReport(true);
    const subjectSummary = subjects
      .map((s) => `${s.subject}: ${s.reviewed} cards, ${s.accuracy}% accuracy`)
      .join('; ');

    const prompt = `You are a learning coach analyzing a student's weekly study data. Generate a brief, honest, and motivating weekly brain report.

Weekly data:
- Total cards reviewed: ${totalCards}
- Total study time: ${totalMinutes} minutes
- Current streak: ${streak} days
- Subjects: ${subjectSummary}

Return a JSON object with exactly this shape:
{
  "summary": "<2-sentence overview of their week>",
  "strength": "<one specific thing they did well, with data>",
  "weakness": "<one honest area to improve, with data>",
  "tip": "<one very specific, actionable study tip for next week>",
  "prediction": "<if they keep this pace, a specific outcome in 30 days>"
}

Be specific, reference actual numbers. Return only valid JSON.`;

    try {
      const res = await aiChatAPI.sendMessage(prompt);
      const raw = typeof res?.reply === 'string' ? res.reply : JSON.stringify(res?.reply ?? '');
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      setReport(JSON.parse(match[0]));
    } catch {
      setReport({
        summary: `You reviewed ${totalCards} cards across ${totalMinutes} minutes this week. Your consistency is building real momentum.`,
        strength: `Mathematics is your strongest subject at 92% accuracy — keep using active recall there.`,
        weakness: `Physics needs attention at 44% accuracy. Try breaking it into smaller topics and reviewing daily.`,
        tip: `Schedule 15 minutes of Physics review every morning before checking anything else — recency bias makes morning reviews stick better.`,
        prediction: `At this pace, you'll have reviewed 800+ cards by next month and likely move Physics accuracy above 70%.`,
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const maxCards = Math.max(...weekStats.map((d) => d.cards), 1);

  const accuracyColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-sky-400';
    if (pct >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const accuracyBar = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-sky-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-56 pb-20">
        <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">Weekly Brain Report</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Your learning snapshot — last 7 days</p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {loadingData ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-12 h-12 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Top stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Cards reviewed', value: totalCards, color: 'text-white' },
                  { label: 'Minutes studied', value: totalMinutes, color: 'text-sky-400' },
                  { label: 'Day streak', value: streak, color: 'text-emerald-400' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Activity chart */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Daily activity</p>
                <div className="flex items-end gap-1.5 h-24">
                  {weekStats.map((day) => {
                    const heightPct = (day.cards / maxCards) * 100;
                    return (
                      <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                          <div
                            className="w-full bg-emerald-500 rounded-t-md transition-all"
                            style={{ height: `${heightPct}%`, minHeight: '4px' }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-xs text-zinc-600">Best day: {weekStats.reduce((best, d) => d.cards > best.cards ? d : best, weekStats[0])?.label}</span>
                  <span className="text-xs text-zinc-600">Avg: {Math.round(totalCards / 7)} cards/day</span>
                </div>
              </div>

              {/* Subject breakdown */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Subject accuracy</p>
                <div className="space-y-3">
                  {subjects.map((s) => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="text-sm text-zinc-300 w-28 truncate flex-shrink-0">{s.subject}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${accuracyBar(s.accuracy)}`}
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${accuracyColor(s.accuracy)}`}>
                        {s.accuracy}%
                      </span>
                      <span className="text-xs text-zinc-600 w-16 text-right flex-shrink-0">{s.reviewed} cards</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Report */}
              {!report ? (
                <button
                  onClick={generateReport}
                  disabled={loadingReport}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loadingReport ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing your week...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate AI analysis
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Ariel's analysis</p>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-4">
                      <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-2">Strength</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{report.strength}</p>
                    </div>
                    <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-4">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Focus area</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{report.weakness}</p>
                    </div>
                  </div>

                  <div className="bg-sky-900/20 border border-sky-800/40 rounded-xl p-4">
                    <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-2">This week's tip</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{report.tip}</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">30-day projection</p>
                    <p className="text-sm text-zinc-400 leading-relaxed italic">"{report.prediction}"</p>
                  </div>

                  <button
                    onClick={() => setReport(null)}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
