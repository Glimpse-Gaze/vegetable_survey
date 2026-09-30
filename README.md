# The most vegetable vegetable

A short, playful questionnaire about what people actually mean by **vegetable** — first instinct, reasons, sorting, a ranking of awkward cases, a written definition, then optional background.

This is a research prototype, not a botany test. There are no wrong answers.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Needs `DATABASE_URL` (Neon) for saving answers and comment votes.

```bash
npm run build
npm run preview
npm run lint
```

Dev survey fill: on `/survey`, **Ctrl+Shift+D**.

## What exists today

- `/` foyer, `/survey` (consent + 7 questions + thank-you), `/results/:categoryId` mock standings with optional personal overlay.
- Answers POST to Neon once, on the last survey question. Thank-you shows a ranking code (also stored in the browser). Optional private developer note is a separate column, not research data.
- Results comment boards can be liked/sunk only after a completed survey in that browser.

## Stack

Vite, React 19, JavaScript, CSS, React Router, Neon Postgres.

## For the next person

Start with [`HANDOVER.md`](./HANDOVER.md): research locks, file map, test flows, and notes for a **mobile layout** pass.

## Data

Responses are anonymous. Do not add precise geolocation. Rate limits may hash IPs for spam control; they are not stored with answers.
