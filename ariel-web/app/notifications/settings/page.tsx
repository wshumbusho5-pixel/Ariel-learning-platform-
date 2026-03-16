'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';

interface NotifPrefs {
  streaks: boolean;
  achievements: boolean;
  messages: boolean;
  follows: boolean;
  likes: boolean;
  comments: boolean;
  live: boolean;
  weeklyReport: boolean;
  studyReminders: boolean;
  reminderTime: string;
}

const DEFAULTS: NotifPrefs = {
  streaks: true,
  achievements: true,
  messages: true,
  follows: true,
  likes: false,
  comments: true,
  live: true,
  weeklyReport: true,
  studyReminders: true,
  reminderTime: '20:00',
};

const STORAGE_KEY = 'ariel_notif_prefs';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-violet-400' : 'bg-zinc-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function Row({ label, sublabel, on, onChange }: { label: string; sublabel?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-zinc-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {sublabel && <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = (key: keyof NotifPrefs, value: boolean | string) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <SideNav />
      <div className="min-h-screen bg-[#09090b] lg:pl-[72px] pb-24">
        <header className="sticky top-0 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push('/notifications')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-white flex-1">Notification Settings</h1>
            {saved && <span className="text-xs text-violet-300 font-medium">Saved</span>}
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* Activity */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Activity</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4">
              <Row label="Streak reminders" sublabel="Get notified to keep your streak alive" on={prefs.streaks} onChange={v => update('streaks', v)} />
              <Row label="Achievements" sublabel="When you unlock a new achievement" on={prefs.achievements} onChange={v => update('achievements', v)} />
              <Row label="Weekly report" sublabel="Summary of your study progress" on={prefs.weeklyReport} onChange={v => update('weeklyReport', v)} />
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Social</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4">
              <Row label="Rooms" sublabel="When someone sends you a message" on={prefs.messages} onChange={v => update('messages', v)} />
              <Row label="New followers" sublabel="When someone follows you" on={prefs.follows} onChange={v => update('follows', v)} />
              <Row label="Likes" sublabel="When someone likes your content" on={prefs.likes} onChange={v => update('likes', v)} />
              <Row label="Comments" sublabel="When someone comments on your content" on={prefs.comments} onChange={v => update('comments', v)} />
            </div>
          </div>

          {/* Live */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Live</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4">
              <Row label="Live streams" sublabel="When someone you follow goes live" on={prefs.live} onChange={v => update('live', v)} />
            </div>
          </div>

          {/* Study reminders */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Study Reminders</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4">
              <Row label="Daily study reminder" sublabel="Remind me to review my cards" on={prefs.studyReminders} onChange={v => update('studyReminders', v)} />
              {prefs.studyReminders && (
                <div className="flex items-center justify-between py-4 border-t border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-white">Reminder time</p>
                    <p className="text-xs text-zinc-500 mt-0.5">What time to remind you each day</p>
                  </div>
                  <input
                    type="time"
                    value={prefs.reminderTime}
                    onChange={e => update('reminderTime', e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-300"
                  />
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-600 text-center">
            Preferences are saved on this device. Push notification support coming soon.
          </p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
