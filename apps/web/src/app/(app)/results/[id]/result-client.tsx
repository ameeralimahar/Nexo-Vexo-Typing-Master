'use client';

import * as React from 'react';
import Link from 'next/link';
import { resultsRepo, type StoredResult } from '@/lib/results-store';
import { WpmChart } from '@/components/results/wpm-chart';
import { HighlightedPassage } from '@/components/results/highlighted-passage';
import { ResultCard } from '@/components/results/result-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ResultClient({ id }: { id: string }) {
  const [result, setResult] = React.useState<StoredResult | null>(null);
  const [percentile, setPercentile] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const r = await resultsRepo.get(id);
      if (!active) return;
      setResult(r);
      if (r) {
        const p = await resultsRepo.percentile(r.profileId, r.score);
        if (active) setPercentile(p);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading result…</p>;
  }
  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Result not found</h1>
        <p className="text-muted-foreground">
          This result may have been recorded on a different device or cleared.
        </p>
        <Link href="/practice">
          <Button>Start a new test</Button>
        </Link>
      </div>
    );
  }

  const m = result.metrics;
  const passBadge =
    result.mode === 'simulation' ? (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
          result.passed
            ? 'bg-success/15 text-success'
            : 'bg-danger/15 text-danger'
        }`}
      >
        {result.passed ? 'PASSED' : 'NOT PASSED'}
      </span>
    ) : null;

  return (
    <div className="space-y-8">
      {/* Animated celebratory card with motivational quote. */}
      <ResultCard
        metrics={m}
        passed={result.passed}
        showPassFail={result.mode === 'simulation'}
        profileName={result.profileName}
        verificationId={result.id}
        seed={result.id}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Detailed breakdown
          </h2>
          <p className="text-sm text-muted-foreground">
            {result.profileName} · {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
        {passBadge}
      </div>

      {result.antiCheat.flagged && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          This test was flagged by anti-cheat checks and is excluded from
          leaderboards. Reasons: {result.antiCheat.reasons.join('; ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Net WPM" value={m.netWpm.toFixed(0)} big />
        <Metric label="Gross WPM" value={m.grossWpm.toFixed(0)} />
        <Metric label="Accuracy" value={`${(m.accuracy * 100).toFixed(1)}%`} />
        <Metric
          label="Consistency"
          value={m.consistency.toFixed(1)}
          hint="lower is steadier"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WPM over time</CardTitle>
        </CardHeader>
        <CardContent>
          <WpmChart data={m.wpmSeries} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Error breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total errors" value={m.errors} />
            <Row label="Uncorrected" value={m.uncorrected} />
            <Row label="Corrected" value={m.corrected} />
            <Row label="Backspaces" value={m.backspaces} />
            <Row label="Keystrokes" value={m.keystrokes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Standing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Score" value={result.score.toFixed(1)} />
            <Row
              label="Percentile (this device)"
              value={percentile != null ? `${percentile}%` : '—'}
            />
            <Row
              label="Duration"
              value={`${(m.durationMs / 1000).toFixed(1)}s`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where the mistakes were</CardTitle>
        </CardHeader>
        <CardContent>
          <HighlightedPassage result={result} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/practice">
          <Button>Practice again</Button>
        </Link>
        <Link href="/simulation">
          <Button variant="outline">Try a simulation</Button>
        </Link>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  big,
  hint,
}: {
  label: string;
  value: string;
  big?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={`font-display font-bold tabular-nums text-accent ${
          big ? 'text-4xl' : 'text-2xl'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
