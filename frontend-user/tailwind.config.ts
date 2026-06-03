import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          primary: 'var(--ps-hunter-green)',
          secondary: 'var(--ps-forest-green)',
          accent: 'var(--ps-gold-accent)',
        },
        neutral: {
          ivory: 'var(--ps-ivory)',
          raised: 'var(--ps-warm-white)',
          border: 'var(--ps-soft-taupe)',
          borderDark: 'var(--ps-taupe-dark)',
          textPrimary: 'var(--ps-text-primary)',
          textSecondary: 'var(--ps-text-secondary)',
          textMuted: 'var(--ps-text-muted)',
        },
        status: {
          sage: {
            bg: 'var(--ps-sage-bg)',
            dot: 'var(--ps-sage-dot)',
            text: 'var(--ps-sage-text)',
          },
          amber: {
            bg: 'var(--ps-amber-bg)',
            dot: 'var(--ps-amber-dot)',
            text: 'var(--ps-amber-text)',
          },
          slate: {
            bg: 'var(--ps-slate-bg)',
            dot: 'var(--ps-slate-dot)',
            text: 'var(--ps-slate-text)',
          },
        },
        ps: {
          // Sidebar
          dark:    '#1B2E22',
          darker:  '#132018',
          // Content background
          cream:   '#F7F4EF',
          'cream-2': '#EDEAE3',
          // Cards
          card:    '#FFFFFF',
          // Brand greens
          green:   '#2D6A4F',
          'green-mid': '#52B788',
          'green-pale': '#D8F3DC',
          // Gold accent
          gold:    '#E9A83A',
          'gold-pale': '#FEF3C7',
          // Text
          'text-dark': '#1a1a1a',
          'text-mid':  '#5C6672',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        custom: "var(--radius-custom)",
      },
      boxShadow: {
        'hairline-sm': 'var(--shadow-sm)',
        'hairline-md': 'var(--shadow-md)',
        'hairline-lg': 'var(--shadow-lg)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config