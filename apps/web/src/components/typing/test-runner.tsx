'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { ExamProfile, KeyEvent, ScoredResult } from '@nexovexo/typing-engine';
import { useTypingSession } from './use-typing-session';
import { TypingArea } from './typing-area';
import { TestTimer } from './test-timer';
import { Button } from '@/components/ui/button';
import { resultsRepo, newResultId, type StoredResult } from '@/lib/results-store';
import type { Passage } from '@/lib/passages';

export interface TestRunnerProps {
  passage: Passage;
  profile: ExamProfile;
  mode: 'practice' | 'simulation' | 'try';
  durationSec: number;
  /** If set, navigate here (with ?id=) on completion; else call onFinish. */
  resultHref?: string;
  onFinish?: (result: ScoredResult, events: readonly KeyEvent[]) => void;
}

export function TestRunner({
  passage,
  profile,
  mode,
  durationSec,
  resultHref = '/results',
  onFinish,
}: TestRunnerProps) {
  const router = useRouter();
  const savingRef = React.useRef(false);

  const handleComplete = React.useCallback(
    async (result: ScoredResult, events: readonly KeyEvent[]) => {
      if (onFinish) {
        onFinish(result, events);
        return;
      }
      if (savingRef.current) return;
      savingRef.current = true;

      const id = newResultId();
      const stored: StoredResult = {
        id,
        createdAt: Date.now(),
        mode,
        profileId: profile.id,
        profileName: profile.name,
        passageId: passage.id,
        passageText: passage.text,
        language: passage.language,
        metrics: result.metrics,
        score: result.score,
        passed: result.passed,
        antiCheat: result.antiCheat,
        events: [...events],
      };
      await resultsRepo.save(stored);
      router.push(`${resultHref}/${id}`);
    },
    [onFinish, mode, profile, passage, resultHref, router],
  );

  const session = useTypingSession({
    target: passage.text,
    profile,
    durationSec,
    onComplete: handleComplete,
  });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <TestTimer session={session} />
        <Button variant="ghost" size="sm" onClick={() => session.reset()}>
          Restart
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        <TypingArea
          session={session}
          target={passage.text}
          block={{
            paste: profile.block.paste,
            copy: profile.block.copy,
            rightClick: profile.block.rightClick,
          }}
        />
      </div>

      {!session.started && (
        <p className="text-sm text-muted-foreground">
          {durationSec > 0
            ? `${Math.round(durationSec / 60)} minute test · the timer starts on your first keystroke`
            : 'The timer starts on your first keystroke'}
        </p>
      )}
    </div>
  );
}
