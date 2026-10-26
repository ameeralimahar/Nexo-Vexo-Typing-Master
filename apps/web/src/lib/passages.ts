/**
 * Sample English passages. Language-agnostic shape so Urdu/others slot in
 * later. In a future phase these move to the database + admin CRUD.
 *
 * Design goals for these passages:
 *  - Long enough that they cannot be finished within a normal test window,
 *    so the timer (not the passage end) is what stops the test.
 *  - Varied topics, no repeats within a session (see pickPassage).
 *  - Full keyboard coverage: every passage is checked at build/runtime to
 *    contain all 26 letters so practice touches every key.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Category =
  | 'government'
  | 'office'
  | 'news'
  | 'legal'
  | 'data-entry'
  | 'mixed';

export interface Passage {
  id: string;
  language: string;
  difficulty: Difficulty;
  category: Category;
  wordCount: number;
  source?: string;
  copyrightNote?: string;
  text: string;
}

function wc(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const raw: Omit<Passage, 'wordCount'>[] = [
  {
    id: 'mixed-pangram-001',
    language: 'en',
    difficulty: 'easy',
    category: 'mixed',
    source: 'Original sample',
    text: 'The quick brown fox jumps over the lazy dog while five wizards gleefully box a jovial sphinx near the quay. A calm and steady approach to typing begins with relaxed shoulders, light wrists, and even breathing. Keep your eyes on the source text rather than your fingers, and let each word flow into the next without rushing. Accuracy matters more than raw speed, because a clean line rarely needs correction. Practice a little every single day, and you will be amazed how quickly your hands learn the exact position of every key. Zebras, quartz, and jukeboxes may seem like unusual words, yet they help your fingers visit the corners of the keyboard that ordinary sentences often forget to exercise.',
  },
  {
    id: 'gov-notice-001',
    language: 'en',
    difficulty: 'medium',
    category: 'government',
    source: 'Original sample',
    text: 'The office of the Deputy Commissioner hereby notifies all concerned departments that the annual performance review will commence from the first day of next month. Every officer is directed to submit a complete report in the prescribed format before the stipulated deadline, quoting the exact reference number assigned to their section. Any delay in submission shall be viewed seriously and may invite disciplinary action under the relevant service rules. Junior staff are expected to assist their supervisors, verify each figure against the ledger, and ensure that no column is left blank. Copies of this notice should be displayed on every notice board so that nobody can later claim to have been unaware of the requirement, and officers must organize their files with zeal before the firm deadline.',
  },
  {
    id: 'office-mail-001',
    language: 'en',
    difficulty: 'easy',
    category: 'office',
    source: 'Original sample',
    text: 'Please find attached the minutes of the meeting held on Monday, along with the revised budget and the updated project timeline. Kindly review the action items assigned to your team, mark the ones you have finished, and share your progress by the end of the week. If any task requires extra resources, flag it early so that we can adjust the plan before it becomes urgent. Remember to keep your replies brief, quote the item number you are answering, and avoid sending large files without zipping them first. A quick, well organized inbox saves everyone time, reduces confusion, and keeps our joint work moving forward smoothly from one week to the next without unnecessary back and forth.',
  },
  {
    id: 'news-city-001',
    language: 'en',
    difficulty: 'medium',
    category: 'news',
    source: 'Original sample',
    text: 'Authorities announced today that a new public transport service will begin operations across the city early next year. Officials said the project aims to reduce traffic jams and provide affordable travel for daily commuters who currently spend long hours stuck on crowded roads. The service is expected to connect major residential areas with the central business district through a network of dedicated routes, modern buses, and clearly marked stops. Experts believe the plan could lower fuel use, improve air quality, and give thousands of families an extra hour at home each evening. Local shopkeepers welcomed the news, hoping the quieter zones would attract more visitors and boost the small businesses that have struggled over the past few difficult years.',
  },
  {
    id: 'legal-clause-001',
    language: 'en',
    difficulty: 'hard',
    category: 'legal',
    source: 'Original sample',
    text: 'The party of the first part hereby agrees to indemnify and hold harmless the party of the second part against any and all claims, damages, liabilities, and expenses arising out of or in connection with the performance of the obligations set forth in this agreement, except to the extent that such claims are directly attributable to the gross negligence or wilful misconduct of the indemnified party. Each party acknowledges that it has read every clause carefully, understood the consequences, and sought independent advice where necessary. No amendment to this document shall be valid unless it is made in writing, dated, and signed by authorised representatives of both parties, who jointly confirm that the quoted figures and exact dates are correct and that no zone of ambiguity remains.',
  },
  {
    id: 'data-entry-001',
    language: 'en',
    difficulty: 'medium',
    category: 'data-entry',
    source: 'Original sample',
    text: 'Invoice 4471 dated 03/15/2024 amount 15,230.00 vendor code VX-8812 status PAID. Invoice 4472 dated 03/16/2024 amount 9,875.50 vendor code VX-2290 status DUE. Invoice 4473 dated 03/18/2024 amount 42,000.00 vendor code VX-1055 status PARTIAL. Please verify each entry against the ledger before final posting, and flag any mismatched figure for a quick manual review. Remember that zeros and the letter O look alike, so check column seven twice. Totals must balance exactly: 1,234 plus 5,678 equals 6,912, while 90 minus 45 leaves 45. A single wrong digit can throw off an entire report, so move slowly, breathe, and confirm every value before you jump to the next noisy row of mixed numbers and codes.',
  },
  {
    id: 'mixed-motivation-001',
    language: 'en',
    difficulty: 'easy',
    category: 'mixed',
    source: 'Original sample',
    text: 'Success in any typing exam is built quietly, one honest practice session at a time. Jack and Zoya both began as slow, nervous beginners who feared the blinking cursor, yet they kept turning up every morning with fresh coffee and a clear goal. They learned to relax, to trust their fingers, and to forgive the odd mistake instead of freezing over it. Within a few weeks their speed exceeded what they had once thought impossible, and the strange keys in the far corners no longer felt like a maze. Remember that every expert was once a jumble of clumsy errors, and that quiet daily effort beats a single frantic burst of energy. Keep going, stay kind to yourself, and let progress arrive in its own steady time.',
  },
  {
    id: 'gov-circular-001',
    language: 'en',
    difficulty: 'hard',
    category: 'government',
    source: 'Original sample',
    text: 'In pursuance of the powers conferred under the applicable regulations, the competent authority is pleased to constitute a committee for the purpose of examining the proposals received in response to the public notice issued last quarter. The committee shall review each file objectively, record its findings in a numbered register, and submit specific recommendations within thirty days from the date of this order. Members are requested to maintain strict confidentiality, declare any conflict of interest in writing, and avoid discussing the matter with unauthorised persons. Should any member be unable to attend a scheduled sitting, a brief justification must be forwarded in advance so that the quorum is not jeopardised, the schedule stays frozen, and the vital work of the committee can proceed without delay.',
  },
];

export const PASSAGES: Passage[] = raw.map((p) => ({ ...p, wordCount: wc(p.text) }));

/** Letters that every passage should contain for full-keyboard practice. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/** Returns the letters missing from a passage (lowercased check). */
export function missingLetters(text: string): string[] {
  const lower = text.toLowerCase();
  return ALPHABET.filter((ch) => !lower.includes(ch));
}

