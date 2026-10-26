import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { TryWidget } from '@/components/try-widget';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site';

const features = [
  {
    title: 'Exam-accurate simulation',
    body: 'Full-screen tests that follow each service’s duration, scoring and input rules — down to blocked paste and backspace limits.',
  },
  {
    title: 'Real diagnostics',
    body: 'See your WPM over time, accuracy, and exactly where every mistake happened in the passage.',
  },
  {
    title: 'Monkeytype-grade speed',
    body: 'A zero-lag typing engine that stays smooth even on low-end PCs. Your keystrokes never wait on the UI.',
  },
  {
    title: 'Built for Pakistan’s tests',
    body: 'Preset profiles for PPSC, FPSC and NTS, clearly marked as approximations to verify against the official notice.',
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid opacity-40" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:pt-24">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              PPSC · FPSC · NTS and more
            </div>
            <h1 className="mx-auto max-w-3xl text-balance font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Practice typing the way the{' '}
              <span className="text-accent">exam</span> actually tests you
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              {siteConfig.name} simulates real government typing tests, measures
              your speed and accuracy precisely, and shows you exactly what to fix.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/simulation">
                <Button size="lg">Start an exam simulation</Button>
              </Link>
              <Link href="/practice">
                <Button size="lg" variant="outline">
                  Free practice
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Live try widget */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-4 text-center">
            <h2 className="font-display text-2xl font-bold">
              Try a 30-second test now
            </h2>
            <p className="text-sm text-muted-foreground">
              No signup. Just click the box and start typing.
            </p>
          </div>
          <TryWidget />
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} {siteConfig.shortName}</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/practice" className="hover:text-foreground">
                Practice
              </Link>
              <Link href="/simulation" className="hover:text-foreground">
                Simulation
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
