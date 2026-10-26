'use client';

import * as React from 'react';
import Link from 'next/link';
import { getPresetById, type KeyEvent, type ScoredResult } from '@nexovexo/typing-engine';
import { useTypingSession } from '@/components/typing/use-typing-session';
import { TypingArea } from '@/components/typing/typing-area';
import { TestTimer } from '@/components/typing/test-timer';
import { ResultCard } from '@/components/results/result-card';
import { Button } from '@/components/ui/button';

const TRY_TEXT =
  'Great typists are made, not born. A few focused minutes each day builds the speed and accuracy that clerical and data entry exams demand.';

/** A 30-second, no-signup taster embedded on the landing page. */
export function TryWidget() {
  const profile = React.useMemo(() => {
    const base = getPresetById('ppsc-en-clerk-v1')!;
    return {
      ...base,
      id: 'landing-try',
      name: '30-second taster',
      durationSec: 30,
      approximate: false,
      block: { paste: true, copy: false, rightClick: false },
      pass: { minWpm: 0, minAccuracy: 0 },
    };
  }, []);

  const [result, setResult] = React.useState<ScoredResult | null>(null);
  const [runKey, setRunKey] = React.useState(0);

  const onComplete = React.useCallback(
    (r: ScoredResult, _events: readonly KeyEvent[]) => {
      setResult(r);
    },
    [],
  );

  const session = useTypingSession({
    target: TRY_TEXT,
    profile,
    durationSec: 30,
    onComplete,
  });

  const restart = () => {
    setResult(null);
    session.reset();
    setRunKey((k) => k + 1);
  };

  if (result) {
    return (
      <div>
        <ResultCard metrics={result.metrics} seed="landing-try" />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={restart} variant="outline">
            Try again
          </Button>
          <Link href="/simulation">
            <Button>Run a full exam simulation</Button>
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No signup needed. Create an account later to save your history.
        </p>
      </div>
    );
  }

  return (
    <div key={runKey}>
      <div className="mb-4 flex justify-center">
        <TestTimer session={session} />
      </div>
      <TypingArea session={session} target={TRY_TEXT} block={{ paste: true }} />
    </div>
  );
}
