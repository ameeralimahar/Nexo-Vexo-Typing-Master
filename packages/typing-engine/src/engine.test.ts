import { describe, it, expect } from 'vitest';
import { TypingEngine, replay, type EngineConfig } from './engine.js';
import type { KeyEvent } from './types.js';
import { PRESET_PROFILES } from './presets.js';

const profile = PRESET_PROFILES[0]!; // PPSC, backspace allowed, case-insensitive

function cfg(target: string, overrides: Partial<EngineConfig> = {}): EngineConfig {
  return {
    target,
    wordModel: 'char5',
    profile,
    language: 'en',
    allowBackspace: true,
    ...overrides,
  };
}

/** Helper to type a string as sequential char events, 100ms apart. */
function typeEvents(text: string, startT = 0, step = 100): KeyEvent[] {
  return Array.from(text).map((ch, i) => ({
    t: startT + i * step,
    kind: 'char' as const,
    value: ch,
  }));
}

describe('TypingEngine', () => {
  it('marks correct characters and advances the cursor', () => {
    const engine = new TypingEngine(cfg('hello'));
    let snap = engine.snapshot();
    for (const e of typeEvents('hello')) snap = engine.apply(e);
    expect(snap.cursor).toBe(5);
    expect(snap.typed).toBe('hello');
    expect(snap.perCharStatus).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(snap.finished).toBe(true);
  });

  it('marks incorrect characters', () => {
    const engine = new TypingEngine(cfg('hello'));
    let snap = engine.snapshot();
    for (const e of typeEvents('hzllo')) snap = engine.apply(e);
    expect(snap.perCharStatus[1]).toBe('incorrect');
  });

  it('treats case-insensitively when the profile says so', () => {
    const engine = new TypingEngine(cfg('Hello'));
    let snap = engine.snapshot();
    for (const e of typeEvents('hello')) snap = engine.apply(e);
    expect(snap.perCharStatus.every((s) => s === 'correct')).toBe(true);
  });

  it('respects case sensitivity when enabled', () => {
    const strict = { ...profile, caseSensitive: true };
    const engine = new TypingEngine(cfg('Hello', { profile: strict }));
    let snap = engine.snapshot();
    for (const e of typeEvents('hello')) snap = engine.apply(e);
    expect(snap.perCharStatus[0]).toBe('incorrect');
  });

  it('ignores overflow past the end of the passage', () => {
    const engine = new TypingEngine(cfg('hi'));
    let snap = engine.snapshot();
    for (const e of typeEvents('hiextra')) snap = engine.apply(e);
    expect(snap.cursor).toBe(2);
    expect(snap.typed).toBe('hi');
  });

  describe('backspace rules', () => {
    it('allows backspace when permitted and marks retype as corrected', () => {
      const engine = new TypingEngine(cfg('cat'));
      engine.apply({ t: 0, kind: 'char', value: 'c' });
      engine.apply({ t: 100, kind: 'char', value: 'x' }); // wrong 'a'
      engine.apply({ t: 200, kind: 'backspace' });
      const snap = engine.apply({ t: 300, kind: 'char', value: 'a' });
      expect(snap.perCharStatus[1]).toBe('corrected');
    });

    it('blocks backspace when the profile forbids it', () => {
      const noBs = { ...profile, allowBackspace: false };
      const engine = new TypingEngine(cfg('cat', { profile: noBs, allowBackspace: false }));
      engine.apply({ t: 0, kind: 'char', value: 'c' });
      engine.apply({ t: 100, kind: 'char', value: 'x' });
      const snap = engine.apply({ t: 200, kind: 'backspace' });
      expect(snap.cursor).toBe(2); // unchanged
      expect(snap.perCharStatus[1]).toBe('incorrect');
    });
  });

  describe('deterministic replay', () => {
    it('reproduces identical snapshot from recorded events', () => {
      const engine = new TypingEngine(cfg('replay test'));
      const events: KeyEvent[] = [
        ...typeEvents('replay test'),
      ];
      for (const e of events) engine.apply(e);
      const original = engine.snapshot();

      const replayed = replay(cfg('replay test'), engine.getEvents());
      expect(replayed.snapshot()).toEqual(original);
    });
  });
});
