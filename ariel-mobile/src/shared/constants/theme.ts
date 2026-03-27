/**
 * Design tokens matching the Ariel web app.
 * Use these in StyleSheet.create() or as values in NativeWind className props.
 */

export const COLORS = {
  // Base backgrounds — pure black like Twitter/X dark mode
  background: '#000000',
  surface: '#16181c',
  surface2: '#1d1f23',

  // Borders — Twitter separator weight
  border: '#2f3336',
  borderSubtle: '#2f3336',

  // Text — Twitter/X palette
  textPrimary: '#e7e9ea',
  textSecondary: '#71767b',
  textMuted: '#536471',

  // Violet accent (primary brand color)
  violet: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Subject colors
  subject: {
    mathematics: '#818cf8',
    sciences:    '#34d399',
    technology:  '#a1a1aa',
    history:     '#fbbf24',
    literature:  '#fb923c',
    economics:   '#a78bfa',
    languages:   '#2dd4bf',
    health:      '#f87171',
    psychology:  '#22d3ee',
    geography:   '#a3e635',
    gospel:      '#fcd34d',
    business:    '#38bdf8',
    law:         '#94a3b8',
    arts:        '#e879f9',
    engineering: '#facc15',
    other:       '#71717a',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const TYPOGRAPHY = {
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    extrabold:'800',
  },
  lineHeight: {
    tight:   1.25,
    normal:  1.5,
    relaxed: 1.75,
  },
} as const;

export const BORDER_RADIUS = {
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
