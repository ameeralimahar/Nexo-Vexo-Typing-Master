/**
 * NEXO VEXO design tokens — the single source of truth for colors, radii,
 * spacing and typography. Rebranding or re-theming happens here only.
 *
 * Colors are expressed as HSL channel triples (e.g. "222 47% 11%") so they
 * can be dropped into CSS variables and consumed by Tailwind as
 * `hsl(var(--token))`, which keeps opacity modifiers working.
 */

export type AccentName = 'violet' | 'cyan' | 'amber';

export interface AccentTokens {
  accent: string; // base accent
  accentForeground: string; // text on accent
}

/** Signature accent + two alternates. Violet is the default brand accent. */
export const accents: Record<AccentName, AccentTokens> = {
  violet: { accent: '262 83% 58%', accentForeground: '0 0% 100%' },
  cyan: { accent: '189 94% 43%', accentForeground: '222 47% 11%' },
  amber: { accent: '38 92% 50%', accentForeground: '222 47% 11%' },
};

export interface ThemePalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  /** Typing-specific semantic colors. */
  typeCorrect: string;
  typeIncorrect: string;
  typePending: string;
  typeCaret: string;
  success: string;
  warning: string;
  danger: string;
}

export const lightPalette: ThemePalette = {
  background: '0 0% 100%',
  foreground: '222 47% 11%',
  card: '0 0% 100%',
  cardForeground: '222 47% 11%',
  muted: '210 40% 96%',
  mutedForeground: '215 16% 47%',
  border: '214 32% 91%',
  input: '214 32% 91%',
  ring: '262 83% 58%',
  typeCorrect: '142 71% 35%',
  typeIncorrect: '0 72% 51%',
  typePending: '215 16% 60%',
  typeCaret: '262 83% 58%',
  success: '142 71% 35%',
  warning: '38 92% 45%',
  danger: '0 72% 51%',
};

export const darkPalette: ThemePalette = {
  background: '222 47% 7%',
  foreground: '210 40% 96%',
  card: '222 44% 10%',
  cardForeground: '210 40% 96%',
  muted: '217 33% 17%',
  mutedForeground: '215 20% 65%',
  border: '217 33% 20%',
  input: '217 33% 20%',
  ring: '262 83% 64%',
  typeCorrect: '142 69% 58%',
  typeIncorrect: '0 84% 65%',
  typePending: '215 20% 45%',
  typeCaret: '262 83% 70%',
  success: '142 69% 58%',
  warning: '38 92% 58%',
  danger: '0 84% 65%',
};

/** Border radii (rem). */
export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

/** Spacing scale (rem) — extends Tailwind's defaults with a few brand steps. */
export const spacing = {
  hero: '7.5rem',
  section: '5rem',
};

/** Typography. Mono family is used for the typing area for legibility. */
export const fonts = {
  sans: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
  mono: 'var(--font-mono), ui-monospace, "SF Mono", Menlo, monospace',
  display: 'var(--font-display), var(--font-sans), sans-serif',
};

export const brand = {
  name: 'NEXO VEXO Typing Master',
  shortName: 'NEXO VEXO',
  secondaryLine: 'Typing Master',
  defaultAccent: 'violet' as AccentName,
};

/** Serialize a palette to `--token: value;` CSS custom-property declarations. */
export function paletteToCssVars(p: ThemePalette): string {
  const map: Record<string, string> = {
    '--background': p.background,
    '--foreground': p.foreground,
    '--card': p.card,
    '--card-foreground': p.cardForeground,
    '--muted': p.muted,
    '--muted-foreground': p.mutedForeground,
    '--border': p.border,
    '--input': p.input,
    '--ring': p.ring,
    '--type-correct': p.typeCorrect,
    '--type-incorrect': p.typeIncorrect,
    '--type-pending': p.typePending,
    '--type-caret': p.typeCaret,
    '--success': p.success,
    '--warning': p.warning,
    '--danger': p.danger,
  };
  return Object.entries(map)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n');
}
