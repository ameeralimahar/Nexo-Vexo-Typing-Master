# Requirements — NEXO VEXO Typing Master

## Introduction

NEXO VEXO Typing Master is a web portal where candidates in Pakistan practice for
typing tests conducted by testing services (STS, NTS, PTS, ETEA, OTS, PPSC, FPSC and
similar) for roles such as clerk, junior clerk, data entry operator, stenotypist,
computer operator and assistant. The product combines Monkeytype-grade speed and polish
with an exam-accurate simulator, personalized diagnostics, and (later) Urdu support.

**Scope note (this iteration):** Urdu and other RTL languages are deferred. The data
model, typing engine, and i18n layer MUST be built language-agnostic so Urdu, Sindhi,
and Pashto can be added later without refactoring. English (QWERTY) is the only shipped
language for now.

**Architecture decisions (confirmed defaults):**

- Turborepo monorepo: `apps/web`, `packages/typing-engine`, `packages/ui`, `infra/`.
- Next.js (App Router) + TypeScript; backend via route handlers / server actions.
- Prisma ORM + PostgreSQL.
- Auth: guest mode + email/password + Google (Auth.js v5). Phone OTP deferred.
- Package names: `@nexovexo/typing-engine`, `@nexovexo/ui`, `@nexovexo/web`.

Requirements use EARS-style acceptance criteria.

---

## Requirement 1: Typing Engine (core, UI-independent)

**User Story:** As a candidate, I want an accurate typing engine that measures my
performance precisely, so that my practice reflects real exam scoring.

#### Acceptance Criteria

1. The typing-engine package SHALL have zero UI/framework dependencies and be independently testable.
2. WHEN a user types, the engine SHALL process input via keydown / beforeinput / composition events rather than relying solely on the input element value.
3. The engine SHALL compute gross WPM, net WPM, accuracy %, error count, total keystrokes, backspaces, corrected errors, and uncorrected errors.
4. The engine SHALL compute consistency as the standard deviation of per-interval WPM and expose a per-second WPM time series.
5. The engine SHALL support word definition as a fixed 5 characters (standard) AND exact word-count scoring, selectable via configuration.
6. The engine SHALL record every keystroke with a high-resolution timestamp to enable deterministic replay and re-scoring.
7. WHEN a completed session's keystroke log is replayed, the engine SHALL reproduce identical metrics to the original run.
8. WHEN a test is scored against an Exam Profile, the engine SHALL apply that profile's scoring formula, penalties, and pass thresholds.

## Requirement 2: Exam Profiles

**User Story:** As an admin, I want configurable exam rules, so that simulations match
each testing service's real conditions.

#### Acceptance Criteria

1. An Exam Profile SHALL be defined by a versioned JSON schema and validated with zod.
2. An Exam Profile SHALL specify: duration, passage length, scoring formula (net WPM, or words-typed minus penalties), error penalty rules, case sensitivity, and punctuation strictness.
3. An Exam Profile SHALL specify whether backspace and correcting previous words are allowed.
4. An Exam Profile SHALL specify whether paste, copy, and right-click are blocked.
5. An Exam Profile SHALL specify minimum WPM and minimum accuracy required to pass.
6. The system SHALL ship preset profiles for PPSC, FPSC, and NTS, each labeled "approximation, verify with the official notice".
7. WHEN an admin creates or edits a profile, the system SHALL validate it and show a live preview of the resulting rules.

## Requirement 3: Anti-Cheat (basics)

**User Story:** As a product owner, I want basic anti-cheat, so that leaderboards stay credible.

#### Acceptance Criteria

1. WHEN paste or drag-drop is attempted in a test governed by a profile that blocks it, the system SHALL prevent the action.
2. The engine SHALL detect impossible bursts and inhuman keystroke timing and flag the session.
3. WHEN a session is flagged, the system SHALL exclude its score from leaderboards.
4. Flagged sessions SHALL be queued for admin review (admin queue delivered in a later phase).

