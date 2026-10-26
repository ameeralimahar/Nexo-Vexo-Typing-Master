import * as React from 'react';

export interface WordmarkProps extends React.SVGProps<SVGSVGElement> {
  /** Force a variant; defaults to currentColor so it adapts to theme. */
  variant?: 'auto' | 'light' | 'dark';
  /** Show the "Typing Master" secondary line. */
  withTagline?: boolean;
}

/**
 * NEXO VEXO wordmark. "NEXO VEXO" in bold geometric caps with the accent
 * color on "VEXO", and an optional lighter "Typing Master" secondary line.
 * Uses currentColor + the --accent CSS var so it works on light/dark.
 */
export function Wordmark({
  variant = 'auto',
  withTagline = true,
  ...props
}: WordmarkProps) {
  const primary =
    variant === 'light' ? '#ffffff' : variant === 'dark' ? '#0b1220' : 'currentColor';
  const accent = 'hsl(var(--accent))';

  return (
    <svg
      viewBox="0 0 280 64"
      role="img"
      aria-label="NEXO VEXO Typing Master"
      fill="none"
      {...props}
    >
      <text
        x="0"
        y="34"
        fontFamily="var(--font-display, system-ui), sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="1"
      >
        <tspan fill={primary}>NEXO </tspan>
        <tspan fill={accent}>VEXO</tspan>
      </text>
      {withTagline && (
        <text
          x="1"
          y="54"
          fontFamily="var(--font-sans, system-ui), sans-serif"
          fontSize="13"
          fontWeight="500"
          letterSpacing="4"
          fill={primary}
          opacity="0.7"
        >
          TYPING MASTER
        </text>
      )}
    </svg>
  );
}

/** Compact mark for favicons/small spaces: stylized "NV" in a rounded square. */
export function WordmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="NEXO VEXO" {...props}>
      <rect width="64" height="64" rx="14" fill="hsl(var(--accent))" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display, system-ui), sans-serif"
        fontSize="30"
        fontWeight="800"
        fill="hsl(var(--accent-foreground))"
      >
        NV
      </text>
    </svg>
  );
}