export function getPassageById(id: string): Passage | undefined {
  return PASSAGES.find((p) => p.id === id);
}

export interface PassageFilter {
  language?: string;
  difficulty?: Difficulty;
  category?: Category;
}

export function filterPassages(filter: PassageFilter = {}): Passage[] {
  return PASSAGES.filter(
    (p) =>
      (!filter.language || p.language === filter.language) &&
      (!filter.difficulty || p.difficulty === filter.difficulty) &&
      (!filter.category || p.category === filter.category),
  );
}

const RECENT_KEY = 'nv-recent-passages';
const RECENT_LIMIT = 4;

function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = [id, ...readRecent().filter((r) => r !== id)].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    /* ignore */
  }
}

/**
 * Pick a passage matching the filter, avoiding recently used ones so the
 * same paragraph does not repeat back-to-back. Falls back gracefully when
 * the filtered pool is small.
 */
export function pickPassage(filter: PassageFilter = {}): Passage {
  const matches = filterPassages(filter);
  const pool = matches.length > 0 ? matches : PASSAGES;
  const recent = readRecent();

  const fresh = pool.filter((p) => !recent.includes(p.id));
  const candidates = fresh.length > 0 ? fresh : pool;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]!;
  pushRecent(chosen.id);
  return chosen;
}
