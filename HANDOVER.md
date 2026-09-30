# Handover: The Most Vegetable Vegetable

For the next agent (especially **mobile layout**). Read this before changing UI. This replaces the old “five questions, no backend, JSON recap” notes.

Stack: **Vite 8 + React 19 + JavaScript + CSS**. React Router 7. Neon Postgres. No TypeScript.

Run: `npm install` then `npm run dev` (usually `http://localhost:5173/`). Dev survey shortcut: **Ctrl+Shift+D** on `/survey` (loads `src/data/devSpeedrun.js`, jumps to Q7).

Branch at last wrap: `Database` (results + voting + thank-you). `main` is older (privacy + first DB wrap).

---

## What this product is

A folk-concept questionnaire (not a botanical quiz). Unusual answers are valid. Do not prime Q1 with a vegetable catalogue.

Routes:

| Path | Page |
| --- | --- |
| `/` | Foyer (`src/pages/Home.jsx`) — survey + results links. **Do not spoil results here.** |
| `/survey` | Seven questions + consent + thank-you |
| `/results` | Redirects to `/results/first-instincts`, keeping `?code=` |
| `/results/:categoryId` | Results for one question |

---

## Before merging `Database` → `main`

Not blockers for **local** testing, but check before a public merge:

1. **Production `DATABASE_URL`** on Vercel must point at the same Neon project you use for submits. Schema lives in `server/schema.sql`. Extra columns/tables are also created at runtime (`developer_message` on `responses`, `custom_reason_votes`, `api_rate_limits`).
2. **README.md was stale** (five questions, no server). Keep it aligned with this file.
3. **Results boards are still mock standings** (`src/data/resultsMock.js`, `reasonResults.js`, `spectrumResults.js`, `noteResults.js`). Live Neon rows are used for **survey payloads**, **comment votes**, and **developer notes** — not yet for Q1–Q5 tallies. Do not tell testers that the bars are real global counts.
4. **Cursor preview vs your browser** do not share `localStorage`. Test the “completed survey” path in **one** browser.
5. Optional: `npm run build` and `npm run lint` once on the branch.
6. The two flows below are the right merge tests. Mobile can wait for a separate pass.

Do **not** “fix” these without asking: Q1 no pre-catalogue; never rewrite typed text; thank-you is not a JSON recap; results colours (green leader, tomato least/not-veg, carrot mid, cabbage = your marks); privacy (no IP stored with answers).

---

## How to test (your next two passes)

### A. Results **without** completing a survey

Use a private window or clear site data for `localhost`.

1. Open `/results` (or `/results/first-instincts`).
2. You should **not** see “Your vote” / alignment as if you were the speedrun person.
3. Q2 pills and Q6 notes should **not** be votable (`disabled` / locked).
4. At the **bottom** (under Next category): *Complete the survey to compare your votes with others* plus **Open a ranking code**.
5. On Q2/Q6: *Complete the survey to rate answers.*
6. Pasting someone else’s code (or `?code=<uuid>`) should overlay **their** ranking if that id exists in Neon. It must **not** turn you into them for voting.

### B. Complete survey, then results

Same browser, do not clear storage.

1. `/survey` → consent → all seven questions. Q2 “something else” + public checkbox and Q6 public checkbox control whether **your words** can appear as a flair/pin, not whether the survey saves.
2. Thank-you must show: thanks, **ranking code** + copy, interactive-results copy + **See the results**, optional private **note for the developer**.
3. Code is stored automatically (`localStorage`: `veg-survey-response-id`, `veg-survey-my-answers`). **See the results** should work with no paste.
4. Check each category: Q1 blades, Q2 top-5 + drifting pills, Q3 three columns, Q4 spectrum, Q5 blades, Q6 sticky notes.
5. Your answers should mark **Your vote** / **Your answer** (cabbage/purple flair). Q3 column you sorted into should highlight in the lookup.
6. Q2/Q6 voting: single tap like or clear; hold / right-click / double-tap sink; 5+5 cap; Reset input. Needs a stored response id.
7. Copy the code, then (optional) another browser: paste code → **see** ranking; voting stays locked until that browser has completed a survey.

