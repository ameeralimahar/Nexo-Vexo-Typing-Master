'use client';

import * as React from 'react';
import type { TypingSessionApi } from './use-typing-session';
import { Button } from '@/components/ui/button';

export interface TestTimerProps {
  session: TypingSessionApi;
}

/**
 * Minimal in-test HUD: shows ONLY the time and a Stop button. No live WPM or
 * accuracy — those are revealed on the result card after the test, so the
 * user can type without the pressure of a jumping speed counter.
 */
export function TestTimer({ session }: TestTimerProps) {
  // Timed tests count down; untimed tests count up.
  const seconds = session.remaining != null ? session.remaining : session.elapsedSec;
  const low = session.remaining != null && session.remaining <= 10;

  return (
    <div className="flex items-center gap-5">
      <div
        className="flex items-center gap-2"
        role="timer"
        aria-live="off"
        aria-label={
          session.remaining != null ? 'Time remaining' : 'Time elapsed'
        }
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {session.remaining != null ? 'Time left' : 'Time'}
        </span>
        <span
          className={`font-display text-3xl font-bold tabular-nums ${
            low ? 'text-danger' : 'text-foreground'
          }`}
        >
          {formatTime(seconds)}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => session.stop()}
        disabled={!session.started || session.finished}
      >
        Stop &amp; see result
      </Button>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
