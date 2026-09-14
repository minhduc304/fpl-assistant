# Interaction Design: apps/web Home Page (Task 56)

Executes Plan Task 4 (docs/designpowers/plans/2026-09-13-web-home-page-plan.md): submit interaction, "no extra click." Closes the open item from ui-composition — `--error`'s exact contrast, now that its visual treatment is settled.

## `--error` Contrast — closing the open item

Treatment settled in the ui-composition artifact: `--error` (`#C97066`) text + icon on `--error-dim` (14% `--error` composited over `--background`, resolving to approx. `#261C1F`).

Computed via the same WCAG relative-luminance method as the other tokens:

| Pairing | Ratio | Requirement | Result |
|---------|-------|-------------|--------|
| `--error` text/icon on `--error-dim` | **4.72:1** | 4.5:1 (AA, normal text) | Passes AA — narrowly. Do not lighten the dim background further or darken the error text; there's little headroom left. |

This is the only token in the palette that passes by a small margin rather than comfortably — noted explicitly so a future redesign pass doesn't casually adjust `--error-dim`'s opacity without re-checking.

## State Map — Team ID Input

| State | Visual | Screen Reader | Keyboard | Touch |
|-------|--------|----------------|----------|-------|
| Default | `--surface` fill, `--border-strong` 1px border, `--faint` placeholder text | Label "Team ID" announced on focus; placeholder read as a hint, not a substitute for the label | Reachable via Tab | Tap focuses and opens numeric keypad (`inputmode="numeric"`) |
| Hover | No visual change (inputs don't need a hover affordance beyond the cursor) | n/a | n/a | n/a |
| Focus | 2px `--accent` outline, `--accent` border (per ui-composition's already-specced focus ring) | Label + current value announced | Focus-visible outline only shows for keyboard/programmatic focus, not mouse click, per `:focus-visible` | n/a |
| Active/typing | No separate active state — focus state persists while typing | Screen reader announces each character per platform default (not a custom live region — would be overly verbose) | Standard text input behaviour | Standard |
| Error | `--error` border replaces `--border-strong`; inline message appears below field (text + icon, `--error`/`--error-dim`, 4.72:1 — see above) | Message linked via `aria-describedby`; field gets `aria-invalid="true"` while the error is showing | Focus does not move automatically (the user is already in the field when the error becomes relevant, i.e. on submit attempt) | Same visual/ARIA changes apply |
| Disabled | Not applicable — this page has no condition under which the field should be disabled | — | — | — |
| Loading | Not applicable — navigation is a client-side route change with no network wait; introducing a loading state here would contradict strategy principle #3 ("no feature is worth an extra click") by adding a visual step to something that should feel instant | — | — | — |
| Success | Not applicable as a distinct state — successful submission *is* the navigation to `/teams/[teamId]`; there is nothing to show on this page after that point | — | — | — |

## State Map — "View team" Button

| State | Visual | Screen Reader | Keyboard | Touch |
|-------|--------|----------------|----------|-------|
| Default | `--accent` fill, dark text (`#08211D`, already specced) | "View team, button" | Reachable via Tab after the input | 48px height, full-width tap target |
| Hover | Slight fill darken (~8%) — a visual affordance without relying on colour alone, since the cursor change already signals interactivity | n/a | n/a | n/a |
| Focus | 2px `--foreground`-colored outline (distinct from the accent-colored input focus ring, since the button's own fill is already accent-colored — an accent-on-accent ring would fail the 3:1 UI-component contrast requirement against its own background) | "View team, button" | Space/Enter activates | n/a |
| Active/Pressed | Fill darkens further (~14%) on `:active` | n/a | n/a | Standard tap feedback |
| Disabled | Not applicable — the button is always clickable; invalid input is handled by the inline error on submit attempt, not by disabling the button pre-emptively (a disabled button with no explanation is a known accessibility anti-pattern — better to let the user attempt and explain why it failed) | — | — | — |

## Submit Interaction — Step by Step

**Trigger:** Enter key while the input is focused, or a click/tap/Space-Enter on the "View team" button. Both paths call the same handler — no divergent logic between them.

**Behaviour:**
1. Read the current input value.
2. If empty or contains any non-digit character: show the inline error (see Error Messages below), set `aria-invalid="true"` on the input, do not navigate. The user's typed input is preserved (never cleared on error).
3. If numeric and non-empty: navigate client-side to `/teams/{value}` immediately. No confirmation dialog, no server round-trip to pre-validate the ID (Task 58 owns real existence-validation and its own error/404 state) — per strategy principle #3.

**Feedback timing:** This interaction has no meaningful "short wait" or "long wait" state — client-side routing is effectively instant. Per Step 4's guidance, an interaction under 100ms only needs a visual state change (the button's `:active` press state), not a loading indicator. Inventing a spinner or skeleton here would be manufacturing a wait that doesn't exist, directly against strategy principle #3.

## Error Messages

Format: **[what happened] + [what to do]**, per this skill's own rule — not "Error: invalid input."

| Condition | Message |
|-----------|---------|
| Empty submit | "Team ID is required. Enter your FPL team ID to continue." |
| Non-numeric input | "Team ID must be numbers only. You'll find it in your team's URL on the FPL site or app." |

Both messages are announced to screen readers via `aria-describedby` linking the input to the message element, and the input carries `aria-invalid="true"` while an error is showing — colour (`--error`) and the icon are reinforcement, never the sole signal, per this skill's red-flag rule.

## Animation and Motion

No animation is specified for this interaction. Per Step 4's own guidance ("animations serve a purpose or they serve nobody"): there is no relationship between elements to show, no spatial transition to orient the user through, and adding a transition to something that should feel instant would work against strategy principle #3. The only transitions in scope are the near-instant (~100-150ms) colour/border changes on focus, hover, and error state — well under the threshold where `prefers-reduced-motion` handling would even be observable, but implemented as simple property transitions (not JS-driven animation) so they inherit the browser's reduced-motion behaviour for free.

## Gesture and Input

No custom gestures — standard text input and standard button activation only. `inputmode="numeric"` improves the on-screen keyboard on touch devices without restricting keyboard/paste input, so no alternative input path is needed.