Speedrun: Ctrl+Shift+D, submit Q7. Open description in the speedrun is public and matches mock note `n01`.

---

## Survey behaviour (do not break)

Orchestrator: `src/components/Questionnaire/Questionnaire.jsx`.

| # | UI | Component | Stored on |
| --- | --- | --- | --- |
| — | Privacy | `PrivacyConsent.jsx` | `processingConsent` |
| 1 | First association | `Question1.jsx` | `initialAssociation` |
| 2 | Why vegetabley | `Question2.jsx` | `initialCriteria`, `customCriterion`, `customCriterionPublic` |
| 3 | Three buckets | `Question3.jsx` | `sortBuckets` |
| 4 | Rank ten items | `Question4.jsx` | `spectrum` (ids, least → most) |
| 5 | Most vegetable | `Question5.jsx` | `mostVegetable` |
| 6 | Free writing | `Question6.jsx` | `openDescription.text`, `publicDisplay` |
| 7 | Place + languages | `Question7.jsx` | `background` — **this POST `/api/responses`** |
| — | Thanks | `ThankYou.jsx` | ranking code; optional POST `/api/developer-message` |

Q1 Back is locked (toast). Q1 cannot be edited later. Browser history does not walk questions (`replaceState`).

Submit: `src/utils/submitResponse.js` → `server/responses.js` → Neon `responses(payload jsonb, public_display, developer_message)`.

Local helpers after submit: `src/utils/myResponse.js`, `myCustomReason.js`, `myOpenNote.js`.

---

## Results behaviour (do not break)

Shell: `src/pages/Results.jsx`.

Category ids (hamburger + `nextCategoryId`):

- `first-instincts` — blades (`RankRail` in `Results.jsx`)
- `why-vegetabley` — `ReasonResults.jsx` (top 5 + marquee pills)
- `sort-buckets` — `BucketColumns.jsx`
- `vegetabley-spectrum` — `SpectrumList.jsx`
- `most-vegetable` — blades again
- `vegetabley-words` — `NoteResults.jsx` (5×4 notes, Reshuffle)

Overlay of “you”: `getSection(id, region, userAnswers)` in `src/data/resultsMock.js` (`overlayCategory`). No local response → empty overlay. `?code=` fetch: `GET /api/responses?id=`.

Map: Q1 and Q4 only (`WorldMap.jsx`). Region filter state lives in `Results.jsx`.

Survey nudge + code card: `SurveyGate.jsx`, rendered in **`.results-survey-foot` under Next**, not in the title.

### Colour language (results only)

Tokens: `:root` in `src/styles/questionnaire.css`, extras on `.results-page` in `src/styles/results.css`.

| Meaning | Colour |
| --- | --- |
| Winner / most-vegetabley / definite veg | Green (`--green`, `--green-soft`, `--green-bright`) |
| Least-vegetabley / not a vegetable | Tomato |
| In-between / Q4 middle band | Carrot |
| **Your** vote, badge, histogram bar, alignment “on the list but not #1” | Cabbage purple (`--cabbage`, `--cabbage-soft`, `--cabbage-bright`) |

Survey UI still uses **green** for selected cards. Do not theme the questionnaire with the results palette.

Q4: least three **blades** have fully red histograms; Your vote bar stays cabbage. Q3: per-column bar/leader tints (tomato / carrot / green).

### Voting (Q2 + Q6)

- Server: `POST /api/reason-votes` with **`responseId`** (must exist in `responses`). Caps 5 like / 5 sink **per family** (`c*` reasons vs `n*` notes).
- Rate limits: `server/rateLimit.js` (hashed IP for submit, per-code for votes). Not stored on the research payload.
- Client SM: `ReasonResults.jsx` / `NoteResults.jsx` — tap, hold 500ms, right-click, double-tap. Layout snapshot frozen until refresh (Q2) or Reshuffle (Q6).
- Reset is **reallocate**, not extra votes; it deletes that visitor’s rows for that family.

