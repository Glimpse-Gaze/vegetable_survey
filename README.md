# The Great Vegetable Survey

A playful **folk-concept study** about what people actually mean by *vegetable* — across languages, kitchens, and regions.

This is not a botany quiz. First instincts, personal criteria, awkward edge cases, and free-written definitions all count. There are no wrong answers.

Built for fun by [Glimpse & Gaze](https://glimpsegaze.com).

## Purpose

“Vegetable” is a social idea as much as a botanical one. The survey collects anonymous opinions so we can compare patterns globally and regionally — what feels vegetabley in one language community or cuisine may land very differently in another.

The long game is to gather enough **regional and ethnolinguistic signal** (optional birthplace + native language) to see whether folk categories track cultural and linguistic boundaries, not only supermarket shelves. Early results still mix seeded standings with live answers until the human sample is large enough; filters that need local density stay locked until then.

## What you can do

- **Take the survey** (~7 minutes) — seven questions that deliberately use different interaction formats.
- **Explore interactive results** — rankings, bucket columns, spectrum bands, open notes, custom reasons, and a world map of where answers come from.
- **Compare your ranking** — after submitting, you get a private ranking code you can reopen or share.
- **Rate public notes** — like or sink other people’s written criteria once you have completed the survey on that device.
- **Report issues** — send feedback to the developer without leaving the app.

## Survey structure

After a short welcome and privacy consent, respondents move through seven questions. Each one uses a different format on purpose — the medium is part of the measurement.

| # | Theme | Interaction |
| --- | --- | --- |
| 1 | First association | Free text with autocomplete against a vegetable catalogue — captures the gut “vegetable” word or plant that comes to mind. |
| 2 | Why vegetabley | Multi-select criteria chips plus an optional **custom reason** (public if the respondent opts in). Choosable answers plus open text. |
| 3 | Sort the grey zone | **Group / bucket** board — drag or tap items into *not a vegetable*, *in-between*, or *definitely a vegetable*. At least 15 must be sorted; unknowns can stay in the pool. |
| 4 | Vegetableness spectrum | **Ordered spectrum** of ten ranks from least to most vegetabley — drag handles, up/down arrows, and return-to-pool controls. |
| 5 | Most vegetable vegetable | Free text / autocomplete again — the ideal exemplar after reflection. |
| 6 | Open definition | Longer **open question** — a free-written note that can appear on the results board if made public. |
| 7 | Background | Optional birthplace and native language (skippable) to power map and language filters without requiring precise geolocation. |

Nuances that matter for reading results:

- Bucket and spectrum items are fixed catalogues (shuffled per session); open questions and custom reasons are free text.
- Public display of free-text answers always needs an explicit checkbox.
- Live tallies for place/language filters use **real ballots only** and unlock only after a vote threshold (currently 20). Global boards may still show a transparent mix of seed + live data until the sample grows.

## Results & map

Results are organised by question category. Respondents can move between boards, filter by place and language once enough live answers exist, and browse public notes and custom reasons in the UI locale they chose (English and Polish pools stay separate for free-text).

The **world map** uses an **equal-Earth** projection so regions keep comparable area. It is interactive (pan / inspect) and colours places by live density — filterable once a region clears the threshold, with a lighter “emerging” state while votes are still few.

## Project structure

```
src/
  components/Questionnaire/   # Survey steps, boards (buckets, spectrum), consent, thank-you
  components/Results/         # Result boards, map, notes, reasons, survey gate
  data/                       # Catalogues, mock seed standings, live blend / filter helpers
  i18n/                       # Locales, messages, lexicons (en + pl)
  pages/                      # Home + Results shell
  styles/                     # Questionnaire + results + shared page chrome
  utils/                      # Submit helpers, touch hold-drag, local “my answer” storage
server/                       # Neon access: responses, live aggregates, votes, rate limits
api/                          # Vercel-style API entry points
scripts/                      # Content image compression (also hooked into Vite)
```

Payloads are stored as anonymous JSON in Neon (`server/schema.sql`). Ranking codes, reason/note votes, and issue reports live alongside them.

## Stack

- Vite + React 19
- React Router
- Neon Postgres (anonymous survey payloads, ranking codes, reason/note votes, issue reports)
- English + Polish UI (lexicons for vegetables, places, languages, spectrum copy)

## Main routes

| Path | Purpose |
| --- | --- |
| `/` | Home — start the survey or jump to results |
| `/:locale/survey` | Consent + questionnaire + thank-you / ranking code |
| `/:locale/results/:categoryId` | Interactive results for one question |

Supported locales: `en`, `pl`.

## Data & privacy

- Responses are anonymous and stored as JSON payloads in Neon.
- Optional birthplace / native language enrich the map and filters; both can be skipped.
- No precise geolocation. Rate limits may hash IPs for spam control; they are not stored with answers.
- Public display of free-text answers requires an explicit checkbox from the respondent.
- Global results may mix seeded mock standings with live Neon answers until enough people have voted; filtered views use live answers only.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`).

Set `DATABASE_URL` to a Neon connection string so answers, votes, and issue reports can save.

```bash
npm run build
npm run preview
npm run lint
npm run compress:images
```

`predev` / `prebuild` also run image compression for oversized JPGs under `src/content`.
