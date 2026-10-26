# Tasks — NEXO VEXO Typing Master

Implementation plan. Urdu deferred; English-first, language-agnostic architecture.
Check off tasks as they complete.

## Phase 0 — Foundation

- [ ] 0.1 Initialize pnpm + Turborepo monorepo with workspaces (`apps/*`, `packages/*`)
  - Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, base `tsconfig`
  - _Req: Deliverables, Non-Functional_
- [ ] 0.2 Add shared config package (`@nexovexo/config`): eslint, prettier, tsconfig, tailwind preset
  - _Req: Non-Functional 1_
- [ ] 0.3 Set up Husky + lint-staged pre-commit hooks
  - _Req: Non-Functional 1_

## Phase 1 — MVP

### Typing engine
- [ ] 1.1 Create `@nexovexo/typing-engine` package skeleton (pure TS, no UI deps)
  - _Req: 1.1_
- [ ] 1.2 Implement core types + state machine (`apply(state, event)`)
  - _Req: 1.2, 1.6_
- [ ] 1.3 Implement metrics (gross/net WPM, accuracy, errors, corrected/uncorrected, keystrokes, backspaces)
  - _Req: 1.3_
- [ ] 1.4 Implement consistency + per-second WPM series
  - _Req: 1.4_
- [ ] 1.5 Implement word models: `char5` and `exact`
  - _Req: 1.5_
- [ ] 1.6 Implement deterministic replay + re-score
  - _Req: 1.6, 1.7_
- [ ] 1.7 Implement Exam Profile zod schema + scoring application
  - _Req: 1.8, 2.1, 2.2, 2.3, 2.4, 2.5_
- [ ] 1.8 Implement basic anti-cheat signals (burst/timing/paste/ceiling flags)
  - _Req: 3.1, 3.2, 3.3_
- [ ] 1.9 Author preset profiles PPSC / FPSC / NTS (approximate=true)
  - _Req: 2.6_
- [ ] 1.10 Unit tests: scoring edge cases, backspace rules, replay determinism, anti-cheat
  - _Req: Non-Functional 2_

### Design system & branding
- [ ] 1.11 Create `@nexovexo/ui`: theme tokens, Tailwind preset, dark/light + accents
  - _Req: 9.3, 9.4_
- [ ] 1.12 Build `<Wordmark />` SVG (light/dark) + favicon/app-icon set
  - _Req: 9.2, 11.3_
- [ ] 1.13 Base shadcn/ui components wired to tokens

### Web app foundation
- [ ] 1.14 Scaffold `apps/web` (Next.js App Router, TS, Tailwind, next-intl EN)
  - _Req: 9.1_
- [ ] 1.15 Metadata/SEO helper (canonical, OG/Twitter, sitemap.xml, robots.txt) from `NEXT_PUBLIC_BASE_URL`
  - _Req: 11.1, 11.2_
- [ ] 1.16 Prisma schema + initial migration (all Phase-1 entities)
  - _Req: 12.1, 12.2, 12.3_
- [ ] 1.17 Prisma client + seed script (sample EN passages + preset profiles)
  - _Req: Non-Functional 4_

### Auth
- [ ] 1.18 Auth.js v5: credentials (argon2) + Google + guest sessions
  - _Req: 6.1, 6.2, 6.3, 6.5_
- [ ] 1.19 Guest→account result migration
  - _Req: 6.4_
- [ ] 1.20 Account deletion flow + privacy policy page
  - _Req: 6.6, 10.5_

### Typing UI (zero-lag)
- [ ] 1.21 `<TypingArea>` with DOM event adapter + rAF snapshot render (no full re-render)
  - _Req: 9.5, 9.6_
- [ ] 1.22 Smooth caret with reduced-motion support; non-color-only correct/incorrect styling
  - _Req: 9.5, 9.8_

### Modes & results
- [ ] 1.23 Free Practice (duration/difficulty/topic selection)
  - _Req: 4.2_
- [ ] 1.24 Exam Simulation (full-screen, profile-strict, block paste/copy/right-click per profile)
  - _Req: 4.1, 3.1_
- [ ] 1.25 Result sheet: WPM-over-time chart, accuracy, error breakdown, highlighted passage
  - _Req: 5.1_
- [ ] 1.26 Session create/submit API with IndexedDB outbox (never lose a result)
  - _Req: 10.2_
- [ ] 1.27 Percentile ranking per profile (basic)
  - _Req: 5.6_

### Landing & quality
- [ ] 1.28 Marketing landing page + live 30-second "try now" widget (no signup)
  - _Req: 9.9_
- [ ] 1.29 Security: zod validation, secure headers, rate limiting, CSRF
  - _Req: 10.4_
- [ ] 1.30 Accessibility pass (WCAG 2.2 AA, keyboard nav, SR-friendly results) + Lighthouse 90+
  - _Req: 9.7, 9.8, 10.1_
- [ ] 1.31 E2e: guest completes a simulation and sees result
  - _Req: Non-Functional 3_
- [ ] 1.32 Phase 1 summary: built / remaining / assumptions to verify

## Phase 2 — Diagnostics & PWA
- [ ] 2.1 Per-key heatmap + per-finger stats; KeyStat aggregation
- [ ] 2.2 Slow-bigram / slow-word detection
- [ ] 2.3 Drill Mode (from weak keys/fingers/bigrams)
- [ ] 2.4 Exam Readiness Gauge (pass probability + days-to-ready)
- [ ] 2.5 Progress dashboard (history, PBs, streaks, weekly goals, time practiced)
- [ ] 2.6 Streaks + XP/levels/badges
- [ ] 2.7 PWA: installable + offline practice (service worker + IndexedDB sync)

## Phase 3 — Content & engagement
- [ ] 3.1 Leaderboards (daily/weekly/all-time) filter by profile/language
- [ ] 3.2 Daily Challenge + daily leaderboard
- [ ] 3.3 Beginner Course (lessons, finger guidance, progressive unlock)
- [ ] 3.4 Data Entry Mode (numeric/alphanumeric, numpad)
- [ ] 3.5 Certificates (PDF) + shareable result cards with verification ID
- [ ] 3.6 Entitlements/feature-flag layer (free vs Pro; no payments)

## Phase 4 — Admin & scale
- [ ] 4.1 Admin panel + RBAC (admin, content editor)
- [ ] 4.2 Passage CRUD + CSV bulk import + validation
- [ ] 4.3 Exam Profile CRUD + live preview
- [ ] 4.4 User management + flagged-test review queue + analytics overview
- [ ] 4.5 Institute batches
- [ ] 4.6 Pro tier + payments
- [ ] 4.7 IaC (CDK): S3, SES, CloudFront + GitHub Actions CI/CD

## Deferred (post-Urdu greenlight)
- [ ] U.1 Urdu language pack: RTL rendering, Nastaliq/Naskh font, joining behavior
- [ ] U.2 Urdu input methods (Phonetic + standard) + on-screen keyboard overlay
- [ ] U.3 OS-layout mismatch detection + warning
- [ ] U.4 Urdu composition unit tests
