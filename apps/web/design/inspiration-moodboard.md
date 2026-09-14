# Inspiration Moodboard — apps/web home page (Task 56)

Produced by the `inspiration-scouting` skill, 2026-09-13. Covers the home page (team-ID entry form) and, since it's the first real page of the app, sets a throughline for later phases.

## Inspiration Brief

- **Project:** FPL Assistant home page — team-ID entry form, first page of the app, sets tone for everything downstream
- **Feel we're going for:** confident, precise, data-trustworthy
- **Feel we're avoiding:** cluttered, gimmicky, generic SaaS-template
- **Domain:** fantasy football / sports data dashboard
- **Cross-domain openness:** adjacent (trading/finance dashboards, sports broadcast graphics)
- **Specific needs:** single-field entry form as a strong first impression, not a throwaway login-box look

## Moodboard

### TradingView (via Rondesignlab redesign case study)
- **Source:** [Trading Dashboard Design: Scaling TradingView UI/UX for Traders](https://rondesignlab.com/cases/tradingview-platform-for-traders)
- **Why it's relevant:** Cross-domain, same problem class — a trustworthy first screen for a data-serious tool.
- **What to take:** Monospaced numerals for anything that's a stat/figure (prevents misreading `1,234.56`); dark theme with layered grays for depth rather than flat black; desaturated semantic color (they cut green/red saturation ~18% to reduce eye strain on long sessions) — directly reusable for a squad-value/points-heavy app people check daily.
- **What to leave:** Full trading-terminal density — our home page is one field, not a multi-panel terminal.
- **Layer:** Visual

### Linear
- **Source:** Cited repeatedly across SaaS landing-page roundups (e.g. [50 Best Landing Page Examples for SaaS in 2026](https://arounda.agency/blog/landing-page-examples)) as the benchmark for "minimal single-input, dark, feels premium without saying a word."
- **Why it's relevant:** Same shape of first-screen problem — one field, one CTA, no clutter.
- **What to take:** One field, one CTA, bold restrained typography carrying the whole page — no hero illustration doing the talking instead.
- **What to leave:** Linear sells itself as a brand/marketing page; our home page's whole job is functional (get the team ID, go), so skip marketing copy entirely.
- **Layer:** Visual

### Kajabi / Shopify-style single-field forms
- **Source:** SaaS landing-page pattern, cross-source-confirmed (same roundup as above).
- **Why it's relevant:** The "one field, repeated CTA, zero friction" pattern maps exactly onto the team-ID form.
- **What to take:** Validate, don't over-explain — minimize fields and friction.
- **What to leave:** Their field is an email signup with account-creation weight behind it; ours is a lookup, so the tone should read lighter/faster, not "sign up."
- **Layer:** Interaction

### Official FPL app's 2026 redesign (cautionary reference)
- **Source:** [Is the new Fantasy Premier League app a lesson in how not to redesign?](https://medium.com/@ragesh-changam/is-the-new-fantasy-premier-league-app-a-lesson-in-how-not-to-redesign-07b71964602d)
- **Why it's relevant:** Real, sourced example of the exact failure mode to avoid — a modern-looking redesign that added friction ("what used to take seconds now takes ten clicks").
- **What to take:** Nothing visual.
- **What to leave/avoid:** Don't let visual polish add steps to the one task this page has (enter ID, go). This is a "what not to do" reference, not aesthetic inspiration.
- **Layer:** Emotional

### Sports broadcast lower-thirds / scoreboard graphics
- **Source:** General pattern (sports broadcast UI convention), not one product.
- **Why it's relevant:** Sports broadcast UI treats numbers as the hero — big, high-contrast, no decoration competing with the digit itself.
- **What to take:** A team-ID input could borrow that same "the number is the star" treatment rather than looking like a generic text field.
- **What to leave:** Broadcast-specific chrome (channel bugs, tickers) — not relevant to a web form.
- **Layer:** Cross-domain wild card

## Additional Sources Consulted

- [Designing Data-Dense Dashboards: 8 Lessons from Building a Trading Journal](https://pixel-show.com/blog/designing-data-dense-dashboards)

## Status

Not yet reacted to by the user (Step 6 of `inspiration-scouting` — refine based on response — has not run). Next: feed this board into `frontend-design-ui-ux`'s Step 1 (Inspiration intake) as the source for its `DESIGN.md` identity lock, or run more of the `designpowers` suite (`design-taste` → `ui-composition`/`token-architecture` → review chain) if that pipeline is preferred instead.