## Requirement 4: Practice Modes

**User Story:** As a candidate, I want multiple practice modes, so that I can prepare in different ways.

#### Acceptance Criteria

1. Exam Simulation mode SHALL run full-screen and distraction-free, strictly follow an Exam Profile, and end with an official-style result sheet.
2. Free Practice mode SHALL let the user choose duration (1/2/5/10 min), difficulty, and topic (government letters, office correspondence, news, legal text, numbers/data entry, mixed).
3. Drill Mode SHALL auto-generate drills from the user's weak keys, weak fingers, and slow bigrams. (Phase 2)
4. Data Entry Mode SHALL support numeric and alphanumeric entry with form-style fields and 10-key numpad practice. (Phase 3)
5. Beginner Course SHALL provide structured lessons from home row to full keyboard with finger guidance and progressive unlocking. (Phase 3)
6. Daily Challenge SHALL present one shared passage per day with a daily leaderboard. (Phase 3)

## Requirement 5: Analytics & Diagnostics

**User Story:** As a candidate, I want detailed diagnostics, so that I know exactly what to improve.

#### Acceptance Criteria

1. The results page SHALL show a WPM-over-time chart, accuracy, an error breakdown, and the passage highlighted to show where mistakes happened.
2. The system SHALL render a per-key accuracy/speed heatmap on a keyboard diagram and per-finger error stats. (Phase 2)
3. The system SHALL detect slow bigrams and slow words and feed them into Drill Mode. (Phase 2)
4. The Exam Readiness Gauge SHALL, for a chosen profile, estimate pass probability from the user's last N tests and show a plain-language estimate (e.g., target vs. current WPM/accuracy and estimated days to ready). (Phase 2)
5. The progress dashboard SHALL show history, personal bests, streaks, weekly goals, and total time practiced. (Phase 2)
6. The system SHALL show percentile ranking against other users, per exam profile.

## Requirement 6: Accounts & Auth

**User Story:** As a visitor, I want to try a test immediately and optionally create an account, so that there is no barrier to entry.

#### Acceptance Criteria

1. Guest mode SHALL allow a first full test with no signup.
2. The system SHALL support email/password sign-up/sign-in with passwords hashed using argon2 or bcrypt.
3. The system SHALL support Google sign-in.
4. WHEN a guest with local results signs up, the system SHALL offer to migrate their guest results into the new account.
5. Phone OTP sign-in MAY be added later (deferred).
6. The system SHALL provide an account-deletion flow and a privacy policy page.

## Requirement 7: Engagement & Growth

**User Story:** As a candidate, I want streaks, badges, and shareable results, so that I stay motivated.

#### Acceptance Criteria

1. The system SHALL track streaks, XP, levels, and badges with a restrained, non-childish visual style.
2. The system SHALL generate a downloadable progress certificate (PDF) and a shareable result-card image, both carrying NEXO VEXO branding and a unique verification ID.
3. The system SHALL provide leaderboards (daily, weekly, all-time) filterable by exam profile and language. (Phase 3)
4. The system SHALL provide an entitlements/feature-flag layer distinguishing free vs. Pro, WITHOUT implementing payments yet.

## Requirement 8: Admin Panel (Phase 4)

**User Story:** As an admin, I want to manage content and users, so that the catalog stays accurate.

#### Acceptance Criteria

1. The admin panel SHALL enforce role-based access for admin and content-editor roles.
2. The system SHALL provide CRUD for passages (language, difficulty, category, word count, source/copyright note) with CSV bulk import and automatic validation (character set, length).
3. The system SHALL provide CRUD for Exam Profiles with a live rules preview.
4. The system SHALL provide user management, a flagged-test review queue, and an analytics overview.

## Requirement 9: UI/UX & Branding

**User Story:** As a user, I want a premium, accessible, on-brand experience, so that the product feels trustworthy and fast.

#### Acceptance Criteria

