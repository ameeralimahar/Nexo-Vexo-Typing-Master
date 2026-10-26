/**
 * Exam Profile schema — the configurable rules that make a simulation
 * match a real testing service. Validated with zod.
 */
import { z } from 'zod';

export const ScoringSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('net_wpm') }),
  z.object({
    type: z.literal('words_minus_penalties'),
    /** Points subtracted per uncorrected error. */
    penaltyPerError: z.number().nonnegative(),
  }),
]);

export const ExamProfileSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  name: z.string().min(1),
  /** Testing service, e.g. "PPSC". */
  service: z.string().min(1),
  language: z.string().min(1),
  /** When true, UI must show "approximation, verify with official notice". */
  approximate: z.boolean(),
  durationSec: z.number().int().positive(),
  passageLength: z
    .object({ min: z.number().int().nonnegative(), max: z.number().int().positive() })
    .refine((p) => p.max >= p.min, { message: 'max must be >= min' }),
  wordModel: z.enum(['char5', 'exact']),
  scoring: ScoringSchema,
  caseSensitive: z.boolean(),
  punctuationStrict: z.boolean(),
  allowBackspace: z.boolean(),
  allowCorrectPreviousWords: z.boolean(),
  block: z.object({
    paste: z.boolean(),
    copy: z.boolean(),
    rightClick: z.boolean(),
  }),
  pass: z.object({
    minWpm: z.number().nonnegative(),
    /** Accuracy as 0..1. */
    minAccuracy: z.number().min(0).max(1),
  }),
});

export type Scoring = z.infer<typeof ScoringSchema>;
export type ExamProfile = z.infer<typeof ExamProfileSchema>;

/** Parse + validate an unknown value into an ExamProfile (throws on error). */
export function parseExamProfile(input: unknown): ExamProfile {
  return ExamProfileSchema.parse(input);
}

/** Safe parse variant returning zod's result object. */
export function safeParseExamProfile(input: unknown) {
  return ExamProfileSchema.safeParse(input);
}
