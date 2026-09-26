# The most vegetable vegetable

A short, playful questionnaire about what people actually mean by **vegetable** — first instinct, why it feels vegetabley, a ranking of awkward cases (tomato, mushroom, sweet potato…), then a few optional background questions.

This is a research prototype, not a botany test. There are no wrong answers.

## Run it

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173/`).

```bash
npm run build    # production build
npm run preview  # serve that build
npm run lint     # oxlint
```

## What exists today

Five questions in the browser, with answers kept in `sessionStorage` for the tab only:

1. What comes to mind when you hear “vegetable”?
2. Why does that feel vegetabley? (up to five reasons)
3. Rank ten named items from least to most vegetabley
4. In your own words, what makes something feel like a vegetable?
5. Optional: where you grew up, and languages you speak

After that you currently get a **developer JSON recap** so we can inspect the payload. That screen is not meant for participants.

There is **no server** yet. Refreshing the same tab restores progress; a new tab starts over.

## Stack

Vite, React 19, JavaScript, CSS. No TypeScript, no animation library.

## For the next person building this

Start with [`HANDOVER.md`](./HANDOVER.md). It records the research constraints, the response schema, and the planned path: confirm Q1 wording, add a real thank-you ending, persist ~1,000 anonymous responses, then deploy.

## License / data

Responses are anonymous by design. Do not add precise geolocation. A public privacy note still needs to be written before a live launch.
