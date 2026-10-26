# @nexovexo/typing-engine

Framework-agnostic typing engine for NEXO VEXO Typing Master. No UI or framework
dependencies — pure TypeScript, independently testable in Node.

## What it does

- **Metrics:** gross/net WPM, accuracy, error count, keystrokes, backspaces,
  corrected vs. uncorrected errors, consistency (WPM stddev), per-second WPM series.
- **Word models:** `char5` (5 chars = 1 word, standard) and `exact` (word-by-word).
- **Exam Profiles:** zod-validated rules (duration, scoring formula, penalties, case
  sensitivity, punctuation strictness, backspace rules, paste/copy/right-click blocking,
  pass thresholds).
- **Deterministic replay:** every keystroke is recorded with a timestamp; replaying the
  event log reproduces identical state and metrics.
- **Basic anti-cheat:** flags inhuman bursts, implausible WPM, and paste-like inserts.
- **Presets:** PPSC, FPSC, NTS (all `approximate: true` — verify with official notices).

## Usage

```ts
import {
  TypingEngine,
  computeMetrics,
  scoreSession,
  getPresetById,
} from '@nexovexo/typing-engine';

const profile = getPresetById('ppsc-en-clerk-v1')!;
const engine = new TypingEngine({
  target: 'the quick brown fox',
  wordModel: profile.wordModel,
  profile,
  language: 'en',
  allowBackspace: profile.allowBackspace,
});

// Feed events (from the DOM adapter or tests):
engine.apply({ t: 0, kind: 'char', value: 't' });
// ...

const metrics = computeMetrics({
  target: engine.config.target,
  events: engine.getEvents(),
  wordModel: profile.wordModel,
  caseSensitive: profile.caseSensitive,
});
const result = scoreSession({ profile, metrics, events: engine.getEvents() });
```

### Browser input

```ts
import { createDomSource } from '@nexovexo/typing-engine/dom';

const detach = createDomSource(hiddenInputEl, (ev) => engine.apply(ev), {
  startTime: performance.now(),
  blockPaste: profile.block.paste,
  blockCopy: profile.block.copy,
  blockRightClick: profile.block.rightClick,
});
// call detach() on unmount
```

## Scripts

- `npm run build` — compile to `dist/`
- `npm run test` — run Vitest suite
- `npm run typecheck` — type-check without emit

## Language support

English only for now. The engine is language-agnostic by design; Urdu (RTL, IME
composition) will plug in via the `composition` event kind without core changes.
