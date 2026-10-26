# NEXO VEXO Typing Master

Exam-accurate typing practice portal for candidates preparing for Pakistani testing
services (PPSC, FPSC, NTS and more). Monkeytype-grade speed with a real exam simulator
and personalized diagnostics.

> **Status:** Phase 1 (MVP). English only — Urdu/RTL is deferred but the engine and data
> model are language-agnostic. No database yet: results persist in the browser
> (localStorage) behind a repository interface that a Prisma/Postgres backend can
> implement later without changing callers.

## Monorepo layout

```
.
├─ apps/
│  └─ web/                  # @nexovexo/web — Next.js 15 App Router app
├─ packages/
│  ├─ typing-engine/        # @nexovexo/typing-engine — pure TS engine (tested)
│  └─ ui/                   # @nexovexo/ui — design tokens, Tailwind preset, Wordmark
├─ .kiro/specs/typing-master/  # requirements.md, design.md, tasks.md
├─ turbo.json
└─ package.json             # npm workspaces + turbo
```

## Prerequisites

- Node.js >= 20 (tested on Node 24)
- npm 11 (comes with recent Node). The repo uses **npm workspaces** + **Turborepo**.

## Setup

```bash
git clone https://github.com/ameeralimahar/Nexo-Vexo-Typing-Master.git
cd Nexo-Vexo-Typing-Master
npm install
cp apps/web/.env.example apps/web/.env   # optional; only NEXT_PUBLIC_BASE_URL is used now
```

## Scripts

Run from the repo root:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run everything in dev (turbo) |
| `npm run build` | Build all packages + the web app |
| `npm run test` | Run all tests (engine Vitest suite) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run engine:test` | Run just the typing-engine tests |

Web app only:

```bash
npm run dev   --workspace=@nexovexo/web   # http://localhost:3000
npm run build --workspace=@nexovexo/web
```

## Environment variables

| Var | Purpose | Default |
|-----|---------|---------|
| `NEXT_PUBLIC_BASE_URL` | Canonical/OG/sitemap base URL | `http://localhost:3000` |

Database/auth vars are present but commented out in `.env.example` (deferred).

## Architecture overview

- **`@nexovexo/typing-engine`** — framework-agnostic core. Computes gross/net WPM,
  accuracy, errors (corrected vs. uncorrected), consistency, and a per-second WPM series.
  Validates **Exam Profiles** (zod) and applies their scoring/pass rules. Records every
  keystroke for **deterministic replay**. Ships PPSC/FPSC/NTS presets (all marked
  `approximate`). Basic anti-cheat flags inhuman bursts and paste-like inserts.
  - Main entry: `@nexovexo/typing-engine`; DOM adapter: `@nexovexo/typing-engine/dom`.
- **`@nexovexo/ui`** — single-source design tokens (colors/radii/fonts), a Tailwind
  preset, the `Wordmark` SVG, and theme CSS (light/dark + violet/cyan/amber accents).
- **`@nexovexo/web`** — Next.js App Router app:
  - Landing page with a live **30-second try widget** (no signup).
  - **Free Practice** (duration/difficulty/topic) and **Exam Simulation** (full-screen,
    profile-strict, blocks paste/copy/right-click per profile).
  - **Result sheet**: WPM-over-time chart, accuracy, error breakdown, and the passage
    highlighted to show exactly where mistakes happened; per-device percentile.
  - **Zero input lag**: the engine lives in a ref and is driven imperatively; a
    `requestAnimationFrame` loop patches only changed character spans and moves the caret
    via GPU transform — React never re-renders on keystroke.

## Testing

- Engine unit tests (Vitest): `npm run engine:test` — 24 tests covering scoring edge
  cases, char5 vs. exact word models, backspace rules, replay determinism, and anti-cheat.
- E2e (Playwright) is planned next for the core test flow.

## Roadmap

See `.kiro/specs/typing-master/tasks.md`. Phase 2 adds diagnostics (heatmap, bigrams),
Drill Mode, Readiness Gauge, dashboard, streaks, and PWA/offline. Phase 3 adds
leaderboards, Daily Challenge, Beginner Course, Data Entry Mode, and certificates.
Phase 4 adds the admin panel, auth + database, and the Pro tier.
