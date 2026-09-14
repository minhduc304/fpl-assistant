# Design Strategy: apps/web Home Page (Task 56)

## Design Principles

### Precision reads as trust
**The principle:** Every number is monospaced; every value is exact, never approximated or rounded for looks.
**What this means in practice:** Team-ID input, and any figure introduced later, uses tabular/monospace numerals so digits align and nothing is misread.
**What this means we will NOT do:** We will not use proportional/decorative numerals anywhere a real figure appears, even if it "looks nicer" — this is the one rule inherited by every later data-dense page (charts, comparisons).

### The task is the whole page
**The principle:** One field, one action, nothing competing for attention.
**What this means in practice:** No hero copy, no marketing filler, no secondary CTAs. The page's job is "get the ID, go" — full stop.
**What this means we will NOT do:** We will not add explanatory paragraphs, feature teasers, or navigation to pages that don't exist yet just to make the page feel "fuller."

### No feature is worth an extra click
**The principle:** A direct reaction to the official FPL app's 2026 redesign, which added steps to previously fast tasks.
**What this means in practice:** Submit-on-enter, immediate navigation on valid-shaped input, no confirmation dialogs, no intermediate loading screens for a client-side redirect.
**What this means we will NOT do:** We will not gate the redirect behind a server round-trip just to pre-validate the ID — that's Task 58's job, not this page's.

### Restraint over spectacle
**The principle:** The "number is the star" scoreboard accent is a single narrow treatment on the ID field, not a design language.
**What this means in practice:** One deliberate moment of personality (the input field's styling), everything else stays quiet.
**What this means we will NOT do:** We will not add glow effects, team-color theming, or animated flourishes beyond that one field — the moodboard's own "what to leave" note on the scoreboard reference.

### Accessible by construction, not by retrofit
**The principle:** A screen-reader user, a low-vision user, and a non-native English reader must all be able to complete the task without assistance.
**What this means in practice:** Real WCAG AA contrast checked against the actual dark palette (not assumed because it's dark), one clearly-labeled field with a visible `<label>` (not a placeholder standing in for a label), tap target sized for motor-impaired users, plain-language microcopy (no idioms, no jargon like "gameweek" without context on this page).
**What this means we will NOT do:** We will not ship contrast or labeling as a "fix later" item — this is a launch-blocking principle, not a polish pass.

## Competitive Position

| Reference | Strengths | Weaknesses | Accessibility | Differentiation Opportunity |
|-----------|-----------|------------|---------------|------------------------------|
| Official FPL app (2026 redesign) | Modern visual polish, broad brand recognition | Added friction to simple tasks post-redesign — "what used to take seconds now takes ten clicks" | Unknown/unverified | Be measurably faster for the one task this page does: ID in, team page out, no extra steps |
| Third-party FPL tools (LiveFPL, Fantasy Football Scout-style sites) | Fast, data-dense, built by/for power users | Often visually inconsistent, ad-heavy, no real design system | Generally unaudited | Same data-density instincts, but with an actual accessible, consistent design system from page one |

Not a market-launch positioning exercise — this is an internal feature of a personal/hobby tool. The "competition" that matters is the user's own patience: this page has to beat the feeling of friction the official app introduced, not out-market a rival product.

## Experience Map

1. **Entry point:** Direct URL or bookmark — no referral/search funnel exists yet (no other pages built). User arrives with clear intent already.
2. **First impression (first 5 seconds):** Dark, quiet page. One labeled field styled with the scoreboard-esque numeral treatment, one button. Nothing else competes for attention.
3. **Core journey:** Type team ID → submit (click or Enter) → client-side navigate to `/teams/[teamId]`.
4. **Moments of friction:**
   - User doesn't know their own team ID / where to find it → needs a short, plain-language hint near the field (not a paragraph).
   - Non-numeric or empty input → inline feedback before submit attempt, not a failed navigation.
   - Screen-reader user needs the field's purpose and expected format announced, not inferred from placeholder text alone.
5. **Exit point:** Successful navigation to `/teams/[teamId]` (placeholder/404 acceptable until Task 58 ships) — the "exit" from this page is the intended success state, not an abandonment.

## Success Metrics

| Metric | What It Measures | Target | How to Measure |
|--------|-------------------|--------|-----------------|
| Time to submit | Speed of the core task | Sub-5-second typical completion for a returning user who knows their ID | Manual timing during Task 56 QA |
| Steps to navigate | Friction vs. the official-app cautionary reference | 1 field + 1 action, zero intermediate screens | Direct inspection of the built flow |
| Contrast compliance | Accessibility of the dark palette | WCAG AA minimum on all text/field states | Automated contrast check (e.g. axe/Lighthouse) against final tokens |
| Screen-reader task completion | Whether principle 5 actually holds | User can identify field purpose and submit without sighted assistance | Manual screen-reader walkthrough (VoiceOver/NVDA) before shipping |

## Constraints and Trade-offs

- **Not optimizing for:** first-time-user education (no onboarding, no tooltip tour) — the target user already knows their own team ID and what FPL is.
- **Not optimizing for:** localization/i18n — real future consideration given the international audience, explicitly deferred out of MVP scope.
- **Not optimizing for:** visual richness/branding flourish — trading that off deliberately for the "task is the whole page" principle.
- **Trade-off accepted:** deferring all server-side ID validation to Task 58 means this page cannot tell a user their ID was wrong before navigating — accepted because pre-validating here would duplicate logic that doesn't exist yet and couple this page to a contract it doesn't need.
