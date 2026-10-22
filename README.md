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
- **Invite someone to take the survey** — Facebook, X, WhatsApp, Reddit, and a copy-link button on the home page.
- **Share your answers as pictures** — after this device has a completed response, thank-you and the results page can turn those answers into cards you can save or send.
- **Compare your results** — a private code and link reopen this response later, or let someone else open the same results. It is not an invitation to fill the survey.
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
- Free-text vegetable answers match the catalogue without diacritics when that folding points to one name (`baklazan` → Bakłażan), in every survey language. Two names that collapse to the same spelling are not assigned to each other.
- Public display of free-text answers always needs an explicit checkbox.
- Live tallies for place/language filters use **real ballots only** and unlock only after a vote threshold (currently 20). Global boards may still show a transparent mix of seed + live data until the sample grows.

## Results & map

Results are organised by question category. Respondents can move between boards, filter by place and language once enough live answers exist, and browse public notes and custom reasons in the UI locale they chose (each language keeps its own free-text pool).

The **world map** uses an **equal-Earth** projection so regions keep comparable area. It is interactive (pan / inspect) and colours places by live density — filterable once a region clears the threshold, with a lighter “emerging” state while votes are still few. On a phone, tapping a country that is not yet filterable shows a short tip next to the tap.

## Sharing

Three share paths stay separate. An invitation asks someone to take the survey. An answer card shows how this device answered. A results code reopens those results. They are not interchangeable.

**Invite.** Scriptless links (no tracking script) for Facebook, X, WhatsApp, Reddit, plus copy link. They sit on the home page under “See the results”, on the thank-you screen, and inside **Sharing options** on the results page. Every one points at the public homepage, `https://vegetable.glimpsegaze.com`. The sentence in the composer follows the UI language, and the link is the homepage for that language (`/pl`, `/de`, and the rest). Each of those URLs is a real HTML file with that language’s title, description, and banner in `public/og/`. A results link keeps its code; the preview still uses the language of the path. The bare domain stays the English page. Facebook, WhatsApp, and Reddit keep a cached card until that exact URL is scraped again.

Search engines get `robots.txt` and `sitemap.xml` for the homepage, the thirteen language homes, and each results question in those languages. The HTML for a question includes its title, the line under the title, and the note from the information popup. Live vote counts and personal results codes stay out. Submit `https://vegetable.glimpsegaze.com/sitemap.xml` in Google Search Console after deploy. Keyword lists in the metadata are not used.

**Answer cards.** Shown only when this browser has a completed response in local storage. On thank-you they sit in the page. On results they are behind the Sharing options control, with three featured cards and a gallery for the rest. Each card is the survey title and URL at the top, the answer in the middle, and the eye mark plus a short prompt at the bottom. Saving downloads a PNG that uses the same type as the page.

The cards are:

- First instinct — “When I think of vegetables, I think…” plus the name, and “How about you?” (other languages use an “and you?” line).
- A bucket judgement — “I think … is not fully a vegetable” or “is not a vegetable”, and “Disagree?”. This card is skipped when both the in-between and not-a-vegetable buckets are empty.
- A spectrum comparison — two photos, split in half, with the “more of a vegetable than” sentence between the names, and “Be the judge”.
- The most vegetable vegetable, in the gallery — “The most vegetable vegetable?” plus the name, and “And yours?”.

The text sent with the picture repeats that sentence, then `vegetable.glimpsegaze.com` on its own line, so the address can travel with the image. The spectrum card is the exception: languages put the two names in different places in the sentence, so its share text is only “Fill The Great Vegetable Survey:” plus the URL. The picture itself is unchanged.

A tint control in the gallery can wash a photo or fill a card that has no photo. The colour already selected stays selected when Tint is turned on. Tint starts on green only when no colour is selected yet.

**Compare results.** The code and link display this response’s results again later. Feel free to pass them on. On the results page the code opens inside Sharing options, above the invite buttons and the answer cards. On thank-you the order is answer cards, then the invite buttons, then the code.

## Project structure

```
src/
  components/Questionnaire/   # Survey steps, boards (buckets, spectrum), consent, thank-you
  components/Results/         # Result boards, map, notes, reasons, survey gate, answer cards, sharing options
  components/ShareBar.jsx     # Invite buttons (homepage, thank-you, sharing options)
  data/                       # Catalogues, mock seed standings, live blend / filter helpers
  i18n/                       # Locales, messages, lexicons
  pages/                      # Home + Results shell
  styles/                     # Questionnaire + results + shared page chrome
  utils/                      # Submit helpers, share links, result-card images, touch hold-drag, local “my answer” storage
server/                       # Neon access: responses, live aggregates, votes, rate limits
api/                          # Vercel-style API entry points
scripts/                      # Content image compression (also hooked into Vite)
```

Payloads are stored as anonymous JSON in Neon (`server/schema.sql`). Results codes, reason/note votes, and issue reports live alongside them.

## Stack

- Vite + React 19
- React Router
- Neon Postgres (anonymous survey payloads, results codes, reason/note votes, issue reports)
- UI and catalogues in 13 locales: English, Polish, Simplified and Traditional Chinese, Korean, Thai, French, Italian, German, Spanish (Spain and Mexico), and Portuguese (Brazil and Portugal). A missing string or name falls back to English. Stored answers keep stable English ids (`carrot`, `poland`). Simplified and Traditional Chinese also match pinyin and zhuyin.

## Main routes

| Path | Purpose |
| --- | --- |
| `/` | Home — start the survey or jump to results |
| `/:locale/survey` | Consent + questionnaire + thank-you, answer cards, and results code |
| `/:locale/results/:categoryId` | Interactive results for one question |

Supported locales: `en`, `pl`, `zh`, `zh-hant`, `ko`, `th`, `fr`, `it`, `de`, `es`, `es-mx`, `pt-br`, `pt-pt`.

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
