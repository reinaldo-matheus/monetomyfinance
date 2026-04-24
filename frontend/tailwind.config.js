/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        hud: {
          bg: '#050505',
          surface: '#0C0C14',
          surfaceHover: '#161625',
          border: '#27273A',
          borderHi: '#00F0FF',
          text: '#F8F8FF',
          muted: '#A1A1AA',
          dim: '#52525B',
          cyan: '#00F0FF',
          purple: '#B026FF',
          pink: '#FF0055',
          green: '#39FF14',
          yellow: '#FFB800'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))'
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.45), inset 0 0 0 1px rgba(0,240,255,0.35)',
        'glow-pink': '0 0 20px rgba(255, 0, 85, 0.45), inset 0 0 0 1px rgba(255,0,85,0.35)',
        'glow-purple': '0 0 20px rgba(176, 38, 255, 0.45), inset 0 0 0 1px rgba(176,38,255,0.35)',
        'glow-green': '0 0 18px rgba(57, 255, 20, 0.45), inset 0 0 0 1px rgba(57,255,20,0.35)'
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        'flicker': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.85 } },
        'glitch-x': { '0%,100%': { transform: 'translateX(0)' }, '33%': { transform: 'translateX(-1px)' }, '66%': { transform: 'translateX(1px)' } }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 2.5s ease-in-out infinite',
        'glitch-x': 'glitch-x 0.25s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
