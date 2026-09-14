# Content: apps/web Home Page (Task 56)

Executes Plan Task 5. Finalizes every string on the page — no marketing filler, no hero copy, per strategy principle #2 ("the task is the whole page") and the taste profile's "economical colleague" personality.

## Final Strings

| Element | Draft (from interaction-design) | Final | Why changed |
|---------|-----------------------------------|-------|-------------|
| H1 | — | **FPL Assistant** | Names the page; not decorative, satisfies "one H1 per page describing purpose" with no other content to name it |
| Label | "Team ID" | **Team ID** | Already plain, active, specific — kept as-is |
| Hint (always visible below field) | "Find it in the FPL app or site, in your team's URL." | **"Look in your team's page address on the FPL website or app — the number there is your ID."** | Original was serviceable but terse to the point of vague ("in your team's URL" assumes the reader already knows what to look for in it); final version tells the reader what to look *for*, not just where to look |
| Placeholder (format hint, not a label substitute) | "1234567" | **1234567** | Kept — a concrete numeric example is more useful than a generic "Enter ID" placeholder, and it is never the field's only label |
| Button | "View team" | **View team** | Already specific and active ("Submit" or "Go" would be vaguer) — kept as-is |
| Error — empty submit | "Team ID is required. Enter your FPL team ID to continue." | **"Enter your team ID to continue."** | Draft's "is required" is passive/formal-register filler; the shorter version states the same thing in active voice and is the full what-happened+what-to-do in one clause, since the field being empty is self-evident from context |
| Error — non-numeric | "Team ID must be numbers only. You'll find it in your team's URL on the FPL site or app." | **"Team ID must be numbers only, like 1234567."** | Draft repeated the always-visible hint's "where to find it" — redundant clutter once both are on screen together. A concrete example ("like 1234567") is more actionable than repeating location guidance the user has already read |

## Reading Level and Translatability Check (Step 8)

- No idioms, no cultural references — "look in your team's page address" and "numbers only" translate literally without loss of meaning, unlike phrases such as "just pop in your ID."
- Every sentence carries one idea; none use "and" to chain two instructions.
- Active voice throughout ("Look in...", "Enter...", "Team ID must be...") — no passive constructions like "your team ID is required."
- No exclamation marks, no emoji, no "Let's find your team!" — matches the taste profile's economical-colleague personality target exactly.
- Reading level: every sentence is short, common-word, single-clause — comfortably within the reading-age-12-14 target for an international, non-native-English-reading audience.

## Accessibility Wiring (content-to-markup mapping — implementation detail for the actual build)

- `<label for="team-id">Team ID</label>` — visible, programmatically associated; the placeholder is supplementary, never a label substitute.
- The hint text and the error message (when present) are both linked via `aria-describedby` on the input, space-separated (`aria-describedby="team-id-hint team-id-error"`) — a screen reader user hears both the persistent hint and the error when one is showing, not just one or the other.
- The input carries `aria-invalid="true"` only while the error is displayed; removed once the value is corrected.
- The error element gets an accessible-name role that gets announced on appearance — an `aria-live="polite"` region is sufficient here (not `assertive`) since the error appears as a direct result of the user's own submit action, not an unprompted interruption; `assertive` is reserved for state changes the user didn't just trigger themselves.

## No Copy Needed For

Per interaction-design's handoff: no disabled, loading, or success-state copy — none of those states exist on this page by design (disabled buttons without explanation are an anti-pattern we're avoiding; navigation is instant so there's no wait to narrate; successful submission is leaving the page, which needs no message of its own).
