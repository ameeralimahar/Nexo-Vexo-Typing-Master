# Design — NEXO VEXO Typing Master

## Overview

A Turborepo monorepo delivering a Next.js (App Router) web app backed by Prisma +
PostgreSQL. The heart of the product is a framework-agnostic `typing-engine` package
that measures performance and scores against configurable Exam Profiles. The UI keeps
the engine out of React's render path to guarantee zero input lag.

Urdu/RTL is deferred, but the engine, data model, and i18n layer are language-agnostic
from day one.

## Monorepo layout

```
nexovexo-typing-master/
├─ apps/
│  └─ web/                      # @nexovexo/web — Next.js App Router app
├─ packages/
│  ├─ typing-engine/           # @nexovexo/typing-engine — pure TS, no UI deps
│  ├─ ui/                      # @nexovexo/ui — shadcn/ui-based components + theme tokens
│  └─ config/                  # shared eslint/tsconfig/tailwind presets
├─ infra/                      # CDK (S3, SES, CloudFront) — phase-appropriate
├─ turbo.json
├─ package.json                # workspaces + scripts
└─ pnpm-workspace.yaml
```

Package manager: **npm workspaces** (Node 24 / npm 11 available in this environment;
pnpm was not installable via corepack due to a Program Files permission restriction).
Build orchestration: **Turborepo**. The layout is package-manager-agnostic, so switching
to pnpm later only requires adding `pnpm-workspace.yaml` and a lockfile swap.

## Tech stack

| Concern        | Choice |
|----------------|--------|
| Framework      | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling        | Tailwind CSS + design tokens in `packages/ui/theme` |
| Components     | shadcn/ui + Framer Motion |
| State          | Zustand (UI state), engine owns typing state |
| Charts         | Recharts |
| i18n           | next-intl (English only shipped; structure ready for Urdu) |
| ORM / DB       | Prisma + PostgreSQL (Neon for dev) |
| Auth           | Auth.js (NextAuth v5): credentials + Google + guest |
| Validation     | zod |
| Offline        | service worker + IndexedDB (Phase 2) |
| Testing        | Vitest + RTL (unit), Playwright (e2e) |
| Tooling        | ESLint, Prettier, Husky, lint-staged |

## Typing Engine design (`@nexovexo/typing-engine`)

### Principles
- Pure TypeScript, no DOM/React imports in core logic. DOM event *adapters* live in a
  thin, separately-importable submodule so core math stays testable in Node.
- Deterministic: all state transitions are functions of `(state, event)`.
- Replayable: the keystroke log fully reconstructs a session.

### Core types

```ts
type InputEventKind = 'char' | 'backspace' | 'delete' | 'composition' | 'control';

interface KeyEvent {
  t: number;          // ms since session start (high-res)
  kind: InputEventKind;
  value?: string;     // the character(s) for 'char'/'composition'
  code?: string;      // physical key code (for heatmap / finger mapping)
}

interface EngineConfig {
  target: string;             // passage text
  wordModel: 'char5' | 'exact';
  profile: ExamProfile;       // scoring + rules
  language: LanguageCode;     // 'en' now; 'ur' later
}

interface EngineState {
  cursor: number;             // index into target
  typed: string;              // reconstructed typed text
  events: KeyEvent[];         // full log for replay
  perCharStatus: CharStatus[];// 'pending'|'correct'|'incorrect'|'corrected'
  startedAt: number | null;
  endedAt: number | null;
}

interface Metrics {
  grossWpm: number;
  netWpm: number;
  accuracy: number;           // 0..1
  errors: number;
  corrected: number;
  uncorrected: number;
  keystrokes: number;
  backspaces: number;
  consistency: number;        // stddev of per-interval wpm
  wpmSeries: { t: number; wpm: number }[]; // per-second
  durationMs: number;
}
```

### Scoring
- **Gross WPM** = (all typed chars / 5) / minutes.
- **Net WPM** = ((all typed chars / 5) − uncorrected errors) / minutes, floored at 0.
- **Exact word model** = compare whitespace-delimited words to target words.
- Profile scoring formula applied on top: `net_wpm` OR `words_typed_minus_penalties`.
- Penalties, case sensitivity, and punctuation strictness come from the profile.

### Anti-cheat signals (basic)
- Reject/flag keystroke intervals below a human floor (e.g. sustained < ~30ms bursts).
- Flag paste-like insertions (multi-char `char` events when paste is blocked).
- Flag when WPM exceeds a plausibility ceiling for the passage.
- Output `flagged: boolean` + `reasons: string[]` on the result.

### DOM adapter (thin)
A `createDomSource(el, onEvent)` helper wires keydown/beforeinput/compositionend to
`KeyEvent`s. The React layer calls `engine.apply(event)` imperatively and reads a
snapshot via `requestAnimationFrame`, so per-keystroke React re-render is avoided.

## Exam Profile schema

