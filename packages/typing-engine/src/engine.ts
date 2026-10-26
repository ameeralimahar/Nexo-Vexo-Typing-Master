/**
 * The typing engine state machine. Deterministic: applying the same
 * ordered KeyEvent[] to a fresh engine always yields identical state,
 * which is what makes replay and re-scoring exact.
 */
import type {
  CharStatus,
  EngineSnapshot,
  KeyEvent,
  LanguageCode,
  WordModel,
} from './types.js';
import type { ExamProfile } from './exam-profile.js';

export interface EngineConfig {
  /** The passage the user must type. */
  target: string;
  wordModel: WordModel;
  profile: ExamProfile;
  language: LanguageCode;
  /** Whether backspace is permitted (usually mirrors profile.allowBackspace). */
  allowBackspace: boolean;
}

interface InternalState {
  cursor: number;
  typedChars: string[];
  /** Per-target-index status. */
  status: CharStatus[];
  /** Whether a given target index was ever wrong (for 'corrected'). */
  everWrong: boolean[];
  events: KeyEvent[];
  startedAt: number | null;
  endedAt: number | null;
}

export class TypingEngine {
  readonly config: EngineConfig;
  private readonly targetChars: string[];
  private state: InternalState;

  constructor(config: EngineConfig) {
    this.config = config;
    this.targetChars = Array.from(config.target);
    this.state = this.freshState();
  }

  private freshState(): InternalState {
    return {
      cursor: 0,
      typedChars: [],
      status: this.targetChars.map(() => 'pending' as CharStatus),
      everWrong: this.targetChars.map(() => false),
      events: [],
      startedAt: null,
      endedAt: null,
    };
  }

  /** Reset the engine to its initial state (keeps config). */
  reset(): void {
    this.state = this.freshState();
  }

  /** Total number of characters in the target passage. */
  get length(): number {
    return this.targetChars.length;
  }

  /** All recorded events (for persistence / replay). */
  getEvents(): readonly KeyEvent[] {
    return this.state.events;
  }

  /**
   * Apply a single input event. Records it for replay, mutates internal
   * state, and returns the resulting immutable snapshot.
   */
  apply(event: KeyEvent): EngineSnapshot {
    if (this.state.startedAt === null && isTextEvent(event)) {
      this.state.startedAt = event.t;
    }
    this.state.events.push(event);

    switch (event.kind) {
      case 'char':
      case 'composition':
        this.handleInsert(event.value ?? '');
        break;
      case 'backspace':
        this.handleBackspace();
        break;
      case 'delete':
        // Treated same as backspace for this phase.
        this.handleBackspace();
        break;
      case 'control':
        // No text effect; already logged.
        break;
    }

    if (this.state.cursor >= this.targetChars.length && this.state.endedAt === null) {
      this.state.endedAt = event.t;
    }

    return this.snapshot();
  }

  /** Explicitly end the session at time t (e.g. timer expiry). */
  finish(t: number): EngineSnapshot {
    if (this.state.endedAt === null) {
      this.state.endedAt = t;
    }
    return this.snapshot();
  }

  private handleInsert(value: string): void {
    for (const ch of Array.from(value)) {
      if (this.state.cursor >= this.targetChars.length) {
        return; // ignore overflow past the passage end
      }
      const idx = this.state.cursor;
      const expected = this.targetChars[idx] ?? '';
      const matches = this.compareChar(ch, expected);

      this.state.typedChars[idx] = ch;
      if (matches) {
        this.state.status[idx] = this.state.everWrong[idx] ? 'corrected' : 'correct';
      } else {
        this.state.status[idx] = 'incorrect';
        this.state.everWrong[idx] = true;
      }
      this.state.cursor += 1;
    }
  }

  private handleBackspace(): void {
    if (!this.config.allowBackspace) return;
    if (this.state.cursor === 0) return;
    this.state.cursor -= 1;
    const idx = this.state.cursor;
    this.state.typedChars[idx] = '';
    // Reset to pending; everWrong is retained so a later correct retype
    // is still counted as 'corrected' for diagnostics.
    this.state.status[idx] = 'pending';
  }

  private compareChar(typed: string, expected: string): boolean {
    let a = typed;
    let b = expected;
    if (!this.config.profile.caseSensitive) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return a === b;
  }

  /** Produce an immutable snapshot for the UI layer. */
  snapshot(): EngineSnapshot {
    return {
      cursor: this.state.cursor,
      typed: this.state.typedChars.join(''),
      perCharStatus: this.state.status.slice(),
      startedAt: this.state.startedAt,
      endedAt: this.state.endedAt,
      finished: this.state.endedAt !== null,
    };
  }
}

function isTextEvent(e: KeyEvent): boolean {
  return e.kind === 'char' || e.kind === 'composition';
}

/**
 * Deterministic replay: rebuild an engine from a config + recorded events.
 * Returns the engine so callers can read its snapshot or compute metrics.
 */
export function replay(config: EngineConfig, events: readonly KeyEvent[]): TypingEngine {
  const engine = new TypingEngine(config);
  for (const e of events) engine.apply(e);
  return engine;
}
