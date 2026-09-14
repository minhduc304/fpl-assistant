*Every screen must read as the same product if placed side by side.* Binds to `.ulpi/design/DESIGN.md` — read that first.

# Feature: apps/web Home Page (Task 56)

## Flow: Team ID Entry

### Overview

**Goal:** Get from "nothing" to "my team's data" in one field, one submit.

**User Story:** As an FPL manager, I want to enter my team ID so that I land on my team's page.

**Trigger:** Direct navigation to `/` (no other pages exist yet to link from).

### Entry Points

- [x] Direct URL (`/`) — bookmark or typed address, the only entry point today.
- [ ] Referral/search — not applicable yet; no other pages exist to link in from.

### Prerequisites

- [ ] None. No authentication, no permissions, no onboarding — the user already knows their own team ID.

### Flow Diagram

```
[Start: user lands on /]
        │
        ▼
┌─────────────────────┐
│ Number-plate field   │  ← Signature: one split-flap
│ (Signature moment)   │     settle on load, then rests
└─────────────────────┘
        │
        ▼
   User types ID, presses
   Enter or taps "View team"
        │
        ▼
   ◇ Is input numeric and non-empty?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   ▼         ▼
Navigate   Inline error
to         shown on the
/teams/    plate; input
{id}       preserved
```

### Steps

#### Step 1: Land and read the plate

**Screen/Component:** Home page (`/`), the `NumberPlateField` component (see below).

**User Action:**
- Arrives at the page, sees the plate.

**System Response:**
- The plate's placeholder digits run one split-flap settle (Signature), then rest at the placeholder value. Under `prefers-reduced-motion`, this is skipped entirely — the plate simply appears at rest.

**Data:**
- Input: none yet.
- Output: none yet.

**Transitions:**
- User focuses the field → Step 2.

---

#### Step 2: Enter and submit

**Screen/Component:** Same page, `NumberPlateField` + `ViewTeamButton`.

**User Action:**
- Types digits into the plate.
- Presses Enter, or taps/clicks "View team."

**System Response:**
- Validates the value client-side only (numeric, non-empty). No network call — Task 58 owns real existence-validation.

**Validation:**
```typescript
interface TeamIdValidation {
  value: { required: true, pattern: /^[0-9]+$/ };
}
```

**Transitions:**
- Success → navigate to `/teams/{value}`.
- Validation error → inline error on the plate, stay on the page, input preserved.

---

### Decision Points

#### Decision: Is the value a valid shape?

**Condition:** Non-empty and all-numeric.

**Branch A: Valid shape**
- Goes to: client-side navigation to `/teams/{value}`.
- User sees: immediate route change — no loading screen, no confirmation.

**Branch B: Invalid shape**
- Goes to: stays on the home page.
- User sees: the plate's border shifts to `danger`, an inline message appears beneath it, focus remains in the field, typed value is not cleared.

### Exit Points

#### Success Exit
- **Condition:** Value is numeric and non-empty.
- **Destination:** `/teams/{value}` (placeholder/404 acceptable there until Task 58 ships).
- **Feedback:** None needed beyond the navigation itself — the destination page is the feedback.
- **Side effects:** None — no data is persisted by this page.

#### Cancel/Abandon Exit
- **Condition:** User navigates away without submitting.
- **Confirmation:** None — nothing to lose; the field holds no meaningful draft state worth protecting.
- **Data handling:** Not persisted. Re-visiting `/` always starts blank.
- **Destination:** Wherever the user navigates to.

#### Error Exit
- **Condition:** Not applicable at this page's scope — there is no unrecoverable error here (client-side format validation only); a genuinely broken team ID is Task 58's 404/error state, one page downstream.

### Error Handling

| Error Type | Trigger | User Message | Recovery Action |
|------------|---------|--------------|-----------------|
| Validation (empty) | Submit with no value | "Enter your team ID to continue." | Fix and retry — no reload |
| Validation (non-numeric) | Submit with letters/symbols | "Team ID must be numbers only, like 1234567." | Fix and retry — no reload |

No network/permission/not-found/server/timeout rows apply — this page makes no network calls.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User refreshes mid-flow | No state to restore — the page is stateless; a refresh simply re-renders blank |
| Back button pressed (after navigating away) | Standard browser back returns here blank; no special handling needed |
| Slow connection | Not applicable — no request is made from this page; the plate renders from the initial HTML/CSS load only |
| Offline | The page itself is static; only the eventual navigation to `/teams/{value}` would fail offline, and that failure belongs to the destination page, not this one |
| Session expiry | Not applicable — no auth exists in this flow |
| Concurrent edit | Not applicable — single-user, single-field, no shared state |

### State Requirements

**URL State:** None — this page takes no query parameters.

