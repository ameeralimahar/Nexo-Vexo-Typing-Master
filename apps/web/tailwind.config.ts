import type { Config } from 'tailwindcss';
import { nexovexoPreset } from '@nexovexo/ui/tailwind-preset';

const config: Config = {
  presets: [nexovexoPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
