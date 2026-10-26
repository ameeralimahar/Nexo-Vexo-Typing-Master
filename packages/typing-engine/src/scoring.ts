/**
 * Apply an Exam Profile's scoring formula and pass thresholds to metrics,
 * and combine with anti-cheat into a final ScoredResult.
 */
import type { ExamProfile } from './exam-profile.js';
import { runAntiCheat, type AntiCheatConfig } from './anti-cheat.js';
import type { KeyEvent, Metrics, ScoredResult } from './types.js';

export interface ScoreInput {
  profile: ExamProfile;
  metrics: Metrics;
  events: readonly KeyEvent[];
  antiCheatConfig?: Partial<AntiCheatConfig>;
}

export function scoreSession(input: ScoreInput): ScoredResult {
  const { profile, metrics, events } = input;

  let score: number;
  if (profile.scoring.type === 'net_wpm') {
    score = metrics.netWpm;
  } else {
    // words_minus_penalties: words typed minus penalty per uncorrected error.
    const wordsTyped = metrics.grossWpm * (metrics.durationMs / 60000);
    score = Math.max(0, wordsTyped - profile.scoring.penaltyPerError * metrics.uncorrected);
    score = Math.round(score * 100) / 100;
  }

  const passed =
    metrics.netWpm >= profile.pass.minWpm && metrics.accuracy >= profile.pass.minAccuracy;

  const antiCheat = runAntiCheat(events, metrics, {
    minIntervalMs: 25,
    burstTolerance: 5,
    wpmCeiling: 220,
    pasteBlocked: profile.block.paste,
    ...input.antiCheatConfig,
  });

  return { metrics, score, passed, antiCheat };
}
