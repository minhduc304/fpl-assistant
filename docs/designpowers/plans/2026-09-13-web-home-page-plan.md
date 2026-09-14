# Design Plan: apps/web Home Page (Task 56)

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Ship the home page — a team-ID entry form that redirects to `/teams/[teamId]` — carrying the locked design/taste direction (dark, monospace numerals, one restrained accent, no added friction) instead of Task 55's unmodified shadcn Nova scaffold.

**Design Direction:** docs/designpowers/strategy/2026-09-13-web-home-page-strategy.md, docs/designpowers/taste/2026-09-13-web-home-page-taste.md

**Personas:** FPL managers — international audience, frequent checkers, includes screen-reader users, motor-impaired users, non-native English readers, users on unreliable mobile connections (per design-state.md; no dedicated persona document exists).

---

## Task 1: Dark theme tokens

**Files:** `apps/web/src/app/globals.css`, `apps/web/components.json` (base color if needed)

- [ ] Replace the neutral/Nova default CSS variables with a real dark palette: layered grays for depth (background/surface/border distinct, not flat black), per the TradingView reference — this is the token change that makes the "reject unmodified Nova" decision real, not a color swap on top of it.
- [ ] Add one restrained accent color token, reserved for the ID field treatment only (taste profile: "one accent, used once").
- [ ] If any semantic color exists (error state), desaturate it per the TradingView reference rather than using saturated red/green.

**Accessibility check:** Every text/background pairing in the new palette must pass WCAG AA (4.5:1 normal text, 3:1 large text/UI components) — check now, before any component is built on top of it, not after.

**Verification:** Run an automated contrast check (axe or Lighthouse) against the new token values directly; fix any failing pairing before Task 2 starts.

---

## Task 2: Monospace numeral font

**Files:** `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`

- [ ] Add a monospace font (e.g. a `next/font` load, consistent with the existing Geist setup from Task 55) reserved for numerals/figures — taste profile: "numerals are structural, not decorative."
- [ ] Wire it as a CSS variable/utility class distinct from the body sans font, so it can be applied precisely (e.g. to the ID field) without becoming the default UI font everywhere.

**Accessibility check:** Confirm the monospace face doesn't regress legibility at small sizes — check actual rendered digits at the ID field's font size, not just visually skim it.

**Verification:** Two numeral instances (e.g. `1` and `123456`) render with aligned digit widths using the new font utility.

---

## Task 3: Home page layout + team-ID field component

**Files:** `apps/web/src/app/page.tsx` (replaces the default Next.js scaffold home page)

- [ ] Single centered layout: one visible `<label>` (not a placeholder standing in for it — strategy principle #5), one input styled with the monospace-numeral treatment and the restrained accent from Task 1/2 ("number is the star," applied to this field only), one submit button.
- [ ] No hero copy, no marketing filler, no navigation to not-yet-built pages — strategy principle #2, "the task is the whole page."
- [ ] Input has adequate tap target size (44×44px minimum per WCAG target-size guidance) for motor-impaired users.

**Accessibility check:** Label is programmatically associated with the input (`<label for>` / wrapping), not placeholder-only; tap target meets minimum size; page has a logical heading structure even though it's minimal (one `<h1>` naming the page's purpose, not decorative).

**Verification:** Inspect rendered HTML — real `<label>` element present and associated; tap target measured ≥44px; no placeholder-as-label anti-pattern.

---

## Task 4: Submit interaction — no extra click

**Files:** `apps/web/src/app/page.tsx` (client component logic)

- [ ] Submit on Enter key and on button click — both paths go through the same handler.
- [ ] On valid-shaped input (numeric, non-empty), navigate client-side to `/teams/[teamId]` immediately — no confirmation dialog, no intermediate loading screen, no server round-trip to pre-validate (strategy principle #3: "no feature is worth an extra click"; Task 58 owns real validation).
- [ ] On empty or non-numeric input, show inline feedback before attempting navigation — don't let the user submit toward a route that can't possibly be valid.

**Accessibility check:** Inline validation feedback must be announced to screen readers (e.g. `aria-live` region or `aria-describedby` linking the error to the field), not conveyed by color alone.

**Verification:** Manually test: Enter key submits; button click submits; empty submit shows non-color-only feedback; valid numeric ID navigates immediately with no extra step.

---

## Task 5: Content — labels and hint copy

**Files:** `apps/web/src/app/page.tsx`

- [ ] Write the field label and any hint text in plain language, no idioms, no unexplained jargon (e.g. don't assume "team ID" is self-explanatory without one short clarifying hint — per the strategy's identified friction point: "user doesn't know their own team ID / where to find it").
- [ ] Match the taste profile's personality: economical, no filler, no exclamation marks (e.g. "Enter your team ID" not "Let's find your team! 🎉").
- [ ] Button label states the action plainly (e.g. "View team", not a generic "Submit").

**Accessibility check:** Copy is readable at a plain-language level (short sentences, common words) given the international, non-native-English-reader audience named in the brief.

**Verification:** Read every string on the page aloud — does it need a dictionary or FPL-insider knowledge to understand? If yes, revise.

---

## Task 6: Accessibility + design-principle verification pass

**Files:** none (verification only)

- [ ] Screen-reader walkthrough (VoiceOver or NVDA): confirm a screen-reader user can identify the field's purpose and submit without sighted assistance (strategy's success metric).
- [ ] Re-run the automated contrast check against the final built page (not just the raw tokens from Task 1) — component-level overrides can silently break token-level contrast.
- [ ] Check against all 5 locked design principles from `design-state.md` as a literal checklist, not paraphrased.

**Accessibility check:** This task *is* the accessibility check — no separate criterion beyond doing it thoroughly.

**Verification:** Written pass/fail against each of the 5 principles + the strategy's success-metrics table (time to submit, steps to navigate, contrast compliance, screen-reader task completion).

---

## Deferred / Explicitly Out of Scope

- Server-side team-ID validation (Task 58 owns the `/teams/[teamId]` 404/error state).
- Localization/i18n.
- Any animation beyond a minimal focus/hover state (Production quality level, not flagship).
