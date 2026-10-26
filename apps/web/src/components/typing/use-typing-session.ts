'use client';

import * as React from 'react';
import {
  TypingEngine,
  computeMetrics,
  scoreSession,
  type ExamProfile,
  type KeyEvent,
  type ScoredResult,
} from '@nexovexo/typing-engine';

export interface TypingSessionOptions {
  target: string;
  profile: ExamProfile;
  /** Hard time limit in seconds (0 = untimed, ends when passage complete). */
  durationSec: number;
  onComplete: (result: ScoredResult, events: readonly KeyEvent[]) => void;
}

export interface TypingSessionApi {
  engine: TypingEngine;
  started: boolean;
  finished: boolean;
  /** Seconds remaining (null when untimed). */
  remaining: number | null;
  /** Seconds elapsed since the session started (count-up). */
  elapsedSec: number;
  /** Feed a normalized event into the engine. */
  push: (event: KeyEvent) => void;
  start: () => void;
  /** End the session immediately (e.g. the Stop button). */
  stop: () => void;
  reset: () => void;
  /** performance.now() reference captured at the first keystroke. */
  getStartTime: () => number | null;
}

/**
 * Owns the engine instance and session timing. The engine is kept in a ref,
 * so feeding keystrokes does NOT trigger React re-renders — the TypingArea
 * reads snapshots via requestAnimationFrame instead.
 */
export function useTypingSession(options: TypingSessionOptions): TypingSessionApi {
  const { target, profile, durationSec, onComplete } = options;

  const engineRef = React.useRef<TypingEngine>(
    new TypingEngine({
      target,
      wordModel: profile.wordModel,
      profile,
      language: profile.language,
      allowBackspace: profile.allowBackspace,
    }),
  );

  const startTimeRef = React.useRef<number | null>(null);
  const [started, setStarted] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const [remaining, setRemaining] = React.useState<number | null>(
    durationSec > 0 ? durationSec : null,
  );
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = React.useRef(false);

  // Recreate the engine if the target/profile changes.
  React.useEffect(() => {
    engineRef.current = new TypingEngine({
      target,
      wordModel: profile.wordModel,
      profile,
      language: profile.language,
      allowBackspace: profile.allowBackspace,
    });
    startTimeRef.current = null;
    finishedRef.current = false;
    setStarted(false);
    setFinished(false);
    setElapsedSec(0);
    setRemaining(durationSec > 0 ? durationSec : null);
  }, [target, profile, durationSec]);

  const complete = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);

    const engine = engineRef.current;
    const now = performance.now();
    engine.finish(Math.round(now - (startTimeRef.current ?? now)));
    const events = engine.getEvents();
    const metrics = computeMetrics({
      target: engine.config.target,
      events,
      wordModel: profile.wordModel,
      caseSensitive: profile.caseSensitive,
    });
    const result = scoreSession({ profile, metrics, events });
    setFinished(true);
    onComplete(result, events);
  }, [profile, onComplete]);

  const start = React.useCallback(() => {
    if (started) return;
    setStarted(true);
    startTimeRef.current = performance.now();
    // Count-up elapsed timer (shown to the user regardless of mode).
    elapsedRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    if (durationSec > 0) {
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          const next = (r ?? 0) - 1;
          if (next <= 0) {
            complete();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
  }, [started, durationSec, complete]);

  const push = React.useCallback(
    (event: KeyEvent) => {
      if (finishedRef.current) return;
      if (!started) start();
      const snap = engineRef.current.apply(event);
      if (snap.finished) complete();
    },
    [started, start, complete],
  );

  const reset = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    engineRef.current.reset();
    startTimeRef.current = null;
    finishedRef.current = false;
    setStarted(false);
    setFinished(false);
    setElapsedSec(0);
    setRemaining(durationSec > 0 ? durationSec : null);
  }, [durationSec]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  return {
    engine: engineRef.current,
    started,
    finished,
    remaining,
    elapsedSec,
    push,
    start,
    stop: complete,
    reset,
    getStartTime: () => startTimeRef.current,
  };
}
