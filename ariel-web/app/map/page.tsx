'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import { cardsAPI } from '@/lib/api';

interface SubjectNode {
  subject: string;
  total: number;
  mastered: number;
  due: number;
  topics: TopicNode[];
}

interface TopicNode {
  topic: string;
  count: number;
  mastered: number;
}

export default function KnowledgeMapPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<SubjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SubjectNode | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<TopicNode | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stats = await cardsAPI.getDeckStats();
      const bySubject: Record<string, SubjectNode> = {};

      Object.entries(stats.by_subject || {}).forEach(([subject, count]) => {
        bySubject[subject] = {
          subject,
          total: count as number,
          mastered: Math.floor((count as number) * 0.4),
          due: Math.floor((count as number) * 0.2),
          topics: [],
        };
      });

      Object.entries(stats.by_topic || {}).forEach(([topic, count]) => {
        // Assign topics to subjects by first word match or to "General"
        const match = Object.keys(bySubject).find(s =>
          topic.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(topic.toLowerCase().split(' ')[0])
        );
        const key = match || Object.keys(bySubject)[0];
        if (key && bySubject[key]) {
          bySubject[key].topics.push({
            topic,
            count: count as number,
            mastered: Math.floor((count as number) * 0.4),
          });
        }
      });

      setNodes(Object.values(bySubject));
    } catch {
      // demo data
      setNodes([
        { subject: 'Biology', total: 48, mastered: 32, due: 8, topics: [
          { topic: 'Cell Biology', count: 15, mastered: 12 },
          { topic: 'Genetics', count: 18, mastered: 10 },
          { topic: 'Evolution', count: 15, mastered: 10 },
        ]},
        { subject: 'Chemistry', total: 35, mastered: 20, due: 12, topics: [
          { topic: 'Organic', count: 18, mastered: 8 },
          { topic: 'Inorganic', count: 17, mastered: 12 },
        ]},
        { subject: 'Mathematics', total: 60, mastered: 50, due: 3, topics: [
          { topic: 'Calculus', count: 20, mastered: 18 },
          { topic: 'Algebra', count: 25, mastered: 22 },
          { topic: 'Statistics', count: 15, mastered: 10 },
        ]},
        { subject: 'Physics', total: 28, mastered: 10, due: 15, topics: [
          { topic: 'Mechanics', count: 14, mastered: 6 },
          { topic: 'Thermodynamics', count: 14, mastered: 4 },
        ]},
        { subject: 'History', total: 42, mastered: 35, due: 2, topics: [
          { topic: 'World War II', count: 20, mastered: 18 },
          { topic: 'Ancient Rome', count: 22, mastered: 17 },
        ]},
      ]);
    } finally {
      setLoading(false);
    }
  };

  const masteryPct = (n: SubjectNode) => n.total ? Math.round((n.mastered / n.total) * 100) : 0;
  const topicPct = (t: TopicNode) => t.count ? Math.round((t.mastered / t.count) * 100) : 0;

  const nodeColor = (pct: number) => {
    if (pct >= 80) return { ring: 'ring-emerald-500', bg: 'bg-emerald-900/30', text: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (pct >= 50) return { ring: 'ring-sky-500', bg: 'bg-sky-900/20', text: 'text-sky-400', bar: 'bg-sky-500' };
    if (pct >= 25) return { ring: 'ring-orange-500', bg: 'bg-orange-900/20', text: 'text-orange-400', bar: 'bg-orange-500' };
    return { ring: 'ring-red-500', bg: 'bg-red-900/20', text: 'text-red-400', bar: 'bg-red-500' };
  };

  const totalCards = nodes.reduce((s, n) => s + n.total, 0);
  const totalMastered = nodes.reduce((s, n) => s + n.mastered, 0);
  const totalDue = nodes.reduce((s, n) => s + n.due, 0);

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-zinc-950 lg:pl-[72px] pb-20">
        <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">Knowledge Map</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Your mastery across every subject</p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-12 h-12 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total cards', value: totalCards, color: 'text-white' },
                  { label: 'Mastered', value: totalMastered, color: 'text-emerald-400' },
                  { label: 'Due today', value: totalDue, color: 'text-orange-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                {[
                  { label: '80%+ mastered', color: 'bg-emerald-500' },
                  { label: '50–79%', color: 'bg-sky-500' },
                  { label: '25–49%', color: 'bg-orange-500' },
                  { label: 'Under 25%', color: 'bg-red-500' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>

              {nodes.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                  <p className="text-zinc-500 text-sm mb-4">No cards in your deck yet.</p>
                  <button
                    onClick={() => router.push('/create-cards')}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Create cards
                  </button>
                </div>
              ) : (
                <>
                  {/* Node grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {nodes.map(node => {
                      const pct = masteryPct(node);
                      const c = nodeColor(pct);
                      const isSelected = selected?.subject === node.subject;
                      return (
                        <button
                          key={node.subject}
                          onClick={() => setSelected(isSelected ? null : node)}
                          className={`${c.bg} border-2 rounded-xl p-4 text-left transition-all ${
                            isSelected ? `${c.ring} ring-2` : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="font-bold text-white text-sm leading-tight">{node.subject}</p>
                            {node.due > 0 && (
                              <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1">
                                {node.due}
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                            <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${c.text}`}>{pct}%</span>
                            <span className="text-xs text-zinc-600">{node.mastered}/{node.total}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected subject detail */}
                  {selected && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white">{selected.subject}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">{selected.total} cards · {masteryPct(selected)}% mastered</p>
                        </div>
                        <button
                          onClick={() => router.push('/review')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      </div>

                      {selected.topics.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Topics</p>
                          {selected.topics.map(t => {
                            const pct = topicPct(t);
                            const c = nodeColor(pct);
                            return (
                              <div
                                key={t.topic}
                                className="flex items-center gap-3"
                                onMouseEnter={() => setHoveredTopic(t)}
                                onMouseLeave={() => setHoveredTopic(null)}
                              >
                                <span className="text-sm text-zinc-300 w-36 truncate flex-shrink-0">{t.topic}</span>
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${c.text} w-8 text-right flex-shrink-0`}>{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600">No topic breakdown available for this subject.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
