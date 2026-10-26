import type { Metadata } from 'next';
import Link from 'next/link';
import { PRESET_PROFILES } from '@nexovexo/typing-engine';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Exam Simulation',
  description:
    'Simulate real typing tests for PPSC, FPSC and NTS. Full-screen, rule-accurate, with an official-style result sheet.',
};

export default function SimulationIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Exam Simulation
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose a testing service to run a full-screen, rule-accurate simulation.
          Each profile mirrors the duration, scoring and input rules of the exam.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_PROFILES.map((p) => (
            <Link key={p.id} href={`/simulation/${p.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-accent">
                <CardHeader>
                  <div className="mb-1 inline-flex w-fit rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                    {p.service}
                  </div>
                  <CardTitle>{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <Row label="Duration" value={`${Math.round(p.durationSec / 60)} min`} />
                  <Row label="Pass mark" value={`${p.pass.minWpm} WPM`} />
                  <Row
                    label="Min accuracy"
                    value={`${Math.round(p.pass.minAccuracy * 100)}%`}
                  />
                  <Row
                    label="Backspace"
                    value={p.allowBackspace ? 'Allowed' : 'Blocked'}
                  />
                  {p.approximate && (
                    <p className="pt-2 text-xs text-warning">
                      Approximation — verify with the official notice.
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
