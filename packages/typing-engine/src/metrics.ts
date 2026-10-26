/**
 * Metrics computation. Pure functions over a target passage and the
 * recorded KeyEvent[]. Keeps scoring deterministic and testable.
 */
import type { KeyEvent, Metrics, WordModel } from './types.js';

const CHARS_PER_WORD = 5;

export interface MetricsInput {
  target: string;
  events: readonly KeyEvent[];
  wordModel: WordModel;
  caseSensitive: boolean;
  /** Optional explicit end time; defaults to last event time. */
  endedAt?: number | null;
}

interface Reconstruction {
  typed: string[];
  /** Count of insert operations (keystrokes that produced a char). */
  charKeystrokes: number;
  backspaces: number;
  startedAt: number | null;
  endedAt: number | null;
  /** everWrong[i] = target index i was wrong at some point. */
  everWrong: boolean[];
  /** final correctness per typed index vs target. */
  finalCorrect: boolean[];
  /** Cumulative correct-char count sampled per char-insert with timestamp. */
  progress: Array<{ t: number; correctChars: number }>;
}

/**
 * Re-run the event stream to reconstruct typed output and timing.
 * Mirrors TypingEngine semantics but is standalone for metrics use.
 */
function reconstruct(input: MetricsInput): Reconstruction {
  const target = Array.from(input.target);
  const typed: string[] = [];
  const everWrong: boolean[] = target.map(() => false);
  let cursor = 0;
  let charKeystrokes = 0;
  let backspaces = 0;
  let startedAt: number | null = null;
  let endedAt: number | null = null;
  const progress: Array<{ t: number; correctChars: number }> = [];

  const cmp = (a: string, b: string) =>
    input.caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();

  for (const e of input.events) {
    if (startedAt === null && (e.kind === 'char' || e.kind === 'composition')) {
      startedAt = e.t;
    }
    endedAt = e.t;

    if (e.kind === 'char' || e.kind === 'composition') {
      for (const ch of Array.from(e.value ?? '')) {
        if (cursor >= target.length) break;
        charKeystrokes += 1;
        const expected = target[cursor] ?? '';
        typed[cursor] = ch;
        if (!cmp(ch, expected)) everWrong[cursor] = true;
        cursor += 1;
        const correctSoFar = countCorrect(typed, target, cmp);
        progress.push({ t: e.t, correctChars: correctSoFar });
      }
    } else if (e.kind === 'backspace' || e.kind === 'delete') {
      backspaces += 1;
      if (cursor > 0) {
        cursor -= 1;
        typed[cursor] = '';
      }
    }
  }

  if (input.endedAt != null) endedAt = input.endedAt;

  const finalCorrect = target.map((t, i) => (typed[i] != null ? cmp(typed[i]!, t) : false));

  return {
    typed,
    charKeystrokes,
    backspaces,
    startedAt,
    endedAt,
    everWrong,
    finalCorrect,
    progress,
  };
}

function countCorrect(
  typed: string[],
  target: string[],
  cmp: (a: string, b: string) => boolean,
): number {
  let n = 0;
  for (let i = 0; i < typed.length; i++) {
    const tc = typed[i];
    if (tc != null && tc !== '' && cmp(tc, target[i] ?? '')) n += 1;
  }
  return n;
}

/** Compute full metrics for a session. */
export function computeMetrics(input: MetricsInput): Metrics {
  const r = reconstruct(input);
  const durationMs =
    r.startedAt != null && r.endedAt != null ? Math.max(0, r.endedAt - r.startedAt) : 0;
  const minutes = durationMs > 0 ? durationMs / 60000 : 0;

  const target = Array.from(input.target);
  const targetStr = input.target;

  // Build the final typed string (ignoring empty/erased slots).
  const typedStr = r.typed.map((c) => (c == null ? '' : c)).join('');
  const typedCharCount = Array.from(typedStr).length;

  // Alignment-based accounting: a skipped or extra character counts as ONE
  // error, not a cascade. This is the fix for accuracy collapsing after a
  // single missed letter in copy-typing.
  const align = alignTypedToTarget(typedStr, targetStr, input.caseSensitive);
  const correctChars = align.matches;
  // Uncorrected errors = what's wrong in the final text vs the target.
  const uncorrected = align.substitutions + align.deletions + align.insertions;
  // "corrected" = places that were wrong during typing but fixed by the end.
  const everWrongCount = r.everWrong.filter(Boolean).length;
  const corrected = Math.max(0, everWrongCount - r.finalCorrect.filter((c) => !c).length);
  const errors = uncorrected;

  let grossWpm = 0;
  let netWpm = 0;
  if (input.wordModel === 'char5') {
    grossWpm = minutes > 0 ? typedCharCount / CHARS_PER_WORD / minutes : 0;
    netWpm = minutes > 0 ? Math.max(0, (correctChars / CHARS_PER_WORD) / minutes) : 0;
  } else {
    const { typedWords, correctWords } = wordCounts(r.typed, target, input.caseSensitive);
    grossWpm = minutes > 0 ? typedWords / minutes : 0;
    netWpm = minutes > 0 ? Math.max(0, correctWords / minutes) : 0;
  }

  // Accuracy = correct matches / all attempted (matches + every edit).
  const attempted = correctChars + uncorrected;
  const accuracy = attempted > 0 ? correctChars / attempted : 0;

  const wpmSeries = buildWpmSeries(r.progress, r.startedAt);
  const consistency = stddev(wpmSeries.map((p) => p.wpm));

  return {
    grossWpm: round2(grossWpm),
    netWpm: round2(netWpm),
    accuracy: round4(accuracy),
    errors,
    corrected,
    uncorrected,
    keystrokes: r.charKeystrokes + r.backspaces,
    backspaces: r.backspaces,
    consistency: round2(consistency),
    wpmSeries,
    durationMs,
  };
}

