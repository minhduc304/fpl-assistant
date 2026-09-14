# Design Brief: apps/web Home Page (Task 56)

## Problem Statement

FPL managers need a fast way to get from "nothing" to "my team's data" — a single entry point into the app. This is the first real page of `apps/web` (a brand-new Next.js scaffold, no pages built yet), so it also has to establish the visual/interaction identity every later page (squad view, player comparison, captain/transfer recommendations, fixtures/charts, mini-league) will inherit.

## Users

FPL (Fantasy Premier League) managers checking their own team/stats — busy, checking frequently (at minimum weekly, spiking around gameweek deadlines). A genuinely international audience: many non-native English readers, users on phones during commutes with unreliable connections, screen-reader users navigating a stat-heavy app, motor-impaired users who need an adequately large single tap target.

## Design Direction

**Synthesis of Approach A (Terminal-clean) + a restrained dose of Approach B (Broadcast scoreboard), rejecting Approach C (Minimal utility, no theming).**

- Base: dark theme, monospace numerals wherever a figure/ID appears, minimal chrome — draws from the TradingView reference in the moodboard. This does the real work of setting a throughline the later data-dense pages (charts, comparisons) can inherit without rework.
- Accent: the "number is the star" idea from sports-broadcast scoreboard graphics (moodboard's cross-domain wildcard), applied narrowly to how the team-ID input field itself is styled — not full scoreboard chrome, no glow effects, no flashy team-color theming layered on top.
- Rejected: a fully unthemed minimal-utility page (Approach C) — it would waste the inspiration work already done and contradicts this page's job of setting tone for everything after it.

## Constraints

- Stack is locked: Next.js (App Router, TS), Tailwind v4, shadcn/ui (Radix base, Nova preset already initialized), `@bklit`/`@kokonutui` registries wired, `motion` installed. Not up for debate.
- No existing visual mockup for this specific page (unlike Tasks 62/66, which have `frontend-mockups/*.html` references).
- Team-ID validation server-side is explicitly out of scope for this page — `/teams/[teamId]` (Task 58) owns the 404/error state; this page just navigates on submit.

## Existing Design System

None yet formalized beyond the shadcn/ui init (Radix base, Nova preset) done in Task 55. This brief's output (via `ui-composition`/`token-architecture` next) is what starts it.

## Taste Direction (Early Signal)

From `apps/web/design/inspiration-moodboard.md` (produced via `inspiration-scouting`): confident, precise, data-trustworthy; explicitly avoiding cluttered/gimmicky/generic-SaaS. Key references: TradingView (dark theme, monospace numerals, desaturated semantic color), Linear (one field, one CTA, no marketing filler), the official FPL app's 2026 redesign as a cautionary "don't add friction" reference, sports broadcast scoreboards as the cross-domain wildcard for treating numbers as hero elements.

## Success Criteria

- A user can enter a team ID and land on `/teams/[teamId]` (placeholder/404 acceptable there until Task 58 ships).
- The visual identity established here (dark, monospace-numerals, minimal, restrained accent) is concrete enough that later phases can extend it without re-deriving an aesthetic from scratch.
- Passes accessibility basics: real contrast checking (not an assumption because it's dark), a single tap target large enough for motor-impaired users, no color-only signal, works for screen-reader users navigating a single labeled field.

## Out of Scope

- Team-ID existence validation / error states (owned by Task 58).
- Any branding/marketing copy — this is a functional entry point, not a landing page.
- Full scoreboard-style chrome, glow effects, or team-color theming beyond the restrained input-field accent.
- Internationalization/localization (not in MVP scope; noted as a real future consideration given the international user base, not solved here).
