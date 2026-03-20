/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './global.css',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark zinc base — matches web app
        background: '#09090b',
        surface: '#18181b',
        'surface-2': '#27272a',
        border: '#3f3f46',
        'border-subtle': '#27272a',

        // Text
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',

        // Violet accent — matches web app
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

        // Subject colors (NativeWind safe)
        subject: {
          mathematics: '#818cf8', // indigo-400
          sciences:    '#34d399', // emerald-400
          technology:  '#a1a1aa', // zinc-400
          history:     '#fbbf24', // amber-400
          literature:  '#fb923c', // orange-400
          economics:   '#a78bfa', // violet-400
          languages:   '#2dd4bf', // teal-400
          health:      '#f87171', // rose-400
          psychology:  '#22d3ee', // cyan-400
          geography:   '#a3e635', // lime-400
          gospel:      '#fcd34d', // amber-300
          business:    '#38bdf8', // sky-400
          law:         '#94a3b8', // slate-400
          arts:        '#e879f9', // fuchsia-400
          engineering: '#facc15', // yellow-400
          other:       '#71717a', // zinc-500
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
