import { describe, it, expect } from 'vitest';
import { scoreSession } from './scoring.js';
import { computeMetrics } from './metrics.js';
import { runAntiCheat, DEFAULT_ANTI_CHEAT } from './anti-cheat.js';
import { PRESET_PROFILES, getPresetById } from './presets.js';
import { safeParseExamProfile } from './exam-profile.js';
import type { KeyEvent } from './types.js';

function typeEvents(text: string, startT = 0, step = 100): KeyEvent[] {
  return Array.from(text).map((ch, i) => ({
    t: startT + i * step,
    kind: 'char' as const,
    value: ch,
  }));
}

describe('preset profiles', () => {
  it('ship three validated presets (PPSC, FPSC, NTS), all approximate', () => {
    expect(PRESET_PROFILES).toHaveLength(3);
    const services = PRESET_PROFILES.map((p) => p.service).sort();
    expect(services).toEqual(['FPSC', 'NTS', 'PPSC']);
    expect(PRESET_PROFILES.every((p) => p.approximate)).toBe(true);
  });

  it('can be looked up by id', () => {
    expect(getPresetById('ppsc-en-clerk-v1')?.service).toBe('PPSC');
    expect(getPresetById('nope')).toBeUndefined();
  });
});

describe('exam profile validation', () => {
  it('rejects a profile where passage max < min', () => {
    const bad = {
      ...PRESET_PROFILES[0],
      passageLength: { min: 500, max: 100 },
    };
    expect(safeParseExamProfile(bad).success).toBe(false);
  });

  it('rejects accuracy outside 0..1', () => {
    const bad = { ...PRESET_PROFILES[0], pass: { minWpm: 30, minAccuracy: 1.5 } };
    expect(safeParseExamProfile(bad).success).toBe(false);
  });
});

describe('scoreSession', () => {
  it('passes when WPM and accuracy clear thresholds', () => {
    const profile = { ...getPresetById('ppsc-en-clerk-v1')!, pass: { minWpm: 1, minAccuracy: 0.5 } };
    const target = 'the quick brown fox jumps';
    const events = typeEvents(target, 0, 50);
    const metrics = computeMetrics({
      target,
      events,
      wordModel: profile.wordModel,
      caseSensitive: profile.caseSensitive,
    });
    const result = scoreSession({ profile, metrics, events });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('fails when below the minimum accuracy', () => {
    const profile = getPresetById('nts-en-deo-v1')!; // needs 0.95
    const target = 'hello world';
    const typed = 'xxxxx world';
    const events = typeEvents(typed, 0, 50);
    const metrics = computeMetrics({
      target,
      events,
      wordModel: profile.wordModel,
      caseSensitive: profile.caseSensitive,
    });
    const result = scoreSession({ profile, metrics, events });
    expect(result.passed).toBe(false);
  });

  it('applies words_minus_penalties scoring', () => {
    const base = getPresetById('ppsc-en-clerk-v1')!;
    const profile = {
      ...base,
      scoring: { type: 'words_minus_penalties' as const, penaltyPerError: 2 },
    };
    const target = 'alpha beta gamma delta';
    const typed = 'alpha beta gamma delta';
    const events = typeEvents(typed, 0, 100);
    const metrics = computeMetrics({
      target,
      events,
      wordModel: profile.wordModel,
      caseSensitive: profile.caseSensitive,
      endedAt: 3000,
    });
    const result = scoreSession({ profile, metrics, events });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe('anti-cheat', () => {
  it('flags inhuman burst typing', () => {
    // 20 chars 5ms apart = way below human floor.
    const events = typeEvents('abcdefghijklmnopqrst', 0, 5);
    const metrics = computeMetrics({
      target: 'abcdefghijklmnopqrst',
      events,
      wordModel: 'char5',
      caseSensitive: false,
    });
    const r = runAntiCheat(events, metrics, DEFAULT_ANTI_CHEAT);
    expect(r.flagged).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('flags a multi-character paste-like insert when paste is blocked', () => {
    const events: KeyEvent[] = [{ t: 0, kind: 'char', value: 'pasted text' }];
    const metrics = computeMetrics({
      target: 'pasted text',
      events,
      wordModel: 'char5',
      caseSensitive: false,
    });
    const r = runAntiCheat(events, metrics, { ...DEFAULT_ANTI_CHEAT, pasteBlocked: true });
    expect(r.flagged).toBe(true);
  });

  it('does not flag normal human typing', () => {
    const events = typeEvents('the quick brown fox', 0, 180);
    const metrics = computeMetrics({
      target: 'the quick brown fox',
      events,
      wordModel: 'char5',
      caseSensitive: false,
    });
    const r = runAntiCheat(events, metrics, DEFAULT_ANTI_CHEAT);
    expect(r.flagged).toBe(false);
  });
});
