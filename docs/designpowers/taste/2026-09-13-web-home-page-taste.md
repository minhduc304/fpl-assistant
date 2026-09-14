# Taste Profile: apps/web Home Page (Task 56)

## Existing Design System

Only `shadcn/ui` init exists (Task 55): Radix base, Nova preset (Lucide icons, Geist-adjacent type), Tailwind v4 tokens, neutral base color — chosen as scaffold defaults, not a deliberate taste decision. No custom palette, spacing scale, or radius vocabulary has been set yet.

### Taste Signals from the System
- Colour philosophy: neutral base only — undecided, a blank canvas rather than a stated preference.
- Density: shadcn Nova defaults — moderate, not yet tuned to this project's data-dense future.
- Personality: Nova preset is a generic, safe default — explicitly the kind of "counterfactual default" `frontend-design-ui-ux` warns against if left unchanged.
- Typography voice: Geist-family default — clean, neutral, says nothing distinctive yet.

### Where the User Wants to Evolve
Move off the Nova default toward the TradingView/Linear-influenced direction locked at strategy: dark-first, monospace numerals for figures, restrained accent. This is a deliberate departure from the scaffold default, not an extension of it — flagged per `frontend-design-ui-ux`'s own anti-slop test (Task 55's shadcn defaults would fail the "would this be your answer for any similar brief" test).

## Emotional Target

Confident, precise, data-trustworthy. Using this page should feel like checking a well-built instrument panel, not filling out a form — quiet, exact, no wasted motion. The user should feel the app already respects their time before they've even submitted anything.

## Aesthetic Principles

1. **Numerals are structural, not decorative** — every digit (the ID field, and every figure on every later page) renders in a monospace/tabular numeral face.
   _Test: place any two figures side by side — do the digits align column-for-column? If not, fails._

2. **One accent, used once** — the "number is the star" scoreboard treatment is the single moment of visual energy on the page; nothing else competes with it.
   _Test: count distinct visual accents (color pops, borders, weight jumps) outside the ID field. Anything beyond one fails restraint._

3. **Dark is a default, not a gimmick** — the dark theme exists because it serves data legibility and matches the TradingView reference, not because dark mode looks trendy.
   _Test: does every dark-mode choice trace back to a legibility or reference rationale? If a choice exists purely because "dark looks cool," fails._

4. **Silence over ornament** — no shadows-for-depth theater, no gradients, no decorative iconography; whitespace and type hierarchy alone carry the page.
   _Test: remove any single visual element — does the page still communicate its one task clearly? If an element exists only for "polish," it's ornament and fails._

## Quality Level

**Production.** Not a throwaway prototype (this sets the identity for 5+ future phases) and not flagship-grade motion/micro-interaction polish (that investment belongs later, once more of the app exists to justify it). Concretely: every token deliberate and reused, real contrast-checked, no placeholder Lorem-ipsum-grade copy — but no bespoke custom animation curves or elaborate loading choreography for a page that's one field and one click.

## References

| Reference | What to borrow | What to avoid |
|-----------|-----------------|----------------|
| TradingView (Rondesignlab case study) | Monospace numerals, layered dark grays (not flat black) for depth, desaturated semantic color to reduce eye strain | Multi-panel terminal density — this page is one field, not a dashboard |
| Linear | One field, one CTA, bold restrained typography carrying the whole page, dark-mode-as-premium-signal | Marketing-page framing (hero copy, brand storytelling) — irrelevant to a functional entry point |
| Sports broadcast scoreboards | Treating a number as the visual hero — big, high-contrast, undecorated | Broadcast chrome (tickers, channel bugs, motion graphics) — not relevant to a web form |

## Anti-References

| Anti-reference | What makes it wrong for us |
|------------------|-------------------------------|
| Official FPL app (2026 redesign) | Modern visual polish that added interaction friction — proof that looking good and being fast are not the same achievement; this page must not repeat that trade |
| Generic shadcn Nova default (unmodified) | The exact "counterfactual default" trap — if we shipped Task 55's scaffold styling untouched, it would look like every other shadcn starter, telling the user nothing about this specific product |

_Not asked directly of the user: a personal anti-reference beyond the official-app case, and an explicit "if this product were a person" personality sketch. Both would sharpen this profile further — flagging as an open item for user validation below rather than inventing an answer._

## Craft Standards

- **Shadows:** none by default; if depth is ever needed (e.g. a focused input state), one soft ambient shadow only — no dual-layer shadow systems at this quality level.
- **Borders:** thin, low-opacity (matches the "layered grays" TradingView take) rather than solid high-contrast lines.
- **Radius:** small and consistent — one radius value for the input/button, not a mixed vocabulary (this page has too few components to justify a multi-tier radius scale yet; later phases can extend it).
- **Colour usage:** neutral dark base, one restrained accent color reserved for the ID field treatment only; semantic colors (if any appear later) desaturated per the TradingView reference.
- **Typography pairing:** one monospace face for numerals/figures, one clean sans for labels/copy — two faces total, no third "display" face.
- **Whitespace:** generous — the page has one job, let it breathe rather than crowding the field with supporting content.
- **Animation:** minimal — a subtle focus/hover state on the field and button is enough; no page-load choreography at Production quality level.

## Personality

Not explicitly sketched with the user yet (see Anti-References note above). Provisional read, to validate: if this page were a person, they'd be the colleague who answers your question in one precise sentence and gets back to work — not unfriendly, just economical. Speaks in plain language, no exclamation marks, no filler ("Enter your team ID" not "Let's find your team! 🎉").
