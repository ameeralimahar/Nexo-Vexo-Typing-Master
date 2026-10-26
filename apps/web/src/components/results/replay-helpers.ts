import {
  TypingEngine,
  getPresetById,
  type ExamProfile,
  type KeyEvent,
} from '@nexovexo/typing-engine';

export interface StoredResultLike {
  passageText: string;
  profileId: string;
  events: KeyEvent[];
}

/** Resolve a profile for replay; fall back to a permissive default. */
function resolveProfile(profileId: string, passageText: string): ExamProfile {
  const preset = getPresetById(profileId);
  if (preset) return preset;
  // Fallback profile for non-preset modes (e.g. practice/try).
  const base = getPresetById('ppsc-en-clerk-v1')!;
  return { ...base, id: profileId, passageLength: { min: 0, max: passageText.length + 1 } };
}

/**
 * Deterministically replay stored events to get the final per-character
 * status array. Used by the results page to highlight exactly where the
 * mistakes were.
 */
export function replay(input: StoredResultLike): string[] {
  const profile = resolveProfile(input.profileId, input.passageText);
  const engine = new TypingEngine({
    target: input.passageText,
    wordModel: profile.wordModel,
    profile,
    language: profile.language,
    allowBackspace: profile.allowBackspace,
  });
  for (const e of input.events) engine.apply(e);
  return engine.snapshot().perCharStatus;
}

export { getPresetById };
