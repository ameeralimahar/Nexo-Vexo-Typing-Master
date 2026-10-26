/**
 * Preset Exam Profiles for common Pakistani testing services.
 *
 * IMPORTANT: These are APPROXIMATIONS for practice only. Official rules
 * vary by role and notice. Every preset has `approximate: true` so the UI
 * shows a "verify with the official notice" disclaimer.
 */
import { ExamProfileSchema, type ExamProfile } from './exam-profile.js';

const ppsc: ExamProfile = {
  id: 'ppsc-en-clerk-v1',
  version: 1,
  name: 'PPSC Clerk (English) — practice approximation',
  service: 'PPSC',
  language: 'en',
  approximate: true,
  durationSec: 300,
  passageLength: { min: 300, max: 900 },
  wordModel: 'char5',
  scoring: { type: 'net_wpm' },
  caseSensitive: false,
  punctuationStrict: false,
  allowBackspace: true,
  allowCorrectPreviousWords: true,
  block: { paste: true, copy: true, rightClick: true },
  pass: { minWpm: 25, minAccuracy: 0.9 },
};

const fpsc: ExamProfile = {
  id: 'fpsc-en-udc-v1',
  version: 1,
  name: 'FPSC UDC (English) — practice approximation',
  service: 'FPSC',
  language: 'en',
  approximate: true,
  durationSec: 300,
  passageLength: { min: 300, max: 1000 },
  wordModel: 'char5',
  scoring: { type: 'net_wpm' },
  caseSensitive: false,
  punctuationStrict: true,
  allowBackspace: true,
  allowCorrectPreviousWords: true,
  block: { paste: true, copy: true, rightClick: true },
  pass: { minWpm: 30, minAccuracy: 0.92 },
};

const nts: ExamProfile = {
  id: 'nts-en-deo-v1',
  version: 1,
  name: 'NTS Data Entry Operator (English) — practice approximation',
  service: 'NTS',
  language: 'en',
  approximate: true,
  durationSec: 300,
  passageLength: { min: 250, max: 800 },
  wordModel: 'char5',
  scoring: { type: 'net_wpm' },
  caseSensitive: false,
  punctuationStrict: false,
  allowBackspace: true,
  allowCorrectPreviousWords: false,
  block: { paste: true, copy: true, rightClick: true },
  pass: { minWpm: 35, minAccuracy: 0.95 },
};

/** All preset profiles, validated at module load so typos fail fast. */
export const PRESET_PROFILES: ExamProfile[] = [ppsc, fpsc, nts].map((p) =>
  ExamProfileSchema.parse(p),
);

export function getPresetById(id: string): ExamProfile | undefined {
  return PRESET_PROFILES.find((p) => p.id === id);
}
