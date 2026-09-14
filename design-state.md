# Design State: FPL Assistant — apps/web

_Last updated: 2026-09-13 — real implementation complete (Task 56b), scope note added for later phases_

> **Scope note (read this first if you're not continuing the Task 56 session):** this file originated from the Task 56 (home page) design pass, but its Taste Profile, Design Principles, and locked tokens are now the **authoritative design system for all of `apps/web`**, not just the home page — Phase 15-19 tasks (`tasks/todo.md`) point back here explicitly. Reuse the locked palette/type/radius/motion values exactly for every new page; do not re-derive them. `docs/designpowers/` holds the full per-feature documentation trail (currently one feature: `2026-09-13-web-home-page-*`) — treat it as authoritative over any older, pre-lock reference like `frontend-mockups/*.html`. `.ulpi/design/` is a deliberately-not-adopted comparison alternative — never build from it.

## Brief
_(Task 56-specific — later phases get their own brief under `docs/designpowers/briefs/`, but bind to the Design Principles/Taste Profile below, not a new identity.)_

## Brief
- **Problem:** FPL managers need a fast entry point into the app; this page also sets the visual/interaction identity every later `apps/web` page inherits.
- **Primary persona:** FPL managers — busy, international audience, check frequently (weekly minimum, spikes at gameweek deadlines).
- **Success metric:** User enters a valid team ID and lands on `/teams/[teamId]` (placeholder/404 acceptable there until Task 58 ships).
- **Brief document:** docs/designpowers/briefs/2026-09-13-web-home-page.md

## Personas
No dedicated persona documents produced yet (`inclusive-personas` not run). Ability-spectrum considerations noted directly in the brief instead: non-native English readers, phone users on unreliable connections, screen-reader users, motor-impaired users needing an adequately large tap target.

## Design Principles
1. **Precision reads as trust** — every number monospaced/tabular, never decorative.
2. **The task is the whole page** — one field, one action, nothing else competing.
3. **No feature is worth an extra click** — submit-on-enter, immediate navigation, no gates.
4. **Restraint over spectacle** — the scoreboard accent is one narrow field treatment, not a design language.
5. **Accessible by construction, not by retrofit** — real AA contrast, real `<label>`, adequate tap target, plain-language copy; launch-blocking, not a polish pass.

(Superseded by `design-strategy`'s sharper, testable phrasing — see docs/designpowers/strategy/2026-09-13-web-home-page-strategy.md for full "what this means we will NOT do" detail per principle.)

## Taste Profile
- **Emotional target:** confident, precise, data-trustworthy — "checking a well-built instrument panel, not filling out a form"
- **Quality level:** Production (deliberate tokens, real contrast-checked, no bespoke animation choreography yet)
- **Key references:** TradingView (Rondesignlab case study), Linear, sports broadcast scoreboards; anti-references: official FPL app 2026 redesign, unmodified shadcn Nova default
- **Aesthetic principles:** numerals are structural not decorative, one accent used once, dark-as-default-not-gimmick, silence over ornament
- **Taste document:** docs/designpowers/taste/2026-09-13-web-home-page-taste.md

## Decisions Log

| Date | Agent | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-09-13 | inspiration-scouting | Sourced moodboard: TradingView, Linear, official-FPL-app (cautionary), sports broadcast scoreboards | Grounds visual direction in real, cited references rather than invented aesthetic |
| 2026-09-13 | design-discovery | Chose synthesis of Approach A (Terminal-clean) + restrained Approach B accent; rejected Approach C (fully unthemed) | A sets a real throughline for later pages; C would waste the moodboard work and duck the "first page sets the tone" requirement; full B risks the "gimmicky" look the brief explicitly avoids |
| 2026-09-13 | design-strategy | Locked 5 testable principles (precision-as-trust, task-is-the-page, no-extra-click, restraint-over-spectacle, accessible-by-construction); positioned against the official FPL app's added-friction redesign and ad-heavy third-party FPL tools, not a traditional market competitor set | Discovery's direction needed opinionated, testable rules a builder can actually check work against, not just a vibe description |
| 2026-09-13 | design-strategy | Deferred i18n/localization and first-time-user onboarding out of scope; accepted that no client-side pre-validation of team ID exists (owned by Task 58) | Target user already knows their own ID and what FPL is; pre-validating here would duplicate logic and couple this page to a contract it doesn't need yet |
| 2026-09-13 | design-taste | Rejected the unmodified shadcn Nova default as an anti-reference; locked 4 aesthetic principles (structural numerals, one-accent restraint, dark-as-default, silence over ornament); set quality level to Production (not flagship) | Task 55's scaffold styling is a generic counterfactual default that would tell users nothing about this specific product; flagship-level motion polish isn't justified yet for a one-field page |
| 2026-09-13 | design-taste | Did not ask the user for a personal anti-reference or an explicit "if this were a person" personality sketch — provided a provisional read instead and flagged it for validation | Time-efficient default given the user has been approving direction at a higher level throughout; provisional personality read is corrigible, not load-bearing |
| 2026-09-13 | user | Validated taste profile as-is — no additional anti-reference, "economical colleague" personality read confirmed | User approval, no changes requested |
| 2026-09-13 | writing-design-plans | Split implementation into 6 reviewable tasks (dark tokens → monospace font → layout/field component → submit interaction → content → verification pass), each 2-5 min with its own accessibility check | Matches the plan structure's ordering rule (structure→layout→components→interactions→content→review, accessibility woven through, not a final phase) |
| 2026-09-13 | user | Approved the 6-task plan as written, no reordering or scope changes | User approval |
| 2026-09-13 | ui-composition | Locked concrete dark palette (`#0B0E14`/`#12161F`/`#E7EAF0`/`#9AA4B2`/`#5FB8AE`), IBM Plex Mono for numerals only, 8px single radius, no shadow system, 24rem centered single-column layout | Real values needed to replace the rejected Nova defaults; contrast computed via WCAG luminance formula (14.36:1 foreground, 7.66:1 muted, 8.24:1 accent), not assumed |
| 2026-09-13 | ui-composition | Deferred `--error` token's exact contrast computation to Task 6 | Error state's final visual treatment (text-only vs text+icon+border) isn't settled until Task 4's interaction design |
| 2026-09-13 | user | Approved the UI composition spec, visualized as a published artifact (palette, contrast, type scale, craft tokens, live mockup) | User approval, no changes requested |
| 2026-09-13 | interaction-design | Computed `--error` contrast at 4.72:1 (text/icon on `--error-dim`) — passes AA narrowly; flagged as the one token with little headroom | Closes the open item from ui-composition now that the error treatment (text+icon on dim background) was settled |
| 2026-09-13 | interaction-design | No disabled state on the button, no loading state, no success state on this page — all three explicitly "not applicable" rather than omitted by oversight | Disabled buttons without explanation are an anti-pattern; navigation is instant client-side routing (no wait to show); successful submit *is* leaving the page |
| 2026-09-13 | interaction-design | Button focus ring uses `--foreground`, not `--accent` (unlike the input) | An accent-on-accent ring on the accent-filled button would fail the 3:1 UI-component contrast requirement against its own background |
| 2026-09-13 | interaction-design | No animation specified beyond near-instant (~100-150ms) CSS property transitions on focus/hover/error | Nothing here needs motion to show a relationship or orient the user; matches strategy principle #3 (no manufactured waits) |
| 2026-09-13 | user | Approved the interaction spec as written | User approval, no changes requested |
| 2026-09-13 | accessible-content | Finalized all page strings; shortened both error messages from interaction-design's drafts (dropped passive "is required" phrasing, dropped redundant location guidance already covered by the always-visible hint, added a concrete numeric example instead) | Drafts were serviceable but violated the economical-colleague personality (formal register) and repeated information already on screen |
| 2026-09-13 | accessible-content | Error live region set to `aria-live="polite"`, not the skill's default suggestion of `assertive` | The error is a direct result of the user's own submit action, not an unprompted interruption — reserving `assertive` for changes the user didn't just trigger themselves |
| 2026-09-13 | user | Ran a second, independent design pass via the `frontend-design-ui-ux` skill for comparison (industrial/signage "number plate" direction, `.ulpi/design/DESIGN.md` + `.ulpi/design/home-page.md`) — then chose to proceed with Run A (this designpowers chain's terminal-clean direction), not the number-plate alternative | User preference after seeing both side by side (comparison artifact: https://claude.ai/code/artifact/39c1a5d1-7858-4453-819f-9c089f586545); the `.ulpi/design/` spec is kept on file as an explored, not adopted, alternative |
| 2026-09-13 | (implementation) | Built the real home page (`apps/web/src/app/page.tsx`, `globals.css`, `layout.tsx`) directly from the interactive mockup and all 4 spec docs — same hex values, same copy, same interaction/ARIA wiring, no drift | Mockup + specs were already pixel/behavior-real; re-deriving values during implementation would risk introducing drift from what was actually approved |
| 2026-09-13 | (implementation) | Set the dark palette directly on bare `:root` (not behind a `.dark` class toggle) | Strategy principle #3 ("dark is a default, not a gimmick") — this is the app's one committed look, not a user-toggleable mode |
| 2026-09-13 | (implementation) | No nav built | No other real pages exist yet to link to (matches the "logo/title only, no nav links yet" call from `design-discovery`'s Q4) |
| 2026-09-13 | user + (implementation) | Found and fixed a pre-existing shadcn-scaffold bug in `globals.css`: `--font-sans: var(--font-sans)` (self-reference, silently fell back to browser default sans instead of Geist) — surfaced when user spotted the wrong font on the live page. Follow-up scan found the same failure class in 15 `@theme inline` chart tokens (`var(----chart-X)`, quad-dash typo, never resolved); fixed by pointing to the real `--chart-X` names, except 3 that had no `--color-` prefix and became self-referential after a literal fix — removed those as redundant since `:root`/`.dark` already define those exact names directly | User caught the visible symptom (wrong font); a full scan for the same bug class then found a second, currently-invisible instance that would have broken Phase 18's `@bklit` charts the moment they were built |

## Open Questions

- [ ] No `inclusive-personas` document exists — ability-spectrum notes are brief-level only, not full persona artefacts.

## Artefact Index

| Artefact | Path | Status |
|----------|------|--------|
| Inspiration moodboard | apps/web/design/inspiration-moodboard.md | Complete |
| Brief | docs/designpowers/briefs/2026-09-13-web-home-page.md | Approved |
| Design state | design-state.md | In progress |
| Strategy | docs/designpowers/strategy/2026-09-13-web-home-page-strategy.md | Complete |
| Taste profile | docs/designpowers/taste/2026-09-13-web-home-page-taste.md | Complete — user-validated |
| Personas | — | Not started |
| Plan | docs/designpowers/plans/2026-09-13-web-home-page-plan.md | Approved |
| UI composition spec | docs/designpowers/ui/2026-09-13-web-home-page-ui-composition.md | Complete (Tasks 1-3), user-approved |
| UI composition spec sheet (artifact) | apps/web/design/ui-composition-spec-preview.html — https://claude.ai/code/artifact/728bdc74-e638-4ec5-b9c4-38f0d387e55e | Complete, user-approved |
| Interaction spec | docs/designpowers/interaction/2026-09-13-web-home-page-interaction.md | Complete (Task 4), user-approved |
| Content spec | docs/designpowers/content/2026-09-13-web-home-page-content.md | Complete (Task 5) |
| Comparison run (not adopted) | .ulpi/design/DESIGN.md, .ulpi/design/home-page.md | Complete, explored alternative — not built |
| Real implementation | apps/web/src/app/page.tsx, globals.css, layout.tsx | Complete (Task 56b) — typecheck + build clean, dev-server verified |
| Heuristic evaluation | — | Pending |
| Synthetic test results | — | Pending |

## Design Debt Register

_Items: 0 | Critical: 0 | Oldest: —_

| ID | Date | Source | Severity | What | Who is affected | Suggested fix | Status | Notes |
|----|------|--------|----------|------|----------------|---------------|--------|-------|

## Handoff Chain

### 2026-09-13 design-discovery → design-strategy
> "Brief's approved — synthesis of Terminal-clean (A) plus a restrained scoreboard accent (B) on the ID field only, straight rejection of the fully-unthemed option (C). The thing to hold onto: this is a one-field utility page, but it's also the page every later phase inherits its identity from — don't let strategy treat it as disposable just because it's small. Ability-spectrum notes are in the brief; no formal personas exist yet if you need them."

### 2026-09-13 design-strategy → design-taste
> "Five principles are locked, each with an explicit 'what this rules out' — use them directly as a build checklist, don't paraphrase them. The one I'd flag: 'no feature is worth an extra click' means submit-on-enter and immediate client-side navigation, no confirmation step, no pre-validation round-trip. Accessibility principle #5 is launch-blocking, not a nice-to-have — real contrast check against the actual dark palette, not an assumption. Positioning is against the official FPL app's friction, not a real competitor set, so don't over-invest in differentiation theater."

### 2026-09-13 design-taste → writing-design-plans
> "Taste profile's locked and user-validated — four aesthetic principles (structural numerals, one-accent restraint, dark-as-default, silence over ornament), Production quality level, and craft standards down to radius/shadow/border specifics. Biggest thing to carry forward: we explicitly rejected the unmodified shadcn Nova default as an anti-reference, so don't let the plan just theme Task 55's scaffold — it needs real token changes, not a color swap. Quality level is Production, not flagship, so don't over-spec animation choreography for a one-field page."

### 2026-09-13 writing-design-plans → ui-composition
> "Plan's approved, 6 tasks. You've got Tasks 1-3: dark tokens, monospace numeral font, layout/field component. Don't hand-wave contrast — compute it against real values, that's a launch-blocking principle, not a nice-to-have. Keep radius/shadow/border minimal, one value each — Production quality level, not flagship."

### 2026-09-13 ui-composition → interaction-design
> "Palette, type, and layout are locked with computed contrast ratios (14.36:1 / 7.66:1 / 8.24:1) — no assumptions. One open item for you: I didn't fully compute `--error`'s contrast because its visual treatment (text-only vs text+icon+border) depends on how you design the inline validation feedback in Task 4. Also, the focus ring is already speced as 2px accent-colored — make sure your interaction states build on that rather than inventing a separate focus treatment."

### 2026-09-13 interaction-design → accessible-content
> "`--error` closed out at 4.72:1 — passes AA but with little headroom, so don't let a future pass lighten the dim background further. I wrote the two error messages already (empty / non-numeric) in 'what happened + what to do' form, but you own content proper for Task 5 — treat mine as a draft, not final copy. One thing to carry: no disabled/loading/success states exist on this page by design, so don't write microcopy for states that don't exist. Personality target from the taste profile is 'economical colleague' — no exclamation marks, no filler."

### 2026-09-13 accessible-content → design-builder (Task 6 / actual implementation)
> "Every string on the page is final — H1, label, hint, placeholder, button, both error messages — see the table for what changed from the interaction-design drafts and why. Wire `aria-describedby` to point at both the hint and error elements together, space-separated, not just one. I made a deliberate call on `aria-live='polite'` instead of the usual `assertive` for the error region since it's a direct result of the user's own action — flag it if that reads wrong once it's actually tested with a screen reader in Task 6."
