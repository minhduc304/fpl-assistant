---
project: FPL Assistant (apps/web)
register: product
aesthetic_direction: industrial / signage
color_strategy: committed
design_system: shadcn/ui (Radix primitives) — already installed in apps/web (Task 55)
design_variance: 6
motion_intensity: 3
visual_density: 3
---

## Design Read

A stadium ops board, not a trading terminal — precision you can read from the stands, not the desk.

**The bet:** every other "data-trustworthy sports app" reaches for the same dark-fintech-dashboard cliché (this project's own prior pipeline run included). Signage — scoreboards, matchday number boards, kit-numbering plates — is the sport's own visual language, native to the domain instead of borrowed from finance. Counterfactual check: a generic "trustworthy data app" brief would not reach for a physical signage plate as its hero device — this is brief-specific, not a default.

## Signature

**The number plate.** The team-ID field is rendered as a physical signage plate — a solid, saturated amber-ochre card with dark ink numerals, exactly like a stadium seat-number or matchday squad-number plate bolted to a rail. On load, the plate's placeholder digits do one motivated split-flap cycle (the way a mechanical scoreboard or airport departure board settles on a value) before resting — a single orchestrated moment, not decoration. Everything else on the page stays quiet: one plate, one motion, nothing competing with it.

## Inspiration

No links were provided (the `browse` skill dependency is unavailable in this environment). Working from the same reference *descriptions* gathered independently for this project's home page, but reaching for different DNA than the prior pipeline run:

- **TradingView (description only):** took: the discipline of tabular/monospace numerals for data-scanning accuracy. rejected: the dark-fintech-terminal visual language itself — that's the generic "data-trustworthy" default for this category, and this project's own prior spec run already went there; picking the same look twice would fail the counterfactual test for a *second* independent run.
- **Sports broadcast scoreboards (description only):** took: treating a number as a literal physical object with its own plate/board identity, not just large type. rejected: broadcast chrome (tickers, channel bugs) — not relevant to a web form.
- **Official FPL app's 2026 redesign (cautionary, description only):** took nothing visual; rejected the same lesson the other run took — polish must never add friction to a fast task.

Synthesis note: the signature (a physical signage plate with a split-flap settle) does not clone any single reference — it's a domain-native invention built from "numerals as data" (TradingView's discipline) crossed with "numbers as physical objects" (scoreboards' identity), landing somewhere neither reference occupies alone.

## Color (locked)

Committed strategy: one saturated ochre carries real surface weight (the plate itself, not a thin accent line) — 30-60% territory when the plate is on screen, deliberately heavier than a "restrained accent used once" approach. Neutrals tinted warm (toward the ochre hue) rather than pure gray, per the tinted-neutral rule.

| role | OKLCH (approx.) | hex | use |
|------|------|-----|-----|
| background | oklch(0.16 0.02 70) | `#1A140C` | Page ground — warm charcoal, tinted toward the ochre hue, not pure black |
| surface / elevated | oklch(0.21 0.02 70) | `#241C10` | Any raised element other than the plate itself |
| text | oklch(0.95 0.01 70) | `#F3EBDD` | Body/label text on the dark ground — warm-tinted off-white |
| muted | oklch(0.72 0.015 70) | `#B8A98F` | Hint text, secondary copy |
| accent — the plate (exactly one) | oklch(0.72 0.15 70) | `#E8A33D` | The signage-plate fill — the one committed, saturated color in the system |
| ink (numerals on the plate) | oklch(0.18 0.02 70) | `#241206` | Dark ink for numerals set directly on the accent plate |
| danger | oklch(0.62 0.15 25) | `#D9634A` | Inline error state |
| success | oklch(0.68 0.11 120) | `#8FAE5C` | Reserved for later phases; not used on this page |
| info | oklch(0.65 0.06 230) | `#6C8FA8` | Reserved for later phases; deliberately the one cool-hue outlier — not used on this page |

**Contrast — computed via WCAG relative luminance, recorded:**

| pairing | ratio | requirement | result |
|---------|-------|-------------|--------|
| text `#F3EBDD` on background `#1A140C` | 15.43:1 | 4.5:1 (AA) | AAA |
| muted `#B8A98F` on background `#1A140C` | 7.93:1 | 4.5:1 (AA) | AAA |
| ink `#241206` on plate `#E8A33D` | 8.36:1 | 4.5:1 (AA) | AAA — numerals on the plate itself |
| plate `#E8A33D` on background `#1A140C` | 8.47:1 | 3:1 (UI component) | Passes with wide margin |

`danger`/`success`/`info` inherit the same warm chroma discipline as the rest of the palette (`success`/`info` are speced now for system completeness per the token method's "define semantic states" step, but only `danger` is actually used on this single-page scope — `success`/`info` carry no contrast obligation here since nothing on this page renders them).

## Type (locked)

Paired on a contrast axis: condensed industrial display vs. humanist body — not a reflex default in either direction (Oswald is not on the banned-reflex list; Work Sans is a humanist choice, not the banned Inter/Roboto/Arial/system-ui set).

| role | family | use | notes |
|------|--------|-----|-------|
| display | Oswald | The plate's numerals, the page's single heading | Condensed grotesque — genuinely from the signage/kit-numbering vocabulary, not a generic "characterful" pick; tracking floor ≈ -0.01em at the plate's large size |
| body | Work Sans | Labels, hints, body copy | Humanist, quiet, readable — contrasts against Oswald's condensed geometry |
| utility / mono | JetBrains Mono | Reserved for later phases (tabular data, stats) | Not used on this single-field page; specced now so later phases inherit one locked utility face rather than improvising |

Body measure: not applicable at this page's scope (no paragraph-length copy — hint text is a single short line, well under 65-75ch).

## Scales (locked)

- **Spacing:** 4px base rhythm — `0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`.
- **Radius:** `{ sm: 2, md: 4, lg: 8, xl: 12, full: 9999 }` — sharper, more squared-off than a typical soft-UI default, matching the physical-plate/signage metaphor (real signage has crisp corners, not bubble-rounded ones).
- **Shadow:** minimal by default; the plate gets exactly one **hard, flat, low-blur offset shadow** (`2px 2px 0 rgba(0,0,0,0.35)`, no soft ambient blur) — motivated as "a plate mounted on a rail," not a floating card. Nothing else in the system uses a shadow.
- **Motion:** durations `fast 120ms · base 300ms · emphasis 500ms`; easing `cubic-bezier(0.16, 1, 0.3, 1)`; no bounce/elastic. The Signature's split-flap settle runs once at `emphasis` (500ms) on load; `prefers-reduced-motion` swaps it for an instant, un-animated resting state — no flap cycle plays at all, not just a faster one.
- **Z-index:** `base 0, dropdown 20, sticky 30, fixed 40, modalBackdrop 45, modal 50, popover/tooltip 60, toast 70, skipLink 80` (standard scale, no identity carried here — not exercised on this single-page scope).
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

## Voice

**Register:** plain, confident, unhurried — the voice of someone reading out a scoreboard number, not selling you on it. **Action vocabulary:** "View team" (button) stays literal through the whole flow — never becomes "Submit," "Go," or "Continue" elsewhere in the app once other pages exist.

---

*Every screen must read as the same product if placed side by side.*