```ts
const ExamProfile = z.object({
  id: z.string(),
  version: z.number().int(),
  name: z.string(),
  service: z.string(),               // e.g. "PPSC"
  language: z.string(),              // "en"
  approximate: z.boolean(),          // true => show disclaimer
  durationSec: z.number().int().positive(),
  passageLength: z.object({ min: z.number(), max: z.number() }),
  wordModel: z.enum(['char5', 'exact']),
  scoring: z.discriminatedUnion('type', [
    z.object({ type: z.literal('net_wpm') }),
    z.object({ type: z.literal('words_minus_penalties'),
               penaltyPerError: z.number() }),
  ]),
  caseSensitive: z.boolean(),
  punctuationStrict: z.boolean(),
  allowBackspace: z.boolean(),
  allowCorrectPreviousWords: z.boolean(),
  block: z.object({ paste: z.boolean(), copy: z.boolean(), rightClick: z.boolean() }),
  pass: z.object({ minWpm: z.number(), minAccuracy: z.number() }), // accuracy 0..1
});
```

Preset profiles (PPSC, FPSC, NTS) ship as validated JSON with `approximate: true`.

## Data model (Prisma)

Key entities (full schema in `prisma/schema.prisma`):

- **User** — id, email, passwordHash?, googleId?, role (USER|CONTENT_EDITOR|ADMIN), createdAt.
- **Profile** — 1:1 with User: displayName, country, preferredLanguage, theme, accent.
- **ExamProfile** — stored copy of the schema above + audit fields.
- **Passage** — text, language, difficulty, category, wordCount, source, copyrightNote.
- **TestSession** — userId?, guestId?, mode, examProfileId?, passageId, startedAt, endedAt, flagged.
- **KeystrokeLog** — testSessionId, compressed blob (gzipped JSON of KeyEvent[]).
- **TestResult** — testSessionId, grossWpm, netWpm, accuracy, errors, consistency, passed, score.
- **KeyStat** — userId, key, totalPresses, errors, avgIntervalMs (feeds heatmap/drills).
- **Lesson / LessonProgress** — Phase 3.
- **Streak** — userId, current, longest, lastActiveDate.
- **Badge / UserBadge** — catalog + awards.
- **LeaderboardEntry** — scope (daily/weekly/all), examProfileId, language, userId, score. (Phase 3)
- **FlaggedTest** — testSessionId, reasons[], status, reviewedBy?.
- **AuditLog** — actorId, action, entity, before/after, at.

KeystrokeLog is stored separately from TestResult so result reads stay cheap; the blob
is only loaded for replay.

## App structure (`apps/web`)

```
app/
├─ (marketing)/page.tsx          # landing + 30s try widget
├─ (app)/practice/page.tsx       # free practice
├─ (app)/simulation/[profile]/   # exam simulation
├─ (app)/results/[sessionId]/    # result sheet
├─ (app)/dashboard/              # Phase 2
├─ api/
│  ├─ sessions/route.ts          # create/submit sessions
│  ├─ results/[id]/route.ts
│  └─ auth/                      # Auth.js
├─ layout.tsx                    # theme provider, fonts, metadata
components/
lib/            # zod schemas, prisma client, auth, offline queue
```

### Zero-lag typing component
- A `<TypingArea>` owns a ref to the engine. Keystrokes mutate engine state directly.
- A single `rAF` loop reads an immutable snapshot and patches only changed character
  spans (keyed by index) — no full-passage React re-render.
- Caret is a position-absolute element animated via transform (GPU), respecting
  `prefers-reduced-motion`.

## Branding & theming

- `packages/ui/theme/tokens.ts` — single source for colors, radii, spacing, fonts.
- Signature accent + neutral base; dark/light + 2–3 accent themes via CSS variables.
- `<Wordmark />` SVG component with light/dark variants; favicon/app-icon set generated.
- Metadata helper builds canonical/OG/Twitter tags from `NEXT_PUBLIC_BASE_URL`.

## Offline & reliability (Phase 2 for full PWA; Phase 1 for result safety)

- Even in Phase 1, submit path writes the result to an IndexedDB outbox first, then
  POSTs; on failure it retries with backoff so a dropped connection never loses a result.
- Phase 2 adds a service worker for offline practice.

## Security

- Passwords hashed with argon2id (fallback bcrypt). 
- zod validation on every route handler input.
- CSRF protection via Auth.js + same-site cookies; secure headers via `next.config` headers().
- Rate limiting middleware on auth and submit endpoints.

## Testing strategy

- **Engine unit tests (Vitest):** scoring formulas, char5 vs exact, backspace allowed/blocked, corrected vs uncorrected, consistency, replay determinism, anti-cheat flags.
- **Component tests (RTL):** TypingArea input handling, results rendering.
- **E2e (Playwright):** guest completes a simulation → sees result sheet.

## Open items to verify later
- Exact official scoring rules per service (presets are approximations by design).
- Final domain routing (root vs `typing.` subdomain).
- Whether a separate API service is needed once mobile apps are planned.
