import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        municipal: {
          ink: '#1F2A37',
          muted: '#5B6573',
          line: '#E3E7EC',
          paper: '#F6F7F9',
          brand: '#1E5AA8',
          'brand-dark': '#174784',
          soft: '#E8F0FB',
        },
      },
    },
  },
  plugins: [],
};

export default config;
