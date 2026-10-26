/**
 * Basic anti-cheat heuristics. Operates on recorded events + metrics.
 * These are intentionally conservative signals; the admin review queue
 * (later phase) makes the final call.
 */
import type { AntiCheatResult, KeyEvent, Metrics } from './types.js';

export interface AntiCheatConfig {
  /** Minimum plausible ms between consecutive human keystrokes. */
  minIntervalMs: number;
  /** How many sub-threshold intervals before flagging. */
  burstTolerance: number;
  /** WPM above this is treated as implausible. */
  wpmCeiling: number;
  /** Whether paste was blocked for this test (multi-char inserts => flag). */
  pasteBlocked: boolean;
}

export const DEFAULT_ANTI_CHEAT: AntiCheatConfig = {
  minIntervalMs: 25,
  burstTolerance: 5,
  wpmCeiling: 220,
  pasteBlocked: true,
};

export function runAntiCheat(
  events: readonly KeyEvent[],
  metrics: Metrics,
  config: AntiCheatConfig = DEFAULT_ANTI_CHEAT,
): AntiCheatResult {
  const reasons: string[] = [];

  // 1. Implausible sustained speed.
  if (metrics.grossWpm > config.wpmCeiling) {
    reasons.push(
      `gross WPM ${metrics.grossWpm} exceeds plausibility ceiling ${config.wpmCeiling}`,
    );
  }

  // 2. Too many inhuman-fast intervals between text keystrokes.
  const textEvents = events.filter((e) => e.kind === 'char' || e.kind === 'composition');
  let fastIntervals = 0;
  for (let i = 1; i < textEvents.length; i++) {
    const dt = textEvents[i]!.t - textEvents[i - 1]!.t;
    if (dt >= 0 && dt < config.minIntervalMs) fastIntervals += 1;
  }
  if (fastIntervals > config.burstTolerance) {
    reasons.push(
      `${fastIntervals} keystroke intervals below ${config.minIntervalMs}ms (burst)`,
    );
  }

  // 3. Paste-like multi-character inserts when paste is blocked.
  if (config.pasteBlocked) {
    const pasteLike = events.some(
      (e) => e.kind === 'char' && (e.value?.length ?? 0) > 1,
    );
    if (pasteLike) reasons.push('multi-character insert while paste was blocked');
  }

  return { flagged: reasons.length > 0, reasons };
}
