'use client';

import * as React from 'react';
import { replay, getPresetById, type StoredResultLike } from './replay-helpers';
import type { StoredResult } from '@/lib/results-store';

/**
 * Re-runs the stored keystroke log against the passage to reconstruct exactly
 * which characters ended correct/incorrect, then renders the passage with
 * per-character highlighting. Incorrect chars are underlined (not color-only).
 */
export function HighlightedPassage({ result }: { result: StoredResult }) {
  const statuses = React.useMemo(() => reconstructStatuses(result), [result]);
  const chars = React.useMemo(() => Array.from(result.passageText), [result.passageText]);

  return (
    <p className="font-mono text-lg leading-relaxed tracking-wide">
      {chars.map((ch, i) => {
        const s = statuses[i] ?? 'pending';
        const cls =
          s === 'correct'
            ? 'text-type-correct'
            : s === 'incorrect'
              ? 'text-type-incorrect underline decoration-2 underline-offset-2'
              : s === 'corrected'
                ? 'text-type-correct/70'
                : 'text-type-pending';
        return (
          <span key={i} className={cls}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </p>
  );
}

function reconstructStatuses(result: StoredResult): string[] {
  const like: StoredResultLike = {
    passageText: result.passageText,
    profileId: result.profileId,
    events: result.events,
  };
  return replay(like);
}
