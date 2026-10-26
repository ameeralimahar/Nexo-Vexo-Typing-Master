'use client';

import * as React from 'react';
import Link from 'next/link';
import type { ExamProfile } from '@nexovexo/typing-engine';
import { pickPassage, type Passage } from '@/lib/passages';
import { TestRunner } from '@/components/typing/test-runner';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@nexovexo/ui';

export function SimulationClient({ profile }: { profile: ExamProfile }) {
  const [started, setStarted] = React.useState(false);
  const [passage, setPassage] = React.useState<Passage | null>(null);

  const begin = () => {
    setPassage(
      pickPassage({ language: profile.language, category: 'government' }),
    );
    setStarted(true);
  };

  return (
    <main className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Wordmark withTagline={false} className="h-6 w-auto" />
        <div className="text-sm font-medium text-muted-foreground">
          {profile.service} · Exam Simulation
        </div>
        <Link href="/simulation">
          <Button variant="ghost" size="sm">
            Exit
          </Button>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        {!started ? (
          <div className="max-w-xl text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {profile.name}
            </h1>
            {profile.approximate && (
              <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning">
                This profile is an approximation. Always verify the exact rules
                with the official exam notice.
              </p>
            )}
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-muted-foreground">
              <Li>Duration: {Math.round(profile.durationSec / 60)} minutes</Li>
              <Li>Pass: {profile.pass.minWpm} WPM at {Math.round(profile.pass.minAccuracy * 100)}% accuracy</Li>
              <Li>Backspace: {profile.allowBackspace ? 'allowed' : 'blocked'}</Li>
              <Li>
                Paste, copy and right-click are{' '}
                {profile.block.paste ? 'blocked' : 'allowed'} during the test.
              </Li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              A hardware keyboard is strongly recommended.
            </p>
            <Button size="lg" className="mt-6" onClick={begin}>
              Start simulation
            </Button>
          </div>
        ) : (
          passage && (
            <TestRunner
              passage={passage}
              profile={profile}
              mode="simulation"
              durationSec={profile.durationSec}
            />
          )
        )}
      </div>
    </main>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-accent">•</span>
      <span>{children}</span>
    </li>
  );
}
