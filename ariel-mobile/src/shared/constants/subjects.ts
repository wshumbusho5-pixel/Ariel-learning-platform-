/**
 * Subjects constants for React Native — ported from ariel-web/lib/subjects.ts.
 * No HTML/DOM dependencies. Icon map uses Ionicons name strings.
 */

export const CANONICAL_SUBJECT_KEYS = [
  'mathematics', 'sciences', 'technology', 'history', 'literature',
  'economics', 'languages', 'health', 'psychology', 'geography',
  'gospel', 'business', 'law', 'arts', 'engineering', 'other',
] as const;

export type SubjectKey = typeof CANONICAL_SUBJECT_KEYS[number];

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
    .replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .trim();

  if (s in ALIAS_MAP) return ALIAS_MAP[s];

  const sorted = Object.keys(ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (s.includes(alias)) return ALIAS_MAP[alias];
  }

  return 'other';
}

export function getSubjectKey(card: { subject?: string | null; topic?: string | null }): SubjectKey {
  const fromSubject = normalizeSubjectKey(card.subject);
  return fromSubject !== 'other' ? fromSubject : normalizeSubjectKey(card.topic);
}

export interface SubjectMeta {
  label: string;
  short: string;
  color: string;   // Hex color for React Native (no Tailwind gradient)
  keywords: string[];
  icon: string;    // Ionicons name string
}

export const SUBJECT_META: Record<SubjectKey, SubjectMeta> = {
  gospel:      { label: 'Gospel & Faith',   short: 'Gospel',    color: '#fbbf24', keywords: ['bible','gospel','faith','theology','scripture','church','religion'],    icon: 'book' },
  business:    { label: 'Business',          short: 'Business',  color: '#38bdf8', keywords: ['business','marketing','finance','management','accounting','sales'],     icon: 'briefcase' },
  economics:   { label: 'Economics',         short: 'Economics', color: '#a78bfa', keywords: ['economics','gdp','inflation','trade','monetary','fiscal','economy'],    icon: 'trending-up' },
  technology:  { label: 'Technology',        short: 'Tech',      color: '#a1a1aa', keywords: ['programming','software','coding','javascript','python','ai','data'],    icon: 'code-slash' },
  health:      { label: 'Health & Medicine', short: 'Health',    color: '#f87171', keywords: ['health','medicine','anatomy','nutrition','fitness','psychology'],       icon: 'fitness' },
  mathematics: { label: 'Mathematics',       short: 'Maths',     color: '#818cf8', keywords: ['mathematics','calculus','algebra','geometry','statistics','math'],      icon: 'calculator' },
  sciences:    { label: 'Sciences',          short: 'Sciences',  color: '#34d399', keywords: ['biology','chemistry','physics','science','lab'],                        icon: 'flask' },
  history:     { label: 'History',           short: 'History',   color: '#fbbf24', keywords: ['history','historical','civilization','war','ancient'],                  icon: 'time' },
  literature:  { label: 'Literature',        short: 'Lit',       color: '#fb923c', keywords: ['literature','english','writing','poetry','novel'],                      icon: 'document-text' },
  languages:   { label: 'Languages',         short: 'Languages', color: '#2dd4bf', keywords: ['language','french','spanish','swahili','grammar','vocabulary'],         icon: 'language' },
  law:         { label: 'Law',               short: 'Law',       color: '#94a3b8', keywords: ['law','legal','constitution','rights','court'],                          icon: 'shield-checkmark' },
  arts:        { label: 'Arts & Music',      short: 'Arts',      color: '#e879f9', keywords: ['art','music','design','creative','paint'],                              icon: 'color-palette' },
  psychology:  { label: 'Psychology',        short: 'Psych',     color: '#22d3ee', keywords: ['psychology','mental','behavior','cognitive','therapy'],                 icon: 'bulb' },
  engineering: { label: 'Engineering',       short: 'Eng.',      color: '#facc15', keywords: ['engineering','mechanical','electrical','civil','structure'],             icon: 'construct' },
  geography:   { label: 'Geography',         short: 'Geography', color: '#a3e635', keywords: ['geography','map','climate','continent','country'],                      icon: 'globe' },
  other:       { label: 'General',           short: 'General',   color: '#71717a', keywords: [],                                                                       icon: 'library' },
};

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
  const s = TOPICS_BY_SUBJECT[key] ?? TOPICS_BY_SUBJECT.other;
  return (level != null && s[level]) ? s[level] : (s['default'] ?? []);
}
