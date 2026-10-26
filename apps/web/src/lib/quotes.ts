/**
 * Motivational quotes shown on the result card. Chosen by performance band so
 * the message fits how the test went (encouraging when low, celebratory when
 * high). Kept tasteful and non-cheesy.
 */
export interface Quote {
  text: string;
  author?: string;
}

const LOW: Quote[] = [
  { text: 'Every expert was once a beginner. Keep going.' },
  { text: 'Slow is smooth, and smooth becomes fast.' },
  { text: 'Progress, not perfection. You showed up — that counts.' },
  { text: 'The keys you fumble today are the ones you own tomorrow.' },
];

const MID: Quote[] = [
  { text: 'You are closer than you think. One more run.' },
  { text: 'Consistency beats intensity. Steady wins the exam.' },
  { text: 'Good rhythm now. Trust your hands and keep the pace.' },
  { text: 'Accuracy first, speed follows. You are on the right track.' },
];

const HIGH: Quote[] = [
  { text: 'Sharp and clean. That is exam-ready typing.' },
  { text: 'Fast fingers, calm mind. Excellent work.' },
  { text: 'This is the pace that passes. Hold it under pressure.' },
  { text: 'Precision at speed — exactly what the test rewards.' },
];

/**
 * Pick a quote based on net WPM and accuracy. Deterministic per seed so the
 * same result always shows the same quote (seed by result id or score).
 */
export function pickQuote(
  netWpm: number,
  accuracy: number,
  seed: number | string = Date.now(),
): Quote {
  let pool = MID;
  if (accuracy >= 0.95 && netWpm >= 35) pool = HIGH;
  else if (netWpm < 20 || accuracy < 0.85) pool = LOW;

  // Simple deterministic index from the seed string/number.
  const s = typeof seed === 'number' ? seed : hashString(String(seed));
  const idx = Math.abs(s) % pool.length;
  return pool[idx]!;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
