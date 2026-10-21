import { artForVegetable } from '../data/resultsMock.js';

function artFor(id, fallbackKey = '') {
  return artForVegetable(id, fallbackKey);
}

function named(id, fallback, byId) {
  const name = byId?.get(id)?.name || fallback || '';
  return String(name).trim();
}

function uniqueIds(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const ids = [];
  for (const id of list) {
    if (typeof id !== 'string' || !id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function instinctCard(id, tone, source, byId) {
  const name = named(source?.canonicalId, source?.rawAnswer, byId);
  if (!name) return null;
  return {
    id,
    layout: 'instinct',
    tone,
    name,
    art: artFor(source?.canonicalId, source?.rawAnswer),
  };
}

function bucketCard(id, tone, bucketId, byId) {
  const name = named(bucketId, '', byId);
  if (!name) return null;
  return {
    id,
    layout: 'between',
    tone,
    name,
    art: artFor(bucketId),
  };
}

function spectrumCard(ids, sense, byId) {
  if (ids.length < 2) return null;
  let topId;
  let bottomId;
  if (sense === 'more') {
    topId = ids[ids.length - 1];
    bottomId = ids[0];
  } else if (ids.length >= 4) {
    topId = ids[1];
    bottomId = ids[ids.length - 2];
  } else if (ids.length === 3) {
    topId = ids[0];
    bottomId = ids[1];
  } else {
    topId = ids[0];
    bottomId = ids[ids.length - 1];
  }
  if (!topId || !bottomId || topId === bottomId) return null;
  const top = named(topId, topId, byId);
  const bottom = named(bottomId, bottomId, byId);
  if (!top || !bottom) return null;
  return {
    id: sense === 'more' ? 'spectrum' : 'spectrum-less',
    layout: 'spectrum',
    sense,
    top,
    bottom,
    topArt: artFor(topId),
    bottomArt: artFor(bottomId),
  };
}

/** Photo share cards from a completed response stored on this device. */
export function buildResultCards(answers, catalog) {
  if (!answers || typeof answers !== 'object') return { featured: [], gallery: [] };

  const instinct = instinctCard(
    'instinct',
    'instinct',
    answers.initialAssociation,
    catalog?.vegetablesById,
  );
  const most = instinctCard(
    'most',
    'most',
    answers.mostVegetable,
    catalog?.vegetablesById,
  );
  const between = bucketCard(
    'between',
    'between',
    answers.sortBuckets?.in_between?.[0],
    catalog?.bucketById,
  );
  const notVegetable = bucketCard(
    'not',
    'not',
    answers.sortBuckets?.not_vegetable?.[0],
    catalog?.bucketById,
  );
  const ranked = uniqueIds(answers.spectrum);
  const spectrumById = catalog?.spectrumById;
  const more = spectrumCard(ranked, 'more', spectrumById);
  const less = spectrumCard(ranked, 'less', spectrumById);

  const featured = [];
  if (instinct) featured.push(instinct);
  if (between) featured.push(between);
  else if (notVegetable) featured.push(notVegetable);
  if (more) featured.push(more);

  const gallery = [...featured];
  if (most) gallery.push(most);
  if (between && notVegetable) gallery.push(notVegetable);
  if (less) gallery.push(less);

  return { featured, gallery };
}
