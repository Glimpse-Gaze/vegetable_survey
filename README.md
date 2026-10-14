# The Great Vegetable Survey

A playful folk-concept study about what people actually mean by **vegetable**.

This is not a botany quiz. First instincts, personal criteria, awkward edge cases, and free-written definitions all count. There are no wrong answers.

Built for fun by [Glimpse & Gaze](https://glimpsegaze.com).

## What you can do

- **Take the survey** (~7 minutes) — seven questions covering first associations, reasons, sorting, a vegetableness spectrum, and optional background.
- **Explore interactive results** — board rankings, bucket columns, spectrum bands, open notes, and a world map of where answers come from.
- **Compare your ranking** — after submitting, you get a private ranking code you can reopen or share.
- **Rate public notes** — like or sink other people’s written criteria once you have completed the survey on that device.
- **Report issues** — send feedback to the developer without leaving the app.

## Why it exists

“Vegetable” is a social idea as much as a botanical one. The survey collects anonymous opinions across languages and places so patterns can be compared over time — what feels vegetabley in one kitchen may land differently in another.

Results currently **mix real human answers with seeded standings** until enough people have voted. Live Neon responses are weighted above the seed data; the transparency note on the results pages explains the mix.

## Stack

- Vite + React 19
- React Router
- Neon Postgres (anonymous survey payloads, ranking codes, reason/note votes, issue reports)
- English + Polish UI

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
```

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