---

## Where crucial UI lives

| Surface | Code | Styles |
| --- | --- | --- |
| Home | `src/pages/Home.jsx` | `src/styles/pages.css` |
| Survey chrome, tokens, Q1–Q7, thanks | `src/components/Questionnaire/*` | `src/styles/questionnaire.css` |
| Results chrome, blades, map, buckets, spectrum, notes, pills | `src/pages/Results.jsx`, `src/components/Results/*` | `src/styles/results.css` |
| Shared code card / survey nudge | `SurveyGate.jsx` | mostly `pages.css` (`.survey-nudge`, `.response-code-*`); foot layout in `results.css` (`.results-survey-foot`) |
| Mock data | `src/data/resultsMock.js`, `reasonResults.js`, `spectrumResults.js`, `noteResults.js`, `spectrumVegetables.js` | — |
| APIs | `api/responses.js`, `api/reason-votes.js`, `api/developer-message.js` | Vite plugin mirrors them in `vite.config.js` |

Photos: `src/content/*.jpg` via `VEGETABLE_ART` in `resultsMock.js`. Spectrum copy/trivia: `spectrumVegetables.js` only.

---

## Mobile pass — constraints

Existing breakpoints (extend, don’t fight, unless you unify them on purpose):

- Questionnaire: **720px** (spectrum + Q3 buckets stack), **640px** (nav).
- Home: **640px**.
- Results: **1200px** (notes 4 columns), **900px** (almost everything stacks; notes 2 columns; blades narrower).
- `hover: none` already shows blade arrows; `prefers-reduced-motion` kills blade pulse, drift, puffs, buoyancy.

**Likely pain (test at ~390px and ~768px):**

- Q3 bucket board and Q4 spectrum (`questionnaire.css` `.spectrum`, `.buckets`).
- Results hamburger + `.results-now` title chip vs `.results-region-status` (fixed top-left).
- Blade rail horizontal scroll (`RankRail` in `Results.jsx`).
- Q2 drifting rows (`.reason-drift`); mask/overflow on narrow screens.
- Q6 notes: 5-col desktop → 2-col at 900px; equal card height 12.6rem may clip long text (cards already scroll inside).
- Thank-you code (`word-break` on `.response-code`).
- “Your vote” badge on wrapping Q2/Q3 names (`.bucket-row-topline` nowrap).
- Touch: Q2/Q6 hold-to-sink vs scroll; `touch-action: manipulation` is on chips/notes. Do not put `preventDefault` on `touchmove` for the whole page.
- Voting hover-only hints must have a tap equivalent (already do).

**Do not:**

- Change vote state machine or API bodies to “make tap easier” without checking hold vs contextmenu vs double-tap.
- Recolour winners to carrot or your-vote to orange.
- Restore mock “you” (broccoli/turnip) when there is no stored response.
- Move survey nudge back into `.results-section-head`.
- Put a vegetable grid on Q1.
- Animate Q2 pills hopping rows live (was rejected; freeze snapshot).

Verify in a **real phone or device mode with touch**, not only a resized desktop window. Cursor’s browser and Chrome do not share storage.

---

## Desired mobile outcome

Same information hierarchy as desktop: question first, results graphic, then Next, then code/nudge. Type readable without pinch-zoom. Primary taps ≥ ~44px. No overlapping fixed chrome (menu, region status, blade arrows). Q3/Q4 completable with a thumb.

---

## Still not in this branch (later)

- Live aggregation of Q1–Q5 from Neon (still mock boards).
- Public Q6/Q2 custom text appearing for **everyone** from the DB (today: mock pools + local pin of *your* public text).
- Restoring **voting** after clearing site data using only a pasted code (by design, so shared links cannot spend someone else’s likes).
- Vercel WAF rate-limit rules (app-level limits exist).
|