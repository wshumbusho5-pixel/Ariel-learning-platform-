import React from 'react';

// ─── Canonical subject → icon + accent color ──────────────────────────────────
// Each subject maps to a monoline SVG path and an accent color.
// Used everywhere subjects appear: pills, card headers, deck filters, feed tags.

export type SubjectKey =
  | 'mathematics' | 'math'
  | 'biology' | 'bio'
  | 'chemistry' | 'chem'
  | 'physics'
  | 'history'
  | 'literature' | 'english'
  | 'economics' | 'econ'
  | 'computer science' | 'cs' | 'coding' | 'programming'
  | 'psychology' | 'psych'
  | 'geography' | 'geo'
  | 'spanish' | 'french' | 'languages' | 'language'
  | 'gospel' | 'bible' | 'theology' | 'religion'
  | 'business' | 'finance' | 'accounting'
  | 'art' | 'music' | 'arts'
  | 'science' | 'sciences'
  | string;

interface SubjectConfig {
  color: string;       // tailwind text color class
  bgColor: string;     // tailwind bg color class (subtle)
  borderColor: string; // tailwind border color class
  hex: string;         // for inline styles
  icon: React.ReactNode;
}

function makeIcon(path: string | string[], filled = false) {
  const paths = Array.isArray(path) ? path : [path];
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const SUBJECT_MAP: Record<string, SubjectConfig> = {
  // Mathematics
  math: {
    color: 'text-sky-400', bgColor: 'bg-sky-400/10', borderColor: 'border-sky-400/30', hex: '#38bdf8',
    icon: makeIcon('M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.255 3A23.933 23.933 0 0121 12c0 3.183-.62 6.22-1.745 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09'),
  },
  // Biology
  bio: {
    color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', borderColor: 'border-emerald-400/30', hex: '#34d399',
    icon: makeIcon(['M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42']),
  },
  // Chemistry
  chem: {
    color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30', hex: '#c084fc',
    icon: makeIcon('M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5'),
  },
  // Physics
  physics: {
    color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/30', hex: '#60a5fa',
    icon: makeIcon('M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'),
  },
  // History
  history: {
    color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30', hex: '#fbbf24',
    icon: makeIcon('M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'),
  },
  // Literature / English
  literature: {
    color: 'text-rose-400', bgColor: 'bg-rose-400/10', borderColor: 'border-rose-400/30', hex: '#fb7185',
    icon: makeIcon('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'),
  },
  // Economics / Business / Finance
  economics: {
    color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30', hex: '#4ade80',
    icon: makeIcon('M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941'),
  },
  // Computer Science
  cs: {
    color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/30', hex: '#22d3ee',
    icon: makeIcon(['M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z']),
  },
  // Psychology
  psychology: {
    color: 'text-pink-400', bgColor: 'bg-pink-400/10', borderColor: 'border-pink-400/30', hex: '#f472b6',
    icon: makeIcon('M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'),
  },
  // Languages / Spanish / French
  language: {
    color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/30', hex: '#fb923c',
    icon: makeIcon(['M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802']),
  },
  // Gospel / Bible / Theology
  gospel: {
    color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', borderColor: 'border-indigo-400/30', hex: '#818cf8',
    icon: makeIcon(['M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', 'M12 9.75v.008v-.008zm0 3.75v.008v-.008z']),
  },
  // Geography
  geography: {
    color: 'text-teal-400', bgColor: 'bg-teal-400/10', borderColor: 'border-teal-400/30', hex: '#2dd4bf',
    icon: makeIcon('M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'),
  },
  // Art / Music
  art: {
    color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-400/10', borderColor: 'border-fuchsia-400/30', hex: '#e879f9',
    icon: makeIcon('M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42'),
  },
};

// Normalize subject string to a known key
function normalizeSubject(subject: string): string {
  const s = subject.toLowerCase().trim()
    // strip leading emojis
    .replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .trim();

  if (s.includes('math')) return 'math';
  if (s.includes('bio') || s === 'life science') return 'bio';
  if (s.includes('chem')) return 'chem';
  if (s.includes('physics') || s.includes('phys')) return 'physics';
  if (s.includes('hist')) return 'history';
  if (s.includes('lit') || s.includes('english') || s.includes('lang arts')) return 'literature';
  if (s.includes('econ') || s.includes('finance') || s.includes('account') || s.includes('business') || s.includes('commerce')) return 'economics';
  if (s.includes('computer') || s.includes(' cs') || s === 'cs' || s.includes('program') || s.includes('coding') || s.includes('software')) return 'cs';
  if (s.includes('psych')) return 'psychology';
  if (s.includes('geo')) return 'geography';
  if (s.includes('spanish') || s.includes('french') || s.includes('language') || s.includes('german') || s.includes('italian') || s.includes('mandarin') || s.includes('japanese')) return 'language';
  if (s.includes('gospel') || s.includes('bible') || s.includes('theol') || s.includes('relig') || s.includes('faith') || s.includes('church')) return 'gospel';
  if (s.includes('art') || s.includes('music') || s.includes('design') || s.includes('visual')) return 'art';
  if (s.includes('science')) return 'bio'; // generic science → biology-ish
  if (s.includes('tech') || s === 'it') return 'cs';
  if (s.includes('health') || s.includes('medic') || s.includes('nurs')) return 'bio';
  if (s.includes('law') || s.includes('legal')) return 'literature';
  if (s.includes('engineer')) return 'physics';
  return '';
}

export function getSubjectConfig(subject: string): SubjectConfig {
  const key = normalizeSubject(subject);
  return SUBJECT_MAP[key] || {
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    borderColor: 'border-violet-400/30',
    hex: '#a78bfa',
    icon: makeIcon('M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5'),
  };
}

interface SubjectIconProps {
  subject: string;
  size?: number; // px, default 14
  className?: string;
}

export default function SubjectIcon({ subject, size = 14, className = '' }: SubjectIconProps) {
  const config = getSubjectConfig(subject);
  return (
    <span
      className={`inline-flex flex-shrink-0 ${config.color} ${className}`}
      style={{ width: size, height: size }}
    >
      {config.icon}
    </span>
  );
}

// SubjectPill: icon + label in a styled pill
interface SubjectPillProps {
  subject: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm';
  className?: string;
}

export function SubjectPill({ subject, selected, onClick, size = 'xs', className = '' }: SubjectPillProps) {
  const config = getSubjectConfig(subject);
  const padding = size === 'sm' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const fontSize = size === 'sm' ? 'text-xs' : 'text-[11px]';
  const iconSize = size === 'sm' ? 13 : 11;

  if (selected) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 ${padding} ${fontSize} font-semibold rounded-full border transition-all ${config.bgColor} ${config.borderColor} ${config.color} ${className}`}
      >
        <SubjectIcon subject={subject} size={iconSize} />
        {subject}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${padding} ${fontSize} font-semibold rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-zinc-200 transition-all ${className}`}
    >
      <SubjectIcon subject={subject} size={iconSize} />
      {subject}
    </button>
  );
}
