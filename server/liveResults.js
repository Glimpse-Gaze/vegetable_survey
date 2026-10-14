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

  payloads.forEach((payload, index) => {
    const assoc = voteId(payload?.initialAssociation);
    bump(associations, assoc);

    const most = voteId(payload?.mostVegetable);
    bump(mostVegetable, most);

    for (const criterion of payload?.initialCriteria ?? []) {
      bump(criteria, criterion);
    }

    bump(places, placeId(payload));
    for (const language of languageIds(payload)) {
      bump(languages, language);
    }

    const sortBuckets = payload?.sortBuckets;
    if (sortBuckets && typeof sortBuckets === 'object') {
      for (const [columnId, ids] of Object.entries(sortBuckets)) {
        if (!Array.isArray(ids)) continue;
        for (const rawId of ids) {
          const id = normalizeBucketId(rawId);
          if (!id) continue;
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
      }
    }

    const ranking = payload?.spectrum;
    if (Array.isArray(ranking) && ranking.length === SPECTRUM_SLOTS) {
      ranking.forEach((rawId, slot) => {
        const id = String(rawId ?? '').trim();
        if (!id) return;
        if (!spectrum[id]) spectrum[id] = emptySpectrumSlots();
        spectrum[id][slot] += 1;
      });
    }

    const custom = String(payload?.customCriterion ?? '').trim();
    if (custom && payload?.customCriterionPublic) {
      customReasons.push({
        id: `live-reason-${index}`,
        text: custom.slice(0, 280),
        boosts: 48,
        live: true,
      });
    }

    const note = payload?.openDescription;
    const noteText = String(note?.text ?? '').trim();
    if (noteText && note?.publicDisplay) {
      notes.push({
        id: `live-note-${index}`,
        text: noteText.slice(0, 1200),
        boosts: 48,
        live: true,
      });
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
