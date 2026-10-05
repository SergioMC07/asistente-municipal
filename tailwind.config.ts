import type { Config } from 'tailwindcss';

// Los colores salen de variables CSS (globals.css) para que cada demo pueda
// cambiar el color de marca sin duplicar clases.
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
        // Borde marcado de botones y tarjetas, tintado con el color de la demo.
        'line-strong': 'color-mix(in oklch, var(--cobalt) 32%, var(--line))',
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
        // Botones: una base sutil que los despega del fondo.
        btn: '0 1px 0 oklch(0.24 0.035 258 / 0.08), 0 1px 3px oklch(0.24 0.035 258 / 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
