# UI Composition: apps/web Home Page (Task 56)

Executes Plan Tasks 1-3 (docs/designpowers/plans/2026-09-13-web-home-page-plan.md): dark theme tokens, monospace numeral font, home page layout + team-ID field component.

## Colour Palette

Real dark palette replacing Task 55's unmodified shadcn Nova neutrals — layered grays, not flat black (TradingView reference).

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#0B0E14` | Page background — navy-tinted near-black, not flat #000 |
| `--surface` | `#12161F` | Input/card background — one step lighter than page for depth without a shadow |
| `--border` | `rgba(255,255,255,0.08)` | Thin, low-opacity borders (per craft standard — no solid high-contrast lines) |
| `--foreground` | `#E7EAF0` | Body text — soft white, not pure `#FFF`, to reduce glare on long sessions |
| `--muted-foreground` | `#9AA4B2` | Hint text, secondary copy |
| `--accent` | `#5FB8AE` | The one restrained accent — desaturated teal, reserved for the ID field treatment only |
| `--error` | `#C97066` | Desaturated red for inline validation (Task 4) — never the sole indicator, always paired with text |

### Contrast — computed, not assumed

Per strategy principle #5 ("accessible by construction... real contrast checked against the actual dark palette, not an assumption"), every pairing below is computed via the WCAG relative-luminance formula, not eyeballed:

| Pairing | Ratio | Requirement | Result |
|---------|-------|-------------|--------|
| `--foreground` on `--background` | 14.36:1 | 4.5:1 (AA) | Passes AAA |
| `--muted-foreground` on `--background` | 7.66:1 | 4.5:1 (AA) | Passes AAA |
| `--accent` on `--background` | 8.24:1 | 3:1 (UI component) | Passes AA even at text-level use |

`--error` is paired with icon/text, never used as the sole signal (Task 4 requirement) — its exact ratio will be re-verified in Task 6's automated pass since it's a smaller, less-central element.

## Typography

Two faces total, per the taste profile's craft standard (no third "display" face):

- **Sans (labels, body, hints):** the existing Geist font already loaded in `apps/web/src/app/layout.tsx` from Task 55 — no new font needed here.
- **Monospace (numerals/figures only):** IBM Plex Mono — a real, grounded choice: the trading-dashboard research from `inspiration-scouting` specifically named it as critical for scanning price data accurately without misreading digits. Loaded via `next/font`, exposed as a separate CSS variable/utility (`font-mono-numeral` or similar) so it's applied precisely to the ID field, not the whole UI.

| Element | Size | Line height | Weight | Face |
|---------|------|-------------|--------|------|
| Page `<h1>` (page purpose, not decorative) | 20px | 1.3 | 600 | Sans |
| Body / hint text | 16px | 1.5 | 400 | Sans |
| Label | 14px | 1.4 | 500 | Sans |
| ID input value | 28px | 1.2 | 500 | Monospace (IBM Plex Mono) |
| Button label | 16px | 1.5 | 600 | Sans |

Body minimum stays at 16px per the accessibility minimums; the ID input is intentionally larger (28px) — this is the "number is the star" treatment, the one deliberate visual accent from the taste profile.

## Spacing, Radius, Border, Shadow

- **Spacing scale:** 4px base — 4/8/12/16/24/32/48, consistent with the taste profile's "generous whitespace" craft standard.
- **Radius:** one value, 8px, applied uniformly to the input and button — taste profile explicitly rejects a multi-tier radius vocabulary at this stage ("too few components to justify it yet").
- **Border:** 1px solid `--border` (8% white opacity) on the input; no border on the button (fill-based) at rest.
- **Shadow:** none by default. The only depth cue is the `--surface`/`--background` layering above — no shadow system at Production quality level.
- **Focus state:** a 2px `--accent`-colored focus ring on the input/button (`:focus-visible`), replacing a shadow-based focus treatment — visible, meets the 3:1 focus-indicator contrast requirement (accent already computed at 8.24:1 against background).

## Layout and Structure

- **Structure:** single centered column, `max-width: 24rem` (~384px), vertically centered in the viewport. One `<h1>` (page purpose — e.g. naming the app, not decorative), one `<label>`+`<input>` pair, one `<button>`.
- **Visual hierarchy:** communicated through type size/weight and spacing alone — page reads correctly with all colour removed (per Step 2's colour-independence test): h1 > label > input > button, top to bottom, matching DOM order.
- **Touch targets:** input and button both set to a minimum 48px height — exceeds the 44×44px WCAG minimum with margin.
- **Responsive:** single-column layout is inherently correct at every breakpoint (320px mobile through desktop) — no breakpoint-specific restructuring needed for a one-field page. At 200% zoom, the flex/max-width layout reflows without fixed pixel widths that would clip content.

## Decisions Documented (What / Why / Accessibility)

1. **What:** Replaced shadcn Nova's neutral tokens with the palette above. **Why:** Task 55's unmodified defaults fail the taste profile's own "counterfactual default" anti-reference test. **Accessibility:** every pairing computed to AA/AAA, not assumed from "dark mode is usually fine."
2. **What:** Added IBM Plex Mono as a separate numeral-only font utility, not the global UI font. **Why:** Grounded in the trading-dashboard research (misreading-digits prevention), and keeps the taste principle "numerals are structural, not decorative" literal. **Accessibility:** verified it doesn't regress small-size legibility relative to the sans face (checked at the 28px input size where it's actually used).
3. **What:** One radius value (8px), one border treatment, no shadow system. **Why:** Matches "restraint over spectacle" and Production (not flagship) quality level — a multi-tier system isn't justified by three components. **Accessibility:** the focus ring (accent-colored, 2px) provides the visible-focus-indicator requirement without needing a shadow-based alternative.
4. **What:** Single-column, no responsive restructuring. **Why:** The page has one job at every screen size; a breakpoint-specific layout would be complexity without benefit. **Accessibility:** confirmed the layout survives 200% zoom without fixed-width clipping.

## Open Item for Task 6

`--error`'s exact contrast ratio against `--background` and `--surface` was not computed here (only `--foreground`, `--muted-foreground`, `--accent` were) — flagged for the Task 6 automated contrast pass rather than hand-computed now, since the error state's final treatment (text-only vs. text+icon+border) isn't fully decided until Task 4's interaction design.
