import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Ambani Brand Teal (Primary) ─────────────────────────────
        primary: {
          DEFAULT: '#00685f',
          dark:    '#005049',
          light:   '#6bd8cb',
          container: '#008378',
          'on-container': '#f4fffc',
          fixed:   '#89f5e7',
        },
        // ── Sunset Orange (Secondary / progress) ────────────────────
        secondary: {
          DEFAULT: '#855300',
          light:   '#fea619',
          container: '#fea619',
          'on-container': '#684000',
          fixed:   '#ffddb8',
          dim:     '#ffb95f',
        },
        // ── Deep Forest (Tertiary) ───────────────────────────────────
        tertiary: {
          DEFAULT: '#286652',
          container: '#43806a',
          'on-container': '#f5fff8',
        },
        // ── Neutral Surfaces ────────────────────────────────────────
        surface: {
          DEFAULT:   '#f9f9ff',
          dim:       '#d3daea',
          bright:    '#f9f9ff',
          lowest:    '#ffffff',
          low:       '#f0f3ff',
          DEFAULT2:  '#e7eefe',
          high:      '#e2e8f8',
          highest:   '#dce2f3',
          tint:      '#006a61',
          variant:   '#dce2f3',
        },
        // ── Text ─────────────────────────────────────────────────────
        'on-surface': '#151c27',
        'on-surface-variant': '#3d4947',
        'inverse-surface': '#2a313d',
        'inverse-on-surface': '#ebf1ff',
        // ── Outlines ─────────────────────────────────────────────────
        outline: {
          DEFAULT: '#6d7a77',
          variant: '#bcc9c6',
        },
        // ── Error ─────────────────────────────────────────────────────
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        // ── Chat bubble tints ─────────────────────────────────────────
        'chat-user': '#ccf2f0',
        'chat-bot':  '#ffffff',
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Lexend', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-lg':     ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-lg-mob': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md':     ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg':         ['18px', { lineHeight: '28px' }],
        'body-md':         ['16px', { lineHeight: '24px' }],
        'label-md':        ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'chat-bubble':     ['15px', { lineHeight: '22px' }],
      },
      borderRadius: {
        sm:   '0.25rem',
        DEFAULT: '0.5rem',
        md:   '0.75rem',
        lg:   '1rem',
        xl:   '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0px 2px 4px rgba(0,0,0,0.04)',
        btn:  '0px 2px 6px rgba(0,104,95,0.25)',
      },
      animation: {
        'bounce-dot':      'bounceDot 1.4s infinite ease-in-out both',
        'slide-in-left':   'slideInLeft 0.3s ease-out',
        'slide-in-right':  'slideInRight 0.3s ease-out',
        'fade-in':         'fadeIn 0.2s ease-out',
      },
      keyframes: {
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':            { transform: 'scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