**Local State:**
```typescript
interface HomePageState {
  value: string;
  error: string | null;
}
```

**Persisted State:** None.

### Analytics Events

Deferred — no analytics instrumentation exists yet in this project; not a Task 56 concern. Flag for whoever adds analytics later rather than inventing event names now.

### Accessibility Considerations

- **Focus management:** Focus stays in the field through a validation error — never moved away from where the user is actively typing.
- **Announcements:** The error message is linked via `aria-describedby` and announced via an `aria-live="polite"` region (a direct result of the user's own submit action, not an unprompted interruption).
- **Progress indication:** Not applicable — single step, no multi-step progress to communicate.
- **Error announcement:** `aria-invalid="true"` on the field while an error is showing; removed once corrected.

### Implementation Target

- **Agent:** `nextjs-senior-engineer` (App Router, Server Actions available if the eventual `/teams/{id}` wiring needs them — matches Task 57's plan).
- **Components needed:** `NumberPlateField`, `ViewTeamButton` (see component specs below).
- **API endpoints:** None — this page calls nothing. Navigation only.

### Acceptance Criteria

- [ ] Numeric, non-empty submit navigates to `/teams/{value}` immediately, via Enter or button.
- [ ] Empty or non-numeric submit shows the specified inline error, does not navigate, preserves input.
- [ ] The split-flap settle plays once on load and is fully skipped under `prefers-reduced-motion`.
- [ ] All contrast pairs match `DESIGN.md`'s recorded ratios.
- [ ] Screen-reader user can identify the field's purpose and submit without sighted assistance.
- [ ] Mobile: plate and button remain full-width, touch targets ≥ 48px height.

---

## Component: NumberPlateField

### Purpose
A single labeled numeric input rendered as a physical signage plate — this page's Signature element and its only field.

### Variants
- `default`: resting state, placeholder digits visible.
- `error`: `danger`-colored border, inline message shown beneath.

### Props

```typescript
interface NumberPlateFieldProps {
  /** Required: current field value */
  value: string;

  /** Required: change handler */
  onChange: (value: string) => void;

  /** Optional: validation error to display. Default: null */
  error?: string | null;

  /** Optional: skip the load-time split-flap animation (testing/storybook). Default: false */
  skipIntroAnimation?: boolean;

  /** Additional class names */
  className?: string;
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Ochre plate (`accent` token), dark `ink` numerals, placeholder `1234567` in a dimmed ink tone | Standard text input, `inputmode="numeric"` |
| Hover | No change — inputs don't need a hover affordance beyond the pointer cursor | n/a |
| Focus | 2px `danger`-safe focus ring in `text` color around the plate (not another ochre, to stay visible against the ochre fill itself) | Focus-visible only, not on mouse click |
| Active (typing) | No separate visual — focus state persists | Standard input behavior |
| Disabled | Not used — no condition on this page disables the field | n/a |
| Loading | Not used — no network wait exists in this flow | n/a |
| Error | Plate border becomes `danger`; a `danger`-colored, icon-paired message appears directly beneath, linked via `aria-describedby` | `aria-invalid="true"` while showing |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width within the page's side gutter; plate height stays 56px (larger than the plan-B run's 48px, since the plate is this page's one focal object and can afford more presence) |
| Tablet (640-1024px) | Same full-width treatment, centered within a 24rem max-width column |
| Desktop (>1024px) | Same as tablet — this page has one job at every size, no restructuring needed |

### Accessibility

**ARIA:**
- Role: native `<input>`, no custom role needed.
- aria-label: not needed — a visible, associated `<label>` covers it.
- aria-describedby: points to the hint element always, and additionally the error element when one is showing (space-separated).
- aria-invalid: `true` only while an error is displayed.

**Keyboard Navigation:**
| Key | Action |
|-----|--------|
| Tab | Receives focus after any preceding content (there is none — first focusable element on the page) |
| Enter | Submits (same handler as the button) |
| Escape | No dismissal behavior — not a dismissible component |

**Screen Reader:**
- Announces: label ("Team ID"), then the hint via `aria-describedby`.
- State changes: error message announced via `aria-live="polite"` when it appears.
- Live regions: `aria-live="polite"` on the error container only.

### Animations

| Trigger | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page load (Signature) | Split-flap digit cycle on the placeholder, settling to rest | 500ms (`emphasis`) | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Error appears | Border color transition only — no motion beyond the color change | 150ms | ease-in-out |
| Focus | Ring fade-in | 120ms (`fast`) | ease-out |

`prefers-reduced-motion`: the load animation is skipped entirely (plate renders at rest immediately) — not shortened, skipped.

### Composition

**Slots/Children:** None — a self-contained field, no children/slots needed at this scope.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Extremely long numeric paste | Field has no hard max-length in the UI layer — Task 58's real validation is the actual gate; this field only checks shape (all-digit), not length |
| Non-Latin numerals pasted | Treated as non-numeric by the shape check — same error as any other non-digit input |
| Missing required data | Not applicable — the field has no external data dependency, it's a plain controlled input |

### Dependencies

- **Required libraries:** none beyond React/Next.js itself for the animation (a CSS-only keyframe animation is sufficient for the split-flap effect — no animation library needed for one motion).
- **Peer components:** none — used standalone with `ViewTeamButton`.
- **Context requirements:** none.

### Implementation Notes

**Performance:** Trivial — single controlled input, no memoization needed at this scale.

**Testing:**
- Numeric submit navigates correctly.
- Non-numeric/empty submit shows the correct message and does not navigate.
- `prefers-reduced-motion` genuinely skips the intro animation (test via the media query, not just a shorter duration).

### Implementation Target

- **Agent:** `nextjs-senior-engineer`.
- **Framework notes:** Client component (`"use client"`) — needs interactivity (controlled input, submit handler, animation).
- **File location:** `apps/web/src/components/number-plate-field.tsx`.

### Acceptance Criteria

- [ ] Renders both variants (default, error) correctly.
- [ ] All states visually distinct per the table above.
- [ ] Keyboard path fully documented and functional.
- [ ] Screen reader announces label, hint, and error appropriately.
- [ ] Responsive at all three breakpoints (no behavior actually changes, confirmed deliberately, not by omission).
- [ ] Split-flap animation smooth, and provably skipped under `prefers-reduced-motion`.
- [ ] Props validated with TypeScript.

---

## Component: ViewTeamButton

### Purpose
The page's single submit action — a plain, literal button, not part of the Signature (per the lock rule: spend boldness in one place only).

### Variants
- `default`: the only variant this page needs.

### Props

```typescript
interface ViewTeamButtonProps {
  /** Click handler — same logic path as the field's Enter-key submit */
  onClick: () => void;

  /** Additional class names */
  className?: string;
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | `text`-on-`surface` styling — deliberately NOT ochre, so the plate remains the only saturated element on the page | Standard button |
| Hover | Surface lightens slightly (~6%) | n/a |
| Focus | 2px `text`-colored ring | Space/Enter activates |
| Active | Surface darkens slightly (~8%) on press | Standard tap feedback |
| Disabled | Not used — same anti-pattern reasoning as the field: never disable without explanation, let the field's own validation handle invalid input |
| Loading | Not used — navigation is instant client-side routing |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width, 56px height to match the plate |
| Tablet (640-1024px) | Same, within the centered column |
| Desktop (>1024px) | Same |

### Accessibility

**ARIA:** Native `<button>`, no custom role needed. Label is its own visible text ("View team") — no separate `aria-label` required.

**Keyboard Navigation:**
| Key | Action |
|-----|--------|
| Tab | Receives focus after the field |
| Enter / Space | Activates |

**Screen Reader:** Announces "View team, button."

### Animations

| Trigger | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Hover/Active | Background color transition only | 120ms (`fast`) | ease-out |

### Composition

**Slots/Children:** `children` — the literal button label text, no icon slot needed at this scope.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Double-click/double-tap | Since navigation is synchronous client-side routing, a second click during the (near-instantaneous) transition is a non-issue — no debounce needed |

### Dependencies

- **Required libraries:** none.
- **Peer components:** reads the same value/validation state as `NumberPlateField`.
- **Context requirements:** none.

### Implementation Target

- **Agent:** `nextjs-senior-engineer`.
- **Framework notes:** Can be a plain server-rendered element with a client-side handler wired at the parent (the page itself is the client component boundary).
- **File location:** `apps/web/src/components/view-team-button.tsx`.

### Acceptance Criteria

- [ ] Deliberately unstyled with the accent color — confirmed the plate is the page's only saturated element.
- [ ] Keyboard and screen reader behavior match the table above.
- [ ] Responsive at all breakpoints.

---

## Design Pre-Flight Gate

**Identity lock**
- [x] Every value in this spec traces to `DESIGN.md` — no off-system values introduced.
- [x] One accent (the plate ochre), one radius scale, one type pairing (Oswald/Work Sans), one icon-family decision deferred (no icons used on this page except the inline error glyph, which is a single inline SVG, not a library — flagged for later phases to lock a real icon family before a second icon appears).
- [x] Identity-lock holds — nothing else exists yet to compare against, but the spec is written so a second screen would bind to the same tokens.
- [x] N/A — first feature spec in this project; no prior `DESIGN.md` to have re-read.

**Anti-slop**
- [x] 0 banned fonts (Oswald/Work Sans/JetBrains Mono are not on the reflex-default or reflex-characterful lists).
- [x] 0 banned color clichés — no purple/blue glow, no cream/sand background (the warm off-white is text on a dark ground, not a body background), no gradient text.
- [x] 0 banned layout patterns — single field, no cards at all, no eyebrow numbering.
- [x] 0 buzzwords, 0 fake names, 0 fake-precise numbers, 0 em-dashes in visible copy (checked both error messages and the label/hint — none present).
- [x] Slop test: a signage-plate number field with a split-flap settle is not the generic answer for "sports data app" — passes.
- [x] Counterfactual test: explicitly checked against this project's own prior TradingView-dark-dashboard run and diverged on purpose — passes.
- [x] Signature present (the number plate) and directly embodies the sports/signage brief.
- [x] No inspiration links were given, so no cloning risk; the two named references (TradingView, scoreboards) are explicitly synthesized, not inherited wholesale (see Inspiration section).

**State & flow coverage**
- [x] Loading/empty/error specced for both components — loading and disabled are explicitly "not used" with stated reasoning, not silently omitted.
- [x] Edge cases covered (refresh, offline, long paste, non-Latin numerals) where relevant to this page's actual scope; several are correctly marked not-applicable with reasoning rather than padded out.

**Accessibility**
- [x] Contrast ratios listed and pass AA/AAA (see `DESIGN.md` table) — all computed via the WCAG luminance formula, not assumed.
- [x] Visible keyboard focus specified for both components; full keyboard path documented (Tab → field → Tab → button, Enter submits from either).
- [x] `prefers-reduced-motion` handled — the Signature is fully skipped, not shortened; motion is motivated (stated in one sentence: "the way a mechanical scoreboard settles on a value").
- [x] ARIA specified for the non-trivial component (`NumberPlateField`'s aria-describedby/aria-invalid/aria-live).
- [x] Touch targets: 56px height specced for both field and button — exceeds the 48dp/44pt minimums.

**Layout craft**
- [ ] ≥3 distinct layout families — **not applicable at this page's scope** (one field, one button; a single-purpose page has no multi-section layout to vary). Noting this honestly rather than forcing artificial sections to satisfy a multi-section-page checklist item that doesn't fit a one-field page.
- [x] Clear hierarchy, deliberate whitespace, one focal point (the plate).

**Cognitive load**
- [x] One field, one action — trivially under every stated ceiling.
- [x] Exactly one primary action ("View team"); no secondary actions exist to subordinate.

## Scored Self-Critique

| Axis | Score (0-4) | Note |
|------|-------------|------|
| Distinctiveness | 4 | The signage-plate direction is a real, brief-specific bet against this project's own prior (more generic) TradingView-dark run |
| Hierarchy & focus | 4 | One field, one focal point, nothing competing |
| Consistency with DESIGN.md | 4 | Every value in the feature spec traces directly to the locked tokens |
| Accessibility | 4 | Computed contrast, full keyboard/ARIA path, motion opt-out that fully skips rather than reduces |
| State/edge coverage | 3 | Solid for this page's real scope, but several rows are legitimately "not applicable" rather than filled — honest, but the template's ambition (loading/offline/analytics) doesn't have much surface to grip on a page this small |
| Copy quality | 4 | Plain, active, no banned tells; matches the "economical colleague" register the project already committed to at the brief stage |
| Restraint | 3 | The plate is a genuinely bold, committed-color move (30-60% territory) rather than a thin restrained accent — a deliberate departure from "restraint" as this project's other pipeline run defined it; scored 3 rather than 4 because commitment-to-boldness and restraint are in real tension here, and that tension is worth surfacing rather than claiming perfect restraint |
| Motion motivation | 4 | One orchestrated moment, explicitly motivated, fully honors reduced-motion |

**Total: 30/32.** No axis ≤ 2 — no revise-and-justify cycle required. The one deliberately-imperfect score (Restraint, 3) is a genuine trade-off of the chosen direction, not an oversight: committing real surface area to the plate is what makes the Signature land, and that has a real cost against pure minimalism.

## Build Handoff

**Implement exactly this spec. Theme shadcn/ui (already installed in `apps/web`) with these locked tokens — do NOT redesign or re-implement Radix's underlying components.**

- **Target agent:** `nextjs-senior-engineer`.
- **Design system:** shadcn/ui / Radix primitives, already initialized in `apps/web` (Task 55) — extend its theme tokens (`globals.css` CSS variables) with the palette/type/radius/motion values locked in `DESIGN.md`. Do not re-run `shadcn init` with different settings; theme the existing installation.
- **Acceptance criteria:** the full acceptance-criteria lists under the Flow and both Component sections above, taken together.
