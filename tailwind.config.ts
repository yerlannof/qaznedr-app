import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A84FF',
        secondary: '#6B7280',
        background: '#FFFFFF',
        foreground: '#111827',
        muted: '#F3F4F6',
        'muted-foreground': '#6B7280',
        border: '#E5E7EB',
        card: '#FFFFFF',
        'card-foreground': '#111827',
      },
    },
  },
  plugins: [],
};

export default config;
