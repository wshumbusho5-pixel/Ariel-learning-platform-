/**
 * Single source of truth for subject data on the frontend.
 *
 * The canonical keys here mirror the backend CANONICAL_SUBJECTS list
 * (lowercase, matching how they are stored via normalize_subject()).
 *
 * Exports:
 *   normalizeSubjectKey   — maps any string to a canonical key
 *   getSubjectKey         — maps a card { subject, topic } to a key
 *   SUBJECT_META          — full metadata for dashboard pills, gradients, etc.
 *   TOPICS_BY_SUBJECT     — default topic lists by subject + education level
 */

// ─── Canonical keys ───────────────────────────────────────────────────────────

export const CANONICAL_SUBJECT_KEYS = [
  'mathematics', 'sciences', 'technology', 'history', 'literature',
  'economics', 'languages', 'health', 'psychology', 'geography',
  'gospel', 'business', 'law', 'arts', 'engineering', 'other',
] as const;

export type SubjectKey = typeof CANONICAL_SUBJECT_KEYS[number];

// ─── Alias map ────────────────────────────────────────────────────────────────

const ALIAS_MAP: Record<string, SubjectKey> = {
  // Mathematics
  math: 'mathematics', maths: 'mathematics', mathematics: 'mathematics',
  calculus: 'mathematics', algebra: 'mathematics', geometry: 'mathematics',
  statistics: 'mathematics', trigonometry: 'mathematics',
  'discrete math': 'mathematics', 'linear algebra': 'mathematics',
  // Sciences
  sciences: 'sciences', science: 'sciences',
  biology: 'sciences', bio: 'sciences',
  chemistry: 'sciences', chem: 'sciences',
  physics: 'sciences', phys: 'sciences',
  lab: 'sciences', ecology: 'sciences', genetics: 'sciences',
  biochemistry: 'sciences', 'organic chemistry': 'sciences',
  'life science': 'sciences',
  // Technology
  technology: 'technology', tech: 'technology',
  'computer science': 'technology', cs: 'technology',
  coding: 'technology', programming: 'technology', software: 'technology',
  it: 'technology', 'data science': 'technology',
  'machine learning': 'technology', ai: 'technology',
  cybersecurity: 'technology', 'web development': 'technology',
  javascript: 'technology', python: 'technology',
  // History
  history: 'history', historical: 'history',
  'world war': 'history', 'ancient history': 'history',
  civilization: 'history', medieval: 'history',
  // Literature
  literature: 'literature', english: 'literature', writing: 'literature',
  poetry: 'literature', grammar: 'literature', 'essay writing': 'literature',
  reading: 'literature', 'lang arts': 'literature',
  'language arts': 'literature', shakespeare: 'literature',
  // Economics
  economics: 'economics', economy: 'economics',
  macroeconomics: 'economics', microeconomics: 'economics',
  gdp: 'economics', trade: 'economics',
  'monetary policy': 'economics', 'fiscal policy': 'economics',
  'stock market': 'economics',
  // Languages
  languages: 'languages', language: 'languages',
  french: 'languages', spanish: 'languages', swahili: 'languages',
  kinyarwanda: 'languages', mandarin: 'languages', german: 'languages',
  italian: 'languages', japanese: 'languages', arabic: 'languages',
  'foreign language': 'languages',
  // Health
  health: 'health', medicine: 'health', medical: 'health',
  anatomy: 'health', nutrition: 'health', fitness: 'health',
  pharmacology: 'health', nursing: 'health', physiology: 'health',
  'mental health': 'health', 'health & medicine': 'health',
  'health and medicine': 'health',
  // Psychology
  psychology: 'psychology', psych: 'psychology',
  'cognitive psychology': 'psychology', 'behavioral psychology': 'psychology',
  therapy: 'psychology', neuroscience: 'psychology',
  // Geography
  geography: 'geography', geo: 'geography',
  climate: 'geography', geopolitics: 'geography',
  'physical geography': 'geography', 'human geography': 'geography',
  // Gospel
  gospel: 'gospel', bible: 'gospel', theology: 'gospel',
  faith: 'gospel', religion: 'gospel', church: 'gospel',
  scripture: 'gospel', christianity: 'gospel', 'gospel & faith': 'gospel',
  // Business
  business: 'business', marketing: 'business', finance: 'business',
  accounting: 'business', management: 'business',
  entrepreneurship: 'business', strategy: 'business', sales: 'business',
  'corporate finance': 'business',
  // Law
  law: 'law', legal: 'law', 'constitutional law': 'law',
  'criminal law': 'law', 'contract law': 'law',
  'human rights': 'law', 'international law': 'law',
  // Arts
  arts: 'arts', art: 'arts', music: 'arts', design: 'arts',
  'visual arts': 'arts', photography: 'arts', film: 'arts',
  creative: 'arts', 'arts & music': 'arts',
  'music theory': 'arts', 'art history': 'arts',
  // Engineering
  engineering: 'engineering', 'mechanical engineering': 'engineering',
  'electrical engineering': 'engineering', 'civil engineering': 'engineering',
  thermodynamics: 'engineering', 'circuit analysis': 'engineering',
  'structural engineering': 'engineering',
  // General / other
  general: 'other', 'general knowledge': 'other', other: 'other', misc: 'other',
};