1. The product name "NEXO VEXO Typing Master" SHALL appear consistently in UI, titles, metadata, emails, certificates, PWA manifest (name/short_name), and share cards.
2. The system SHALL provide a "NEXO VEXO" wordmark as an SVG component with light and dark variants, plus a favicon/app-icon set.
3. All colors, radii, and spacing SHALL be defined as design tokens in a single theme file.
4. The system SHALL support dark and light themes plus 2–3 selectable accent themes.
5. The typing area SHALL be the visual hero: large, legible, with a smooth caret; correct and incorrect characters SHALL be distinguished by more than color alone.
6. The system SHALL achieve zero perceptible input lag by keeping the engine out of React's render path and avoiding full-passage re-render per keystroke.
7. The system SHALL be responsive (desktop-first); on mobile it SHALL surface analytics, lessons, and tips and clearly recommend a hardware keyboard for tests.
8. The UI SHALL meet WCAG 2.2 AA, support full keyboard navigation, honor reduced-motion, and provide screen-reader-friendly results.
9. The landing page SHALL include a live "try a 30-second test now" widget requiring no signup.

## Requirement 10: Performance, Reliability & Security

**User Story:** As a user on a weak connection and low-end PC, I want the app to stay fast and never lose my results.

#### Acceptance Criteria

1. The landing page SHALL score Lighthouse 90+ on performance and accessibility and load acceptably on 3G-class connections.
2. WHEN a connection drops mid-test or at submit, the system SHALL queue results locally (IndexedDB) and sync when connectivity returns, never losing a result.
3. The app SHALL be an installable PWA with an offline-capable practice mode (service worker + IndexedDB sync queue). (Phase 2)
4. The system SHALL apply rate limiting, zod input validation, CSRF protection, and secure HTTP headers.
5. The system SHALL collect minimal personal data and document it in a privacy policy.

## Requirement 11: Branding & Domain

**User Story:** As the product owner, I want consistent branding and correct production metadata.

#### Acceptance Criteria

1. The production app SHALL be served under the nexovexo.com domain; the base URL SHALL be an environment variable.
2. The system SHALL configure canonical URLs, Open Graph / Twitter metadata, sitemap.xml, and robots.txt for the production domain.
3. Visual identity SHALL use one signature accent color over a neutral base, with a confident/techy feel.

## Requirement 12: Data Model

**User Story:** As a developer, I want a clear data model, so that features compose cleanly.

#### Acceptance Criteria

1. The schema SHALL include: User, Profile, ExamProfile, Passage, TestSession, KeystrokeLog (compressed), TestResult, KeyStat, Lesson, LessonProgress, Streak, Badge, UserBadge, LeaderboardEntry, FlaggedTest, AuditLog.
2. KeystrokeLog SHALL be stored compressed and linked to its TestSession for replay.
3. Passage and language-related fields SHALL be language-agnostic to allow future languages.

## Non-Functional / Quality

1. Tooling: ESLint, Prettier, Vitest + React Testing Library, Playwright e2e, Husky pre-commit hooks.
2. Unit tests SHALL cover engine scoring edge cases and backspace rules (Urdu composition tests added when Urdu ships).
3. E2e tests SHALL cover the core test flow (start → type → submit → result).
4. A seed script SHALL insert sample English passages and the preset exam profiles.
5. IaC (CDK or Terraform) and a GitHub Actions CI/CD pipeline SHALL be provided for the AWS pieces (S3, SES, CDN). (Phase-appropriate)

## Phased Delivery

- **Phase 1 (MVP):** typing engine + tests, English Free Practice, Exam Simulation with 3 profiles (PPSC/FPSC/NTS), results page with basic charts, guest mode, auth, landing page.
- **Phase 2:** diagnostics (heatmap, bigrams), Drill Mode, Readiness Gauge, dashboard, streaks, PWA/offline.
- **Phase 3:** leaderboards, Daily Challenge, Beginner Course, Data Entry Mode, certificates, share cards.
- **Phase 4:** admin panel, anti-cheat review queue, institute batches, Pro tier + payments.
