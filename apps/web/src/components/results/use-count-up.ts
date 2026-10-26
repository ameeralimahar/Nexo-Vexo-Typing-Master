'use client';

import * as React from 'react';

/**
 * Animate a number from 0 to `target` over `durationMs`. Respects
 * prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || durationMs <= 0) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic for a lively settle.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