export function normalizeSubjectKey(subject?: string | null): SubjectKey {
  if (!subject) return 'other';
  const s = subject
    .trim()
    .toLowerCase()
    // strip leading emoji chars
    .replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .trim();

  // 1. Exact hit
  if (s in ALIAS_MAP) return ALIAS_MAP[s];

  // 2. Partial match — longer aliases first to avoid false positives
  const sorted = Object.keys(ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (s.includes(alias)) return ALIAS_MAP[alias];
  }

  return 'other';
}

/** Map a card's { subject, topic } fields to a canonical subject key. */
export function getSubjectKey(card: { subject?: string | null; topic?: string | null }): string {
  const fromSubject = normalizeSubjectKey(card.subject);
  return fromSubject !== 'other' ? fromSubject : normalizeSubjectKey(card.topic);
}

// ─── Subject metadata (used by dashboard, deck page, explore, etc.) ───────────

export interface SubjectMeta {
  label: string;
  short: string;
  gradient: string;  // Tailwind gradient class (from-X to-transparent)
  ring: string;      // Tailwind ring color class
  keywords: string[];
}

export const SUBJECT_META: Record<string, SubjectMeta> = {
  gospel:      { label: 'Gospel & Faith',   short: 'Gospel',    gradient: 'from-amber-400 to-transparent',   ring: 'ring-amber-500',   keywords: ['bible','gospel','faith','theology','scripture','church','religion'] },
  business:    { label: 'Business',          short: 'Business',  gradient: 'from-sky-400 to-transparent',     ring: 'ring-sky-500',     keywords: ['business','marketing','finance','management','accounting','sales'] },
  economics:   { label: 'Economics',         short: 'Economics', gradient: 'from-violet-400 to-transparent',  ring: 'ring-violet-300',  keywords: ['economics','gdp','inflation','trade','monetary','fiscal','economy'] },
  technology:  { label: 'Technology',        short: 'Tech',      gradient: 'from-zinc-500 to-transparent',    ring: 'ring-zinc-400',    keywords: ['programming','software','coding','javascript','python','ai','data'] },
  health:      { label: 'Health & Medicine', short: 'Health',    gradient: 'from-rose-400 to-transparent',    ring: 'ring-rose-500',    keywords: ['health','medicine','anatomy','nutrition','fitness','psychology'] },
  mathematics: { label: 'Mathematics',       short: 'Maths',     gradient: 'from-indigo-400 to-transparent',  ring: 'ring-indigo-500',  keywords: ['mathematics','calculus','algebra','geometry','statistics','math'] },
  sciences:    { label: 'Sciences',          short: 'Sciences',  gradient: 'from-emerald-400 to-transparent', ring: 'ring-emerald-500', keywords: ['biology','chemistry','physics','science','lab'] },
  history:     { label: 'History',           short: 'History',   gradient: 'from-amber-400 to-transparent',   ring: 'ring-stone-400',   keywords: ['history','historical','civilization','war','ancient'] },
  literature:  { label: 'Literature',        short: 'Lit',       gradient: 'from-orange-400 to-transparent',  ring: 'ring-orange-500',  keywords: ['literature','english','writing','poetry','novel'] },
  languages:   { label: 'Languages',         short: 'Languages', gradient: 'from-teal-400 to-transparent',    ring: 'ring-teal-500',    keywords: ['language','french','spanish','swahili','grammar','vocabulary'] },
  law:         { label: 'Law',               short: 'Law',       gradient: 'from-slate-400 to-transparent',   ring: 'ring-gray-400',    keywords: ['law','legal','constitution','rights','court'] },
  arts:        { label: 'Arts & Music',      short: 'Arts',      gradient: 'from-fuchsia-400 to-transparent', ring: 'ring-fuchsia-500', keywords: ['art','music','design','creative','paint'] },
  psychology:  { label: 'Psychology',        short: 'Psych',     gradient: 'from-cyan-400 to-transparent',    ring: 'ring-cyan-500',    keywords: ['psychology','mental','behavior','cognitive','therapy'] },
  engineering: { label: 'Engineering',       short: 'Eng.',      gradient: 'from-yellow-400 to-transparent',  ring: 'ring-yellow-500',  keywords: ['engineering','mechanical','electrical','civil','structure'] },
  geography:   { label: 'Geography',         short: 'Geography', gradient: 'from-lime-400 to-transparent',    ring: 'ring-lime-500',    keywords: ['geography','map','climate','continent','country'] },
  other:       { label: 'General',           short: 'General',   gradient: 'from-zinc-500 to-transparent',    ring: 'ring-zinc-600',    keywords: [] },
};

