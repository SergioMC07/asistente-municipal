import type { Config } from 'tailwindcss';

// Los colores salen de variables CSS (globals.css) para que el modo oscuro
// cambie el tema entero sin duplicar clases.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        sunken: 'var(--sunken)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        cobalt: {
          DEFAULT: 'var(--cobalt)',
          strong: 'var(--cobalt-strong)',
          text: 'var(--cobalt-text)',
          soft: 'var(--cobalt-soft)',
          on: 'var(--on-cobalt)',
        },
        danger: 'var(--danger)',
        ok: 'var(--ok)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: 'var(--shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
