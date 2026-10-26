'use client';

import * as React from 'react';
import type { Metrics } from '@nexovexo/typing-engine';
import { useCountUp } from './use-count-up';
import { pickQuote } from '@/lib/quotes';

export interface ResultCardProps {
  metrics: Metrics;
  /** Only meaningful for exam simulations. */
  passed?: boolean;
  showPassFail?: boolean;
  profileName?: string;
  verificationId?: string;
  /** Stable seed so the quote doesn't change on re-render. */
  seed?: string;
}

/**
 * Animated, celebratory result card. Numbers count up on mount, an accuracy
 * ring draws itself, and a performance-matched motivational quote appears.
 * Pure CSS/rAF animation (no extra deps); respects reduced-motion.
 */
export function ResultCard({
  metrics,
  passed,
  showPassFail,
  profileName,
  verificationId,
  seed,
}: ResultCardProps) {
  const wpm = useCountUp(Math.round(metrics.netWpm));
  const accPct = useCountUp(Math.round(metrics.accuracy * 100));
  const quote = React.useMemo(
    () => pickQuote(metrics.netWpm, metrics.accuracy, seed ?? verificationId ?? 'seed'),
    [metrics.netWpm, metrics.accuracy, seed, verificationId],
  );

  const accuracy = Math.round(metrics.accuracy * 100);
  const high = metrics.accuracy >= 0.95 && metrics.netWpm >= 35;

  return (
    <div className="animate-pop-in mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* Accent header band */}
      <div className="relative bg-accent/10 px-8 py-6 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(120px 60px at 50% 0%, hsl(var(--accent)/0.5), transparent)',
          }}
          aria-hidden
        />
        {showPassFail ? (
          <span
            className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-bold tracking-wide ${
              passed ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
            }`}
          >
            {passed ? '✓ PASSED' : 'KEEP PRACTISING'}
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-accent/20 px-4 py-1 text-sm font-semibold text-accent">
            Test complete
          </span>
        )}
        {profileName && (
          <p className="mt-2 text-xs text-muted-foreground">{profileName}</p>
        )}
      </div>

      {/* Big metrics */}
      <div className="flex items-center justify-center gap-10 px-8 py-8">
        <div className="text-center">
          <div className="font-display text-6xl font-extrabold tabular-nums text-accent">
            {Math.round(wpm)}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Net WPM
          </div>
        </div>

        <AccuracyRing value={Math.round(accPct)} target={accuracy} high={high} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-px bg-border text-center">
        <MiniStat label="Gross WPM" value={Math.round(metrics.grossWpm)} />
        <MiniStat label="Errors" value={metrics.errors} />
        <MiniStat label="Time" value={`${(metrics.durationMs / 1000).toFixed(0)}s`} />
      </div>

      {/* Motivational quote */}
      <div className="px-8 py-6 text-center">
        <p className="animate-fade-in-up text-balance text-lg font-medium leading-relaxed">
          “{quote.text}”
        </p>
        {quote.author && (
          <p className="mt-1 text-sm text-muted-foreground">— {quote.author}</p>
        )}
      </div>

      {verificationId && (
        <p className="border-t border-border px-8 py-3 text-center text-[11px] text-muted-foreground">
          Verification ID {verificationId}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card px-4 py-4">
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/** Circular accuracy gauge that draws itself on mount. */
function AccuracyRing({
  value,
  target,
  high,
}: {
  value: number;
  target: number;
  high: boolean;
}) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (target / 100) * circ;

  return (
    <div className={`relative ${high ? 'animate-float' : ''}`}>
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold tabular-nums">{value}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Accuracy
        </span>
      </div>
    </div>
  );
}
