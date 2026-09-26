# Handover: The Most Vegetable Vegetable

For the next implementation agent. Read this before changing the questionnaire. The original research brief lived at `vegetable_questionnaire_handover.md` (Downloads); this file is the current source of truth for **what exists now** and **what to do next**.

---

## What this software is

A client-only interactive questionnaire that captures folk concepts of “vegetable”: first association, reasons for that association, a ranking of ten conceptually awkward items, an open definition, then optional cultural background.

It is **not** a botanical quiz and **not** a conventional survey product. Unusual answers are valid. The UI must not prime people with a vegetable catalogue before they have produced their own answer.

Target later: ~1,000 anonymous respondents. There is **no backend yet**. After the last question, a **developer recap** dumps JSON. That screen is not public-facing.

Stack: **Vite + React 19 + JavaScript + CSS**. No TypeScript, no Motion/Framer, no backend, no results explorer.

Run: `npm install` then `npm run dev` (often `http://localhost:5173/` or `5174` if 5173 is busy).

---

## Current flow (5 questions + recap)

Progress copy is `Question X out of 5` in the old eyebrow slot.

| Step | Component | Purpose |
| --- | --- | --- |
| 1 | `Question1.jsx` | Spontaneous association to the word “vegetable” |
| 2 | `Question2.jsx` | Why that answer feels vegetabley (criteria, max 5) |
| 3 | `Question3.jsx` | Rank 10 items on a least→most vegetabley scale |
| 4 | `Question4.jsx` | Open definition after ranking |
| 5 | `Question5.jsx` | Optional grew-up place + languages |
| recap | `DeveloperRecap.jsx` | JSON dump + Start over |

**Back** exists on every question:

- Q1: greyed, nowhere to go.
- Q2: greyed. Clicking it toasts *“Your initial intuition is locked. There are no bad answers!”* Q1 cannot be edited.
- Q3–Q5: real back. Earlier answers hydrate from `sessionStorage`.

Browser history uses `history.replaceState` only. The in-app Back button is the navigation model; the browser Back button does not walk questions.

---

## Locked research / product decisions

Do not “improve these away” without asking the researcher.

### Measurement

- **Q1 must not show a vegetable catalogue, examples, popular picks, or a grid before typing.** Autocomplete appears only after **2 characters**.
- **Never rewrite visible typed text.** `potatos` stays `potatos` in the field. Canonical IDs live only in stored data.
- `selectionMethod` is `"autocomplete"` only when the respondent **explicitly picks** a suggestion. Typing a known name and hitting Continue is `"free_text"` plus a silent `canonicalId` if a match exists.
- Unknown / non-vegetable answers are first-class (`canonicalId: null`).
- Q2 is about **that specific first answer**, not a general definition. The later open question is Q4.
- Q2 criteria stay heterogeneous (botanical, culinary, cultural, “it just feels vegetabley”). Do not sort them into a scientific taxonomy. Shuffle all except the last two, which stay pinned: `just_feels`, `other`.
- At least one Q2 criterion is required; `just_feels` is the escape hatch. Max **5**. Hover on disabled Continue: “Select at least one”.
- Spectrum items must **not** be called “vegetables” in instructions. Use “these” / “item”. Vegetable-hood is what is being judged. Mushroom is in the set, so do not say “edible plant”.
- Spectrum uses **names only** (no photos) to avoid lighting/produce-aisle bias. Ten items, one per botanical family / outlier (tomato Solanaceae, mushroom Fungi, sweet potato not potato so it is not another nightshade).
- Scale is **vertical**: least vegetabley at the **top**, most at the **bottom**, pool on the right.
- Arrow left of the scale is **grayscale**, not a traffic-light gradient: empty outline at the top, filled dark at the bottom. Colour must not imply meaning.
- Q5 skip (empty Continue) records **I prefer not to disclose**. Custom typed places/languages are allowed. Continents and contested regions (Taiwan, Tibet, Hong Kong, Palestine, Kosovo, Kurdistan, Western Sahara, UK nations, etc.) are in the list.
- **Antarctica** is an Easter egg: it cannot be chosen. Toast *“I don't believe you.”* Keep the country list open (`onPickSuggestion` returning `false` prevents close).

### Copy that already drifted — confirm before changing Q1 again

Original locked Q1 was first-vegetable recall:

> When you hear the word “vegetable”, which vegetable comes to your mind?
> Placeholder: Type a vegetable...

Current live copy is more open, to avoid pre-classifying the answer as a vegetable:

> When you hear the word “vegetable”, what comes to your mind?
> Placeholder: Type what comes to mind...

That re-opens free association (`health`, `green`, `mom’s soup`). **Ask whether Q1 should go back to first-vegetable recall** before collecting real data.

### UX tone

Playful, curious, slightly absurd. Not a corporate survey. No “SUBMIT SURVEY”, no badges, no fake science, no long explanations. Green selected Q2 cards (not red). Tiny CSS transitions are enough.

---

## Data model (session only)

`sessionStorage` key: `vegetable-survey-q1q5`.

Shape after a full run:

