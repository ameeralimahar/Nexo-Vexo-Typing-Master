/**
 * Shared Tailwind preset that maps NEXO VEXO design tokens to Tailwind's
 * theme. Apps extend this so colors/radii/fonts stay centralized.
 */
import type { Config } from 'tailwindcss';
import { radii, fonts } from './theme/tokens';

const hsl = (v: string) => `hsl(${v})`;
const hslVar = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export const nexovexoPreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: hslVar('background'),
        foreground: hslVar('foreground'),
        card: {
          DEFAULT: hslVar('card'),
          foreground: hslVar('card-foreground'),
        },
        muted: {
          DEFAULT: hslVar('muted'),
          foreground: hslVar('muted-foreground'),
        },
        accent: {
          DEFAULT: hslVar('accent'),
          foreground: hslVar('accent-foreground'),
        },
        border: hslVar('border'),
        input: hslVar('input'),
        ring: hslVar('ring'),
        type: {
          correct: hslVar('type-correct'),
          incorrect: hslVar('type-incorrect'),
          pending: hslVar('type-pending'),
          caret: hslVar('type-caret'),
        },
        success: hslVar('success'),
        warning: hslVar('warning'),
        danger: hslVar('danger'),
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
        '2xl': radii['2xl'],
      },
      fontFamily: {
        sans: [fonts.sans],
        mono: [fonts.mono],
        display: [fonts.display],
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(12px)' },
          '60%': { opacity: '1', transform: 'scale(1.02) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'ring-grow': {
          from: { strokeDashoffset: 'var(--dash, 360)' },
          to: { strokeDashoffset: 'var(--offset, 0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
};

export default nexovexoPreset;
// re-export so consumers can read raw values if needed
export { hsl };
