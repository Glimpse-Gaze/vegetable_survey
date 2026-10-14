import { neon } from '@neondatabase/serverless';

/** User-confirmed real ranking codes. Later rows (after the newest seed) are included automatically. */
export const LIVE_SEED_CODES = [
  '8FMdYyjb9N4y',
  '67DM2hEY6qrA',
  'J9Sy96oixuYG',
  'qXHHBwdz7Jmj',
];

const BUCKET_ALIASES = {
  mushroom: 'mushrooms',
  bamboo_shoot: 'bamboo_shoots',
};

const SPECTRUM_SLOTS = 10;

function normalizeBucketId(id) {
  const key = String(id ?? '').trim();
  return BUCKET_ALIASES[key] ?? key;
}

function voteId(entry) {
  const id = String(entry?.canonicalId ?? '').trim();
  return id || null;
}

function placeId(payload) {
  const grewUp = payload?.background?.grewUp;
  if (!grewUp || grewUp.skipped) return null;
  const id = String(grewUp.canonicalId ?? '').trim();
  if (!id || id === 'prefer_not_to_disclose') return null;
  return id;
}

function languageIds(payload) {
  const items = payload?.background?.languages?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item?.canonicalId ?? '').trim())
    .filter(Boolean);
}

function bump(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + amount;
}

function emptySpectrumSlots() {
  return Array.from({ length: SPECTRUM_SLOTS }, () => 0);
}

function surveyLocale(payload, text = '') {
  const raw = String(payload?.locale ?? '').trim().toLowerCase();
  if (raw === 'pl' || raw === 'en') return raw;
  // Older rows may lack locale; Polish diacritics are a strong signal.
  if (/[ąćęłńóśźż]/ĘŁŃÓŚŹŻ]/.test(text)) return 'pl';
  return 'en';
}

function compactBallot(payload, index) {
  const buckets = {};
  const sortBuckets = payload?.sortBuckets;
  if (sortBuckets && typeof sortBuckets === 'object') {
    for (const [columnId, ids] of Object.entries(sortBuckets)) {
      if (!Array.isArray(ids)) continue;
      for (const rawId of ids) {
        const id = normalizeBucketId(rawId);
        if (!id) continue;
        buckets[id] = columnId;
      }
    }
  }

  const spectrum = Array.isArray(payload?.spectrum)
    ? payload.spectrum.map((id) => String(id ?? '').trim()).filter(Boolean)
    : [];

  const custom = String(payload?.customCriterion ?? '').trim();
  const note = payload?.openDescription;
  const noteText = String(note?.text ?? '').trim();
  const locale = surveyLocale(payload, noteText || custom);

  return {
    place: placeId(payload),
    languages: languageIds(payload),
    locale,
    association: voteId(payload?.initialAssociation),
    mostVegetable: voteId(payload?.mostVegetable),
    criteria: Array.isArray(payload?.initialCriteria)
      ? payload.initialCriteria.map((id) => String(id ?? '').trim()).filter(Boolean)
      : [],
    buckets,
    spectrum: spectrum.length === SPECTRUM_SLOTS ? spectrum : [],
    customReason:
      custom && payload?.customCriterionPublic
        ? {
            id: `live-reason-${index}`,
            text: custom.slice(0, 280),
            locale: surveyLocale(payload, custom),
          }
        : null,
    note:
      noteText && note?.publicDisplay
        ? {
            id: `live-note-${index}`,
            text: noteText.slice(0, 1200),
            locale: surveyLocale(payload, noteText),
          }
        : null,
  };
}

function aggregatePayloads(payloads) {
  const associations = {};
  const mostVegetable = {};
  const criteria = {};
  const places = {};
  const languages = {};
  const buckets = {};
  const spectrum = {};
  const customReasons = [];
  const notes = [];
  const ballots = [];

  payloads.forEach((payload, index) => {
    const ballot = compactBallot(payload, index);
    ballots.push(ballot);

    bump(associations, ballot.association);
    bump(mostVegetable, ballot.mostVegetable);

    for (const criterion of ballot.criteria) {
      bump(criteria, criterion);
    }

    bump(places, ballot.place);
    for (const language of ballot.languages) {
      bump(languages, language);
    }

    for (const [id, columnId] of Object.entries(ballot.buckets)) {
      if (!buckets[id]) {
        buckets[id] = {
          not_vegetable: 0,
          in_between: 0,
          definitely_vegetable: 0,
        };
      }
      if (columnId in buckets[id]) {
        buckets[id][columnId] += 1;
      }
    }

    if (ballot.spectrum.length === SPECTRUM_SLOTS) {
      ballot.spectrum.forEach((id, slot) => {
        if (!spectrum[id]) spectrum[id] = emptySpectrumSlots();
        spectrum[id][slot] += 1;
      });
    }

    if (ballot.customReason) {
      customReasons.push({ ...ballot.customReason, boosts: 48, live: true });
    }
    if (ballot.note) {
      notes.push({ ...ballot.note, boosts: 48, live: true });
    }
  });

  return {
    liveCount: payloads.length,
    associations,
    mostVegetable,
    criteria,
    places,
    languages,
    buckets,
    spectrum,
    customReasons,
    notes,
    ballots,
  };
}

export async function loadLiveResults(databaseUrl) {
  if (!databaseUrl) {
    return aggregatePayloads([]);
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT payload
    FROM responses
    WHERE ranking_code = ANY(${LIVE_SEED_CODES})
       OR created_at > (
         SELECT COALESCE(MAX(created_at), '-infinity'::timestamptz)
         FROM responses
         WHERE ranking_code = ANY(${LIVE_SEED_CODES})
       )
    ORDER BY created_at ASC
  `;

  const payloads = rows
    .map((row) => row.payload)
    .filter((payload) => payload && typeof payload === 'object');

  return aggregatePayloads(payloads);
}
