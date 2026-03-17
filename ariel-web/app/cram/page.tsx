'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { aiChatAPI } from '@/lib/api';

interface CramBlock {
  subject: string;
  topics: string[];
  minutes: number;
  priority: 'critical' | 'high' | 'medium';
  tip: string;
}

interface CramPlan {
  total_minutes: number;
  strategy: string;
  blocks: CramBlock[];
  final_advice: string;
}

const SUBJECTS = [
  'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History',
  'Literature', 'Economics', 'Computer Science', 'Psychology', 'Other',
];

export default function CramPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [hoursLeft, setHoursLeft] = useState('');
  const [topics, setTopics] = useState('');
  const [weakAreas, setWeakAreas] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CramPlan | null>(null);
  const [error, setError] = useState('');
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());

  const finalSubject = subject === 'Other' ? customSubject : subject;

  const handleGenerate = async () => {
    if (!finalSubject.trim() || !hoursLeft) return;
    setLoading(true);
    setError('');
    setPlan(null);

    const prompt = `You are an expert study coach. A student has ${hoursLeft} hour(s) until their ${finalSubject} exam.
${topics ? `Topics covered: ${topics}` : ''}
${weakAreas ? `Weak areas they struggle with: ${weakAreas}` : ''}

Create a focused cram plan as a JSON object with this exact shape:
{
  "total_minutes": <number>,
  "strategy": "<one sentence strategy>",
  "blocks": [
    {
      "subject": "${finalSubject}",
      "topics": ["<topic1>", "<topic2>"],
      "minutes": <number>,
      "priority": "critical" | "high" | "medium",
      "tip": "<specific actionable tip for this block>"
    }
  ],
  "final_advice": "<motivating 1-sentence send-off>"
}

Rules: blocks should add up to total_minutes. Prioritize high-yield topics. Max 6 blocks. Include 5-min breaks between blocks. Return only valid JSON.`;

    try {
      const res = await aiChatAPI.complete(prompt);
      const raw = typeof res?.reply === 'string' ? res.reply : JSON.stringify(res?.reply ?? '');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed: CramPlan = JSON.parse(jsonMatch[0]);
      setPlan(parsed);
    } catch {
      setError('Failed to generate plan. Check your AI provider settings and try again.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = (p: CramBlock['priority']) => ({
    critical: 'text-red-400 bg-red-900/20 border-red-800/40',
    high: 'text-orange-400 bg-orange-900/20 border-orange-800/40',
    medium: 'text-violet-300 bg-violet-900/20 border-violet-800/40',
  }[p]);

  const priorityDot = (p: CramBlock['priority']) => ({
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-violet-300',
  }[p]);

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-20">
        <header className="sticky top-0 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Cram Mode</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Exam triage — make every minute count</p>
            </div>
            {plan && (
              <button
                onClick={() => { setPlan(null); setCompletedBlocks(new Set()); setActiveBlock(null); }}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                New plan
              </button>
            )}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {!plan ? (
            <div className="space-y-5">
              {/* Urgency banner */}
              <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-violet-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
                  </svg>
                </div>
                <p className="text-sm text-violet-200 font-medium">
                  Tell Ariel your situation — it'll build the most efficient study plan for the time you have left.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Subject</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        subject === s
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {subject === 'Other' && (
                  <input
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    placeholder="Enter subject..."
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 transition-colors"
                  />
                )}
              </div>

              {/* Hours left */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Hours until exam</label>
                <div className="space-y-2">
                  {[
                    { label: 'Critical', hours: ['1', '2'], color: { sel: 'bg-red-600 border-red-600 text-white', badge: 'text-red-400', unsel: 'bg-zinc-900 border-red-900/50 text-zinc-400 hover:border-red-700/60' } },
                    { label: 'Tight', hours: ['3', '4', '6'], color: { sel: 'bg-amber-600 border-amber-600 text-white', badge: 'text-amber-400', unsel: 'bg-zinc-900 border-amber-900/40 text-zinc-400 hover:border-amber-700/50' } },
                    { label: 'Comfortable', hours: ['8', '12', '24'], color: { sel: 'bg-emerald-600 border-emerald-600 text-white', badge: 'text-emerald-400', unsel: 'bg-zinc-900 border-emerald-900/40 text-zinc-400 hover:border-emerald-700/50' } },
                  ].map(group => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold w-[70px] flex-shrink-0 ${group.color.badge}`}>{group.label}</span>
                      <div className="flex gap-1.5 flex-1">
                        {group.hours.map(h => (
                          <button
                            key={h}
                            onClick={() => setHoursLeft(h)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                              hoursLeft === h ? group.color.sel : group.color.unsel
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Topics covered <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea
                  value={topics}
                  onChange={e => setTopics(e.target.value)}
                  placeholder="e.g., Mitosis, DNA replication, Protein synthesis..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 resize-none transition-colors"
                />
              </div>

              {/* Weak areas */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Weak areas <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea
                  value={weakAreas}
                  onChange={e => setWeakAreas(e.target.value)}
                  placeholder="e.g., I always confuse meiosis vs mitosis..."
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 resize-none transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!finalSubject.trim() || !hoursLeft || loading}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Building your plan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>
                    Build cram plan
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1">Your plan</p>
                    <h2 className="text-lg font-bold text-white">{finalSubject} — {plan.total_minutes} min</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-400">{hoursLeft}h</p>
                    <p className="text-xs text-zinc-500">remaining</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{plan.strategy}</p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 transition-all duration-500"
                    style={{ width: `${(completedBlocks.size / plan.blocks.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 font-medium">{completedBlocks.size}/{plan.blocks.length} done</span>
              </div>

              {/* Blocks */}
              <div className="space-y-3">
                {plan.blocks.map((block, idx) => {
                  const isActive = activeBlock === idx;
                  const isDone = completedBlocks.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isDone
                          ? 'border-violet-800/40 bg-violet-900/10'
                          : isActive
                          ? 'border-zinc-600 bg-zinc-900'
                          : 'border-zinc-800 bg-zinc-900'
                      }`}
                    >
                      <button
                        className="w-full p-4 text-left"
                        onClick={() => setActiveBlock(isActive ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? 'bg-violet-300' : priorityDot(block.priority)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isDone ? 'text-violet-300 bg-violet-900/20 border-violet-800/40' : priorityColor(block.priority)}`}>
                                {isDone ? 'Done' : block.priority}
                              </span>
                              <span className="text-xs text-zinc-500">{block.minutes} min</span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate">
                              {block.topics.join(', ')}
                            </p>
                          </div>
                          <svg className={`w-4 h-4 text-zinc-600 transition-transform flex-shrink-0 ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isActive && (
                        <div className="px-4 pb-4 pt-0 border-t border-zinc-800 mt-1">
                          <p className="text-sm text-zinc-400 leading-relaxed mb-4 pt-3">{block.tip}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push('/review')}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              Review cards
                            </button>
                            {!isDone && (
                              <button
                                onClick={() => {
                                  setCompletedBlocks(prev => new Set([...prev, idx]));
                                  setActiveBlock(null);
                                }}
                                className="flex-1 py-2 bg-violet-400 hover:bg-violet-300 text-white text-sm font-semibold rounded-lg transition-colors"
                              >
                                Mark done
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Final advice */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-400 leading-relaxed italic">"{plan.final_advice}"</p>
              </div>

              {completedBlocks.size === plan.blocks.length && (
                <div className="bg-violet-900/20 border border-violet-700/40 rounded-xl p-5 text-center">
                  <p className="text-2xl font-bold text-violet-300 mb-1">You're ready.</p>
                  <p className="text-sm text-violet-300/70">Go get it.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