// ─── Topics by subject + education level ─────────────────────────────────────

export const TOPICS_BY_SUBJECT: Record<string, Record<string, string[]>> = {
  gospel:      { default: ['Bible Stories','New Testament','Psalms & Proverbs','Theology Basics','Church History','The Life of Jesus'] },
  business:    { 'high-school': ['Entrepreneurship','Personal Finance','Business Ethics','Marketing Basics'], university: ['Financial Accounting','Business Strategy','Marketing 101','Operations Management','Corporate Finance'], professional: ['Leadership','Strategic Management','Corporate Finance','Business Analytics'], default: ['Marketing 101','Financial Accounting','Entrepreneurship','Business Strategy'] },
  economics:   { 'high-school': ['Supply & Demand','GDP Basics','Personal Finance'], university: ['Macroeconomics','Microeconomics','Global Trade','Monetary Policy','Stock Market Basics'], professional: ['Monetary Policy','Fiscal Policy','Investment Theory'], default: ['Macroeconomics','Microeconomics','Global Trade','Monetary Policy'] },
  technology:  { 'high-school': ['Python Basics','Web Development','Digital Literacy'], university: ['Data Structures','Algorithms','Machine Learning','Web Development','Database Systems','Cybersecurity'], professional: ['System Design','Machine Learning','Cloud Computing','DevOps'], default: ['Python Basics','Data Structures','Web Development','Machine Learning'] },
  health:      { 'high-school': ['Human Anatomy','Nutrition Science','First Aid'], university: ['Human Anatomy','Pharmacology','Nutrition Science','Mental Health','Physiology'], professional: ['Pharmacology','Clinical Skills','Medical Ethics','Pathology'], default: ['Human Anatomy','Nutrition Science','Mental Health','Pharmacology'] },
  mathematics: { 'high-school': ['Algebra','Geometry','Trigonometry','Statistics'], university: ['Calculus','Linear Algebra','Statistics','Differential Equations','Discrete Math'], professional: ['Statistics','Linear Algebra','Optimization'], default: ['Calculus','Algebra','Statistics','Geometry'] },
  sciences:    { 'high-school': ['Biology Basics','Chemistry Basics','Physics Basics'], university: ['Biology','Chemistry','Physics','Genetics','Ecology','Organic Chemistry'], professional: ['Research Methods','Genetics','Biochemistry'], default: ['Biology','Chemistry','Physics','Ecology'] },
  history:     { default: ['World War II','Ancient Rome','African History','Cold War','Medieval Europe','The French Revolution'] },
  literature:  { default: ['Shakespeare','Poetry Analysis','African Literature','Essay Writing','Grammar Mastery','Literary Devices'] },
  languages:   { default: ['French Basics','Spanish A1','Swahili Vocab','Kinyarwanda','Mandarin Intro','English Grammar'] },
  law:         { 'high-school': ['Human Rights','Constitutional Law Basics'], university: ['Constitutional Law','Contract Law','Criminal Law','Human Rights','International Law'], professional: ['Corporate Law','Litigation','Constitutional Law'], default: ['Constitutional Law','Contract Law','Criminal Law','Human Rights'] },
  arts:        { default: ['Music Theory','Art History','Design Principles','Photography','Film Studies','Colour Theory'] },
  psychology:  { 'high-school': ['Intro to Psychology','Emotional Intelligence'], university: ['Cognitive Psychology','Developmental Psychology','Abnormal Psychology','Social Psychology'], professional: ['Organisational Psychology','Neuroscience','Therapy Models'], default: ['Cognitive Psychology','Developmental Psychology','Social Psychology','Neuroscience'] },
  engineering: { 'high-school': ['Engineering Basics','Simple Machines'], university: ['Mechanics','Thermodynamics','Circuit Analysis','Structural Engineering','Materials Science'], professional: ['Structural Engineering','Systems Design','Thermodynamics'], default: ['Mechanics','Thermodynamics','Circuit Analysis','Structural Engineering'] },
  geography:   { default: ['Physical Geography','Human Geography','Climate & Weather','Countries & Capitals','Geopolitics'] },
  other:       { default: ['General Knowledge','Critical Thinking','Study Skills'] },
};

export function getTopics(key: string, level?: string): string[] {
  const s = TOPICS_BY_SUBJECT[key] || TOPICS_BY_SUBJECT.other;
  return s[level ?? 'default'] ?? s.default ?? [];
}
