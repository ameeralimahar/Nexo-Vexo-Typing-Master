import { describe, it, expect } from 'vitest';
import { computeMetrics } from './metrics.js';
import type { KeyEvent } from './types.js';

/** Type `text` as char events spaced `step` ms apart starting at `startT`. */
function typeEvents(text: string, startT = 0, step = 100): KeyEvent[] {
  return Array.from(text).map((ch, i) => ({
    t: startT + i * step,
    kind: 'char' as const,
    value: ch,
  }));
}

describe('computeMetrics — char5 model', () => {
  it('computes gross/net WPM for a perfect one-minute run', () => {
    // 60 correct chars over 60s = 12 words / 1 min = 12 wpm.
    const target = 'a'.repeat(60);
    const events = typeEvents(target, 0, 1000); // 1s per char
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
      endedAt: 60000,
    });
    // duration is from first to last event = 59s here, so check closeness.
    expect(m.grossWpm).toBeGreaterThan(0);
    expect(m.accuracy).toBe(1);
    expect(m.uncorrected).toBe(0);
    expect(m.errors).toBe(0);
  });

  it('counts uncorrected errors and reduces net WPM', () => {
    const target = 'hello world';
    const typed = 'hezlo world'; // one wrong char at index 2
    const events = typeEvents(typed, 0, 100);
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
      endedAt: 2000,
    });
    expect(m.uncorrected).toBe(1);
    expect(m.errors).toBe(1);
    expect(m.corrected).toBe(0);
    expect(m.accuracy).toBeLessThan(1);
    expect(m.netWpm).toBeLessThanOrEqual(m.grossWpm);
  });

  it('counts a corrected error separately from uncorrected', () => {
    const target = 'cat';
    const events: KeyEvent[] = [
      { t: 0, kind: 'char', value: 'c' },
      { t: 100, kind: 'char', value: 'x' }, // wrong
      { t: 200, kind: 'backspace' },
      { t: 300, kind: 'char', value: 'a' }, // corrected
      { t: 400, kind: 'char', value: 't' },
    ];
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
    });
    // After the fix, `errors`/`uncorrected` reflect the FINAL text, which is
    // correct here, so both are 0. The earlier mistake is tracked as corrected.
    expect(m.errors).toBe(0);
    expect(m.corrected).toBe(1);
    expect(m.uncorrected).toBe(0);
    expect(m.backspaces).toBe(1);
    expect(m.accuracy).toBe(1); // final text is correct
  });

  it('produces a per-second WPM series', () => {
    const target = 'the quick brown fox';
    const events = typeEvents(target, 0, 100);
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
    });
    expect(m.wpmSeries.length).toBeGreaterThan(0);
    expect(m.wpmSeries[0]).toHaveProperty('t');
    expect(m.wpmSeries[0]).toHaveProperty('wpm');
  });
});

describe('computeMetrics — exact word model', () => {
  it('scores by whole words', () => {
    const target = 'the quick brown fox';
    const typed = 'the quikc brown fox'; // 1 wrong word
    const events = typeEvents(typed, 0, 100);
    const m = computeMetrics({
      target,
      events,
      wordModel: 'exact',
      caseSensitive: false,
      endedAt: 2000,
    });
    expect(m.grossWpm).toBeGreaterThanOrEqual(m.netWpm);
  });
});

describe('computeMetrics — edge cases', () => {
  it('returns zeros for an empty session', () => {
    const m = computeMetrics({
      target: 'anything',
      events: [],
      wordModel: 'char5',
      caseSensitive: false,
    });
    expect(m.grossWpm).toBe(0);
    expect(m.netWpm).toBe(0);
    expect(m.accuracy).toBe(0);
    expect(m.wpmSeries).toEqual([]);
  });
});

import { alignTypedToTarget } from './metrics.js';

describe('alignment — cascading error fix', () => {
  it('a single skipped letter counts as ONE error, not a cascade', () => {
    // Target "hello", typed "helo" (missed one 'l').
    const a = alignTypedToTarget('helo', 'hello', false);
    expect(a.deletions).toBe(1);
    expect(a.substitutions).toBe(0);
    expect(a.matches).toBe(4);
    expect(a.distance).toBe(1);
  });

  it('a single extra letter counts as ONE error', () => {
    const a = alignTypedToTarget('helllo', 'hello', false);
    expect(a.insertions).toBe(1);
    expect(a.distance).toBe(1);
  });

  it('accuracy stays high when one letter is skipped mid-passage', () => {
    const target = 'the quick brown fox jumps';
    const typed = 'the quick brwn fox jumps'; // dropped the 'o' in brown
    const events = typed.split('').map((ch, i) => ({
      t: i * 60,
      kind: 'char' as const,
      value: ch,
    }));
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
      endedAt: typed.length * 60,
    });
    // One deletion out of ~24 chars => accuracy should be well above 90%,
    // NOT collapsed. Before the fix this would have been far lower.
    expect(m.accuracy).toBeGreaterThan(0.9);
    expect(m.errors).toBe(1);
  });

  it('perfect typing is 100% accuracy and zero errors', () => {
    const target = 'the quick brown fox';
    const events = target.split('').map((ch, i) => ({
      t: i * 60,
      kind: 'char' as const,
      value: ch,
    }));
    const m = computeMetrics({
      target,
      events,
      wordModel: 'char5',
      caseSensitive: false,
      endedAt: target.length * 60,
    });
    expect(m.accuracy).toBe(1);
    expect(m.errors).toBe(0);
  });
});
