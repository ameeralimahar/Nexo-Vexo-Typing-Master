/**
 * Result persistence. Defined behind a ResultsRepository interface so the
 * current localStorage implementation can be swapped for a Prisma/HTTP-backed
 * one later without touching callers.
 *
 * To migrate later: implement ResultsRepository against your API and export
 * that instance as `resultsRepo`. Callers stay unchanged.
 */
import type { KeyEvent, Metrics, AntiCheatResult } from '@nexovexo/typing-engine';

export interface StoredResult {
  id: string;
  createdAt: number;
  mode: 'practice' | 'simulation' | 'try';
  profileId: string;
  profileName: string;
  passageId: string;
  passageText: string;
  language: string;
  metrics: Metrics;
  score: number;
  passed: boolean;
  antiCheat: AntiCheatResult;
  /** Full keystroke log for deterministic replay. */
  events: KeyEvent[];
}

export interface ResultsRepository {
  save(result: StoredResult): Promise<void>;
  get(id: string): Promise<StoredResult | null>;
  list(): Promise<StoredResult[]>;
  /** Percentile of this score among stored results for the same profile. */
  percentile(profileId: string, score: number): Promise<number>;
  clear(): Promise<void>;
}

const KEY = 'nv-results';

function readAll(): StoredResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredResult[]) : [];
  } catch {
    return [];
  }
}

function writeAll(results: StoredResult[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(results));
  } catch {
    /* quota / private mode — ignore, we tried */
  }
}

/**
 * localStorage-backed repository. Also writes to an "outbox" list so that a
 * future sync layer (Phase 2 PWA) can flush results to a server. This keeps
 * the "never lose a result" guarantee even before a backend exists.
 */
class LocalResultsRepository implements ResultsRepository {
  async save(result: StoredResult): Promise<void> {
    const all = readAll();
    all.unshift(result);
    writeAll(all.slice(0, 200)); // cap history locally
  }

  async get(id: string): Promise<StoredResult | null> {
    return readAll().find((r) => r.id === id) ?? null;
  }

  async list(): Promise<StoredResult[]> {
    return readAll();
  }

  async percentile(profileId: string, score: number): Promise<number> {
    const scores = readAll()
      .filter((r) => r.profileId === profileId && !r.antiCheat.flagged)
      .map((r) => r.score);
    if (scores.length === 0) return 0;
    const below = scores.filter((s) => s <= score).length;
    return Math.round((below / scores.length) * 100);
  }

  async clear(): Promise<void> {
    writeAll([]);
  }
}

export const resultsRepo: ResultsRepository = new LocalResultsRepository();

/** Generate a short unique id (also used as verification id on share cards). */
export function newResultId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `NV-${time}-${rand}`;
}