function wordCounts(typed: string[], target: string[], caseSensitive: boolean) {
  const typedStr = typed.map((c) => (c == null ? '' : c)).join('');
  const targetStr = target.join('');
  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const tWords = norm(typedStr).trim().split(/\s+/).filter(Boolean);
  const gWords = norm(targetStr).trim().split(/\s+/).filter(Boolean);
  let correct = 0;
  for (let i = 0; i < tWords.length; i++) {
    if (gWords[i] != null && tWords[i] === gWords[i]) correct += 1;
  }
  return { typedWords: tWords.length, correctWords: correct };
}

/** Build a per-second WPM series from cumulative correct-char progress. */
function buildWpmSeries(
  progress: Array<{ t: number; correctChars: number }>,
  startedAt: number | null,
): Array<{ t: number; wpm: number }> {
  if (startedAt == null || progress.length === 0) return [];
  const series: Array<{ t: number; wpm: number }> = [];
  const lastT = progress[progress.length - 1]!.t;
  const totalSec = Math.max(1, Math.ceil((lastT - startedAt) / 1000));

  for (let sec = 1; sec <= totalSec; sec++) {
    const windowEnd = startedAt + sec * 1000;
    // correct chars at this second = latest progress entry at or before windowEnd
    let correctChars = 0;
    for (const p of progress) {
      if (p.t <= windowEnd) correctChars = p.correctChars;
      else break;
    }
    const minutes = sec / 60;
    const wpm = minutes > 0 ? correctChars / CHARS_PER_WORD / minutes : 0;
    series.push({ t: sec, wpm: round2(wpm) });
  }
  return series;
}

export interface AlignmentResult {
  /** Characters correctly matched (in order). */
  matches: number;
  /** Substitutions: typed a wrong char where a char was expected. */
  substitutions: number;
  /** Deletions: a target char was skipped (missing from typed). */
  deletions: number;
  /** Insertions: an extra char typed that isn't in the target. */
  insertions: number;
  /** Total edit distance = subs + dels + ins. */
  distance: number;
}

/**
 * Align the typed string against the target using Levenshtein with
 * backtrace. This makes a single skipped or extra character count as ONE
 * error instead of shifting every following character out of place (which
 * is what caused accuracy to collapse after one mistake).
 *
 * We align against the target *prefix* only up to a reasonable bound so the
 * large untyped remainder of a long passage is never counted against you.
 */
export function alignTypedToTarget(
  typedStr: string,
  targetStr: string,
  caseSensitive: boolean,
): AlignmentResult {
  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const a = Array.from(norm(typedStr)); // typed
  // Only consider the portion of the target you could reasonably have reached:
  // typed length plus a small slack for trailing deletions.
  const bound = Math.min(targetStr.length, a.length + 2);
  const b = Array.from(norm(targetStr).slice(0, bound)); // target prefix

  const n = a.length;
  const m = b.length;
  if (n === 0) {
    return { matches: 0, substitutions: 0, deletions: 0, insertions: 0, distance: 0 };
  }

  // DP table of edit distance.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1, // deletion from typed (insertion in target)
        dp[i]![j - 1]! + 1, // insertion into typed
        dp[i - 1]![j - 1]! + cost, // match or substitution
      );
    }
  }

  // Backtrace to classify the operations.
  let i = n;
  let j = m;
  let matches = 0;
  let substitutions = 0;
  let insertions = 0; // extra typed chars
  let deletions = 0; // skipped target chars
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i]![j] === dp[i - 1]![j - 1]) {
      matches++;
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + 1) {
      substitutions++;
      i--;
      j--;
    } else if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      insertions++; // extra char typed
      i--;
    } else {
      deletions++; // target char skipped
      j--;
    }
  }

  return {
    matches,
    substitutions,
    deletions,
    insertions,
    distance: substitutions + deletions + insertions,
  };
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
