/**
 * Core types for the NEXO VEXO typing engine.
 * Pure data — no DOM or framework imports.
 */

/** Language code. English now; Urdu/Sindhi/Pashto later. */
export type LanguageCode = 'en' | 'ur' | 'sd' | 'ps' | (string & {});

/** How a "word" is counted for WPM. */
export type WordModel = 'char5' | 'exact';

/** Kinds of input events the engine understands. */
export type InputEventKind =
  | 'char' // one or more printable characters committed
  | 'backspace' // delete char before cursor
  | 'delete' // delete char at cursor (rarely used)
  | 'composition' // IME composition commit (future: Urdu)
  | 'control'; // non-text control key (ignored for text, kept for logs)

/**
 * A single recorded input event. The ordered list of these fully
 * reconstructs a session for deterministic replay.
 */
export interface KeyEvent {
  /** Milliseconds since session start (high-resolution). */
  t: number;
  kind: InputEventKind;
  /** Character(s) for 'char'/'composition' events. */
  value?: string;
  /** Physical key code (e.g. "KeyA") for heatmap / finger mapping. */
  code?: string;
}

/** Per-character display status within the target passage. */
export type CharStatus =
  | 'pending' // not yet reached
  | 'correct' // typed correctly
  | 'incorrect' // typed wrong, still wrong
  | 'corrected'; // was wrong, then fixed (tracked for diagnostics)

/** Immutable snapshot of engine state (safe to hand to the UI). */
export interface EngineSnapshot {
  cursor: number;
  typed: string;
  perCharStatus: CharStatus[];
  startedAt: number | null;
  endedAt: number | null;
  finished: boolean;
}

/** Computed performance metrics for a session. */
export interface Metrics {
  grossWpm: number;
  netWpm: number;
  /** 0..1 */
  accuracy: number;
  errors: number;
  corrected: number;
  uncorrected: number;
  keystrokes: number;
  backspaces: number;
  /** Standard deviation of per-interval WPM (lower = more consistent). */
  consistency: number;
  /** Per-second WPM time series. */
  wpmSeries: Array<{ t: number; wpm: number }>;
  durationMs: number;
}

/** Result of running anti-cheat checks over a session. */
export interface AntiCheatResult {
  flagged: boolean;
  reasons: string[];
}

/** Final scored outcome against an exam profile. */
export interface ScoredResult {
  metrics: Metrics;
  /** Profile-specific score (net WPM or words-minus-penalties). */
  score: number;
  passed: boolean;
  antiCheat: AntiCheatResult;
}