```js
{
  responseId: "uuid",
  timestamp: "ISO-8601",
  initialAssociation: {
    rawAnswer: "potatos",
    canonicalId: "potato",       // or null
    selectionMethod: "free_text" // or "autocomplete"
  },
  initialCriteria: ["just_feels", "cooking"],
  customCriterion: "",
  spectrum: [
    "mushroom", "tomato", "corn", "cucumber", "onion",
    "pea", "lettuce", "carrot", "sweet_potato", "broccoli"
  ], // length 10, least → most, item ids
  openDescription: {
    text: "...",
    publicDisplay: false // checkbox, default false
  },
  background: {
    grewUp: {
      rawAnswer: "Taiwan",
      canonicalId: "taiwan",
      skipped: false
    },
    languages: {
      items: [
        { rawAnswer: "English", canonicalId: "english" },
        { rawAnswer: "Silesian", canonicalId: null }
      ],
      skipped: false
    }
  }
}
```

Empty Q5 fields become `canonicalId: "prefer_not_to_disclose"` and `skipped: true`.

---

## Repo map

```text
src/
  App.jsx
  components/Questionnaire/
    Questionnaire.jsx      # steps, session, toasts, back
    Question1.jsx … Question5.jsx
    QuestionContainer.jsx  # “Question X out of 5”
    QuestionNav.jsx        # Back + Continue
    AutocompleteInput.jsx  # combobox; return false from onPick to keep open
    CriteriaSelector.jsx
    SpectrumBoard.jsx
    SpectrumArrow.jsx
    Toast.jsx
    DeveloperRecap.jsx
  data/
    vegetables.js          # generous world list + aliases
    criteria.js
    spectrumVegetables.js  # the 10 ranked items
    countries.js
    languages.js           # includes Brazilian Portuguese
  utils/
    normalization.js       # lowercase, NFD strip, collapse space
    autocomplete.js        # findCanonicalMatch, getSuggestions, getLookupSuggestions
  styles/questionnaire.css
```

Helpers:

- `getSuggestions(query, items, limit)` — prefix on name then alias; empty until 2 chars; default limit 6.
- `getLookupSuggestions(query, items, { featuredIds, browseAll, limit })` — countries use `browseAll: true` so empty focus shows continents then a **scrollable A–Z** list (`max-height` on `.autocomplete-list`).

---

## Interaction notes (easy to break)

- Autocomplete lists are **in-flow**, not `position: absolute`, so they do not cover Continue.
- Q2 native checkboxes are visually hidden (`appearance: none`); clicks go to the card. Do not restore default checkbox UI without checking toggling.
- Q3 placement: click a slot, then a tile, or HTML5 drag-and-drop. **Slots do not auto-advance** after a place. Swaps/displaces if the slot is filled.
- Going back to Q3 reshuffles the remaining palette; filled slots restore from `response.spectrum`.
- Q5 Continue is always enabled. Pending language text (typed, no Enter) is committed on submit.
- Toasts: Q1 continue (*First instinct locked. No wrong answers.*), Q2 locked Back, Antarctica.

---

## Desired roadmap

Do this in order unless the researcher says otherwise. Keep Q1–Q5 modular; later stages should **append** to the response object, not rename existing fields.

### 1. Confirm instrument (short conversation)

- Q1 wording: first-vegetable vs open association.
- Whether a **sixth question** is still wanted after the spectrum: *“After all this, what would you call the most vegetabley vegetable?”* (in the original brief, not built).
- Public display of Q4 text, privacy copy, and whether background is optional (currently skippable).

### 2. Replace the developer recap with a real ending

Thank-you screen, short privacy/data-use note, no JSON. Keep a hidden recap or `?debug=1` for development. “Start over” can stay for testing only.

### 3. Persist responses (~1,000)

- Anonymous `responseId` already exists client-side; send **once** on completion (not per keystroke).
- Store raw + canonical separately; no precise geolocation.
- SQLite / Postgres / Supabase — pick whatever matches deployment.
- Do not treat `sessionStorage` as the database.

### 4. Deploy a public URL

Vercel (or similar) is enough. Add an env-based API URL. Test mobile (iPhone width) on Q3’s two-column spectrum.

### 5. Remaining product polish (same app)

- Q3: auto-advance to the next empty slot after placing; persist palette order across Back.
- Optional in-app progress that does not look like a 40-item survey (already “Question X of 5”).
- Slightly richer CSS transitions if it still feels like a slide deck; no animation library unless it clearly earns its keep.
- Keyboard: Q3 is mouse/touch-first; improve if time.
- Tests around canonical match, Q5 skip→disclose, Antarctica block, Q1 selectionMethod.

### 6. Out of this repo unless explicitly in scope

- Results grid / WebGL explorer (original brief: **separate page/project**, possibly another stack).
- Turning Q1 into a catalogue, adding stock photos to the spectrum, or colouring the arrow like a heat map.

---

## How to verify before shipping a change

1. Q1 empty field: **no** vegetable names. Type `car` → suggestions. Type `potatos` → Continue; recap keeps raw `potatos`.
2. Q2 Back stays locked with toast; criteria restore if you go Q3→Q2.
3. Q3: all 10 placed, least at top; arrow outline-top / fill-bottom; copy does not say “vegetables to place”.
4. Q4 required text; public checkbox defaults off.
5. Q5: continents then A–Z countries, Taiwan/Tibet present, skip = disclose, custom language via Enter, Antarctica toast with list still open.
6. Recap JSON matches the schema above. Reset returns to Q1.

---

## Open questions for the researcher

1. Revert Q1 to “which vegetable comes to your mind?” or keep the open prompt?
2. Add the post-spectrum “most vegetabley vegetable” item, and if so, before or after Q4?
3. Preferred backend/host for the first 1,000 responses?
4. Should Q4 `publicDisplay` actually control a future public wall, or is it consent storage only for now?
