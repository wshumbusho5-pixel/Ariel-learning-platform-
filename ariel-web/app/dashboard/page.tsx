'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { progressAPI, gamificationAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';
import ArielAssistant from '@/components/ArielAssistant';
import ArielSpotlight from '@/components/ArielSpotlight';
import AIProviderSettings from '@/components/AIProviderSettings';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedCards, setFeedCards] = useState<
    { id: number; title: string; blurb: string; subject: string; fire: number; star: number; brain: number }[]
  >([]);
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [showSecondaryStats, setShowSecondaryStats] = useState(false);
  const [isFirstSession, setIsFirstSession] = useState(true);
  const [showFullDashboard, setShowFullDashboard] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      if (user && !user.onboarding_completed) {
        setShowOnboarding(true);
      }

      // Check if first session
      const hasSeenDashboard = localStorage.getItem('ariel_seen_dashboard');
      if (hasSeenDashboard) {
        setIsFirstSession(false);
        setShowFullDashboard(true);
      }

      const timeoutId = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeoutId);
    } else if (!isLoading) {
      // Not authenticated; stop the local spinner so redirect can occur
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    // Mock feed items (replace with API later)
    setFeedCards([
      { id: 1, title: 'StudyBuddy#1', blurb: 'Photosynthesis recap: chlorophyll captures light to power glucose creation...', subject: 'Biology', fire: 14, star: 8, brain: 3 },
      { id: 2, title: 'StudyBuddy#2', blurb: 'Trig identities made simple: SOH-CAH-TOA and friends.', subject: 'Math', fire: 9, star: 5, brain: 4 },
      { id: 3, title: 'StudyBuddy#3', blurb: 'History flash: Causes of the Industrial Revolution in 3 bullets.', subject: 'History', fire: 11, star: 6, brain: 2 },
    ]);
  }, []);

  const loadData = async () => {
    try {
      const [progressStats, gamificationStats] = await Promise.all([
        progressAPI.getStats().catch(() => null),
        gamificationAPI.getStats().catch(() => null),
      ]);
      setStats(progressStats || {});
      setGamification(gamificationStats || {});
    } catch {
      setStats({});
      setGamification({});
    } finally {
      setLoading(false);
    }
  };

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          await checkAuth();
          router.push('/explore');
        }}
      />
    );
  }

  if (!isAuthenticated && !isLoading && !loading) {
    // Fallback guard: user not authed, show a gentle prompt instead of spinning forever
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Sign in to view your dashboard</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0F4C75] animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-white/70">Loading your world...</p>
        </div>
      </div>
    );
  }

  // Stats and data
  const streakDays = stats?.current_streak || 0;
  const level = gamification?.level_info?.current_level || 1;
  const accuracy = stats?.retention_rate || 0;
  const mastered = stats?.cards_mastered || 0;
  const cardsDue = stats?.cards_due_today || 0;

  // Handlers
  const handleReact = (id: number, type: 'fire' | 'star' | 'brain') => {
    setFeedCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, [type]: card[type] + 1 }
          : card
      )
    );
  };

  const unlockFullDashboard = () => {
    localStorage.setItem('ariel_seen_dashboard', 'true');
    setShowFullDashboard(true);
    setIsFirstSession(false);
  };

  const handleStartLearning = () => {
    unlockFullDashboard();
    router.push('/reels');
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        backgroundColor: '#0F1419',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(10,77,104,0.12), transparent 35%), radial-gradient(circle at 80% 0%, rgba(44,95,45,0.10), transparent 28%), radial-gradient(circle at 50% 80%, rgba(15,76,117,0.10), transparent 30%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0.02)_60%,rgba(255,255,255,0)_90%)]" />
      <div className="relative z-10">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#0A4D68] via-[#0F4C75] to-[#2C5F2D] flex items-center justify-center text-white font-bold">A</div>
            <div>
              <p className="text-xs text-white/50">Generation Saver</p>
              <h1 className="text-lg font-bold text-white">Ariel Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
              Streak: {streakDays}d
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
              Level {level}
            </div>
          </div>
        </div>
      </div>

      {/* Hero strip - calm control center */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#0A4D68]/90 via-[#0F4C75]/85 to-[#2C5F2D]/80 text-white shadow-2xl backdrop-blur">
          <div className="grid lg:grid-cols-2 gap-6 p-6 lg:p-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-semibold">
                Calm control center • Ariel built-in AI by default
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Turn scrolling into learning — without extra setup.
              </h2>
              <p className="text-sm lg:text-base text-white/85 max-w-xl">
                Open the feed, review a deck, or let Ariel guide you. No keys required. Power users can still customize in settings.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartLearning}
                  className={`px-6 py-3 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:-translate-y-0.5 transition ${isFirstSession && !showFullDashboard ? 'scale-110 ring-4 ring-white/30' : ''}`}
                >
                  {isFirstSession && !showFullDashboard ? '▶ Start your first session' : 'Start learning'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/review')}
                  className="px-4 py-2 rounded-xl bg-white/15 border border-white/25 text-white font-semibold hover:bg-white/20 transition"
                >
                  Review cards
                </button>
                <a
                  href="#advanced-ai"
                  className="text-xs font-semibold text-white/80 underline underline-offset-4"
                >
                  Advanced AI (optional)
                </a>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-2 rounded-xl bg-white/15 border border-white/20">
                  {cardsDue > 0 ? `Cards due: ${cardsDue}` : 'You’re clear. Add cards or explore decks.'}
                </span>
                <span className="px-3 py-2 rounded-xl bg-white/15 border border-white/20">
                  {mastered > 0 ? `Mastered: ${mastered}` : 'Master one card to unlock sharing.'}
                </span>
                <span className="px-3 py-2 rounded-xl bg-white/15 border border-white/20">
                  {accuracy > 0 ? `Retention: ${accuracy}%` : 'Starts tracking after your first review.'}
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Smart Feed preview</p>
                  <p className="text-xs text-white/70">Tap into the 20s explainers any time.</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-300/20 text-emerald-50 text-[11px] border border-emerald-200/30">
                  Live
                </span>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-sm text-white/80 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  🧠 Why chlorophyll matters
                </div>
                <div className="rounded-lg bg-black/40 p-3 border border-white/10">
                  <p className="text-xs text-white/60">Swipe to reveal</p>
                  <p className="mt-1 font-semibold">What does chlorophyll do?</p>
                  <p className="mt-2 text-xs text-emerald-100">It captures light to power photosynthesis.</p>
                </div>
                <p className="text-[11px] text-white/60">“Feels like scrolling, but you remember more.”</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick stats - hidden for first-time users */}
        {(showFullDashboard || !isFirstSession) && (
          <>
            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-white/60">Cards due</p>
                <p className="text-3xl font-bold">{cardsDue > 0 ? cardsDue : '—'}</p>
                <p className="text-xs text-white/50 mt-1">
                  {cardsDue > 0 ? 'Clear your queue to keep streaks alive.' : "You're clear. Add cards or explore new decks."}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-white/60">Streak</p>
                <p className="text-3xl font-bold">{streakDays > 0 ? `${streakDays} days` : '—'}</p>
                <p className="text-xs text-white/50 mt-1">
                  {streakDays > 0 ? 'Stay hot. Parents love this number.' : 'Grace days apply - life happens.'}
                </p>
              </div>
              {showSecondaryStats && (
                <>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/60">Retention</p>
                    <p className="text-3xl font-bold">{accuracy > 0 ? `${accuracy}%` : '—'}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {accuracy > 0 ? 'Higher = safer brain.' : 'Starts tracking after your first review.'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/60">Mastered</p>
                    <p className="text-3xl font-bold">{mastered > 0 ? mastered : '—'}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {mastered > 0 ? 'Flex these in your feed.' : 'Master one card to unlock sharing.'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSecondaryStats((v) => !v)}
              className="text-xs text-white/60 hover:text-white font-semibold px-3 py-2 rounded-full bg-white/5"
            >
              {showSecondaryStats ? 'Hide secondary stats' : 'Show secondary stats'}
            </button>
          </>
        )}

        {/* Spotlight & Feed - hidden for first-time users */}
        {(showFullDashboard || !isFirstSession) && (
          <div className="grid lg:grid-cols-3 gap-4 animate-fadeIn">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/[0.04] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Smart Feed</p>
                  <p className="text-xs text-white/60">Study-first, distraction-free • why this? → relevance</p>
                </div>
                <Link href="/feed" className="text-sm text-[#65B741] font-semibold">Open Feed →</Link>
              </div>
              <div className="space-y-2 divide-y divide-white/5">
                {feedCards.map((card) => (
                  <div key={card.id} className="pt-2 first:pt-0 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F4C75] to-[#2C5F2D] text-white flex items-center justify-center font-bold shadow-md">
                        {card.title.at(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{card.title}</p>
                        <p className="text-xs text-white/60">Shared 5 cards • 2h ago</p>
                      </div>
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">{card.subject}</span>
                    </div>
                    <p className="text-sm text-white/80 mt-2 leading-relaxed">“{card.blurb}”</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                      <button
                        onClick={() => handleReact(card.id, 'fire')}
                        className="flex items-center gap-1 hover:text-orange-300 transition-colors"
                        aria-label="Mark as mastered"
                        type="button"
                      >
                        <span>🔥</span>
                        <span>{card.fire}</span>
                      </button>
                      <button
                        onClick={() => handleReact(card.id, 'star')}
                        className="flex items-center gap-1 hover:text-yellow-200 transition-colors"
                        aria-label="Favorite card"
                        type="button"
                      >
                        <span>⭐</span>
                        <span>{card.star}</span>
                      </button>
                      <button
                        onClick={() => handleReact(card.id, 'brain')}
                        className="flex items-center gap-1 hover:text-emerald-200 transition-colors"
                        aria-label="Mark as tricky"
                        type="button"
                      >
                        <span>🧠</span>
                        <span>{card.brain}</span>
                      </button>
                      <button
                        onClick={() => router.push('/review')}
                        className="ml-auto px-2 py-1 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition"
                        type="button"
                      >
                        Study
                      </button>
                      <button
                        onClick={() => router.push('/profile')}
                        className="px-2 py-1 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition"
                        type="button"
                      >
                        Profile
                      </button>
                    </div>
                    <p className="text-[11px] text-white/50 mt-2">Because you’ve been studying {card.subject} lately.</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Recent Activity</p>
                  <p className="text-xs text-white/60">Stay on top of your learning</p>
                </div>
                <Link href="/notifications" className="text-sm text-[#65B741] font-semibold">All activity →</Link>
              </div>
              <div className="space-y-3">
                {[1,2,3].map((idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">✅</div>
                    <div>
                      <p className="text-sm font-semibold text-white">Reviewed cards</p>
                      <p className="text-xs text-white/60">10 cards mastered • 1h ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <ArielSpotlight />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-semibold text-white">Upcoming</p>
              <p className="text-xs text-white/60 mb-2">Your next steps</p>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Finish Biology deck (12 cards)</li>
                <li>• Share your mastered Math deck</li>
                <li>• Join the study room at 6pm</li>
              </ul>
            </div>
          </div>
          </div>
        )}

        {/* First-time user CTA */}
        {isFirstSession && !showFullDashboard && (
          <div className="max-w-2xl mx-auto text-center py-12 space-y-4 animate-fadeIn">
            <p className="text-white/70 text-sm">
              Ready to experience a feed built for your brain?
            </p>
            <button
              onClick={() => setShowFullDashboard(true)}
              className="text-sm text-[#65B741] font-semibold hover:underline"
            >
              Or explore the full dashboard →
            </button>
          </div>
        )}
      </div>

      {/* Advanced AI - tucked away for power users */}
      {(showFullDashboard || !isFirstSession) && (
        <div id="advanced-ai" className="max-w-6xl mx-auto px-4 pb-10 animate-fadeIn">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Advanced AI options (optional)</p>
              <p className="text-xs text-white/60">Ariel works out of the box. Plug in your own OpenAI or Claude key only if you want extra control.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedAI((v) => !v)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white hover:bg-white/15 transition"
            >
              {showAdvancedAI ? 'Hide settings' : 'Show settings'}
            </button>
          </div>
          {showAdvancedAI && (
            <div className="bg-black/30 rounded-xl border border-white/10 p-3">
              <AIProviderSettings />
            </div>
          )}
        </div>
        </div>
      )}

      <BottomNav />
      <ArielAssistant />
      </div>
    </div>
  );
}
