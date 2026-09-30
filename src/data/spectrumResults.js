import {
  SLOT_COUNT,
  SPECTRUM_BANDS,
  bandForRank,
  spectrumVegetables,
} from './spectrumVegetables.js';

const GLOBAL_ORDER = [
  'tomato',
  'cucumber',
  'lettuce',
  'carrot',
  'onion',
  'sweet_potato',
  'broccoli',
  'corn',
  'celery',
  'turnip',
];

const REGION_ORDER = {
  global: GLOBAL_ORDER,
  europe: GLOBAL_ORDER,
  oceania: GLOBAL_ORDER,
  poland: [
    'tomato',
    'cucumber',
    'lettuce',
    'onion',
    'carrot',
    'broccoli',
    'corn',
    'celery',
    'sweet_potato',
    'turnip',
  ],
  china: [
    'cucumber',
    'lettuce',
    'carrot',
    'onion',
    'tomato',
    'sweet_potato',
    'corn',
    'broccoli',
    'celery',
    'turnip',
  ],
  asia: [
    'cucumber',
    'lettuce',
    'tomato',
    'onion',
    'carrot',
    'sweet_potato',
    'corn',
    'broccoli',
    'celery',
    'turnip',
  ],
  africa: [
    'tomato',
    'cucumber',
    'lettuce',
    'onion',
    'carrot',
    'broccoli',
    'celery',
    'corn',
    'sweet_potato',
    'turnip',
  ],
  north_america: [
    'tomato',
    'cucumber',
    'lettuce',
    'onion',
    'carrot',
    'celery',
    'broccoli',
    'corn',
    'sweet_potato',
    'turnip',
  ],
  south_america: [
    'cucumber',
    'lettuce',
    'carrot',
    'onion',
    'tomato',
    'sweet_potato',
    'broccoli',
    'corn',
    'celery',
    'turnip',
  ],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gaussian(random) {
  const u = Math.max(random(), 1e-9);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function noisyRanking(order, random, temperature) {
  return order
    .map((id, index) => ({
      id,
      score: index + gaussian(random) * temperature,
    }))
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .map((item) => item.id);
}

function emptyCounts() {
  return Object.fromEntries(
    spectrumVegetables.map((item) => [
      item.id,
      Array.from({ length: SLOT_COUNT }, () => 0),
    ]),
  );
}

function buildBoard(regionId, responseCount) {
  const order = REGION_ORDER[regionId] ?? GLOBAL_ORDER;
  const random = mulberry32(hashSeed(`spectrum:${regionId}:${responseCount}`));
  const temperature = 1.18;
  const counts = emptyCounts();

  for (let ballot = 0; ballot < responseCount; ballot += 1) {
    const ranking = noisyRanking(order, random, temperature);
    ranking.forEach((id, slot) => {
      counts[id][slot] += 1;
    });
  }

  return counts;
}

function medianSlot(slotCounts, total) {
  const midpoint = total / 2;
  let seen = 0;
  for (let index = 0; index < slotCounts.length; index += 1) {
    seen += slotCounts[index];
    if (seen >= midpoint) return index + 1;
  }
  return SLOT_COUNT;
}

function meanRank(slotCounts, total) {
  if (!total) return 0;
  return (
    slotCounts.reduce((sum, count, index) => sum + (index + 1) * count, 0) /
    total
  );
}

export function getSpectrumSection(category, region, artFor) {
  const counts = buildBoard(region.id, region.votes);
  const userSpectrum = category.userSpectrum ?? [];
  const items = spectrumVegetables
    .map((vegetable) => {
      const slotCounts = counts[vegetable.id];
      const mean = meanRank(slotCounts, region.votes);
      const userSlot = userSpectrum.indexOf(vegetable.id) + 1;
      return {
        ...vegetable,
        art: artFor(vegetable.id),
        slotCounts,
        slotShares: slotCounts.map((count) => count / region.votes),
        meanRank: mean,
        medianSlot: medianSlot(slotCounts, region.votes),
        userSlot: userSlot || null,
      };
    })
    .sort(
      (a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name),
    )
    .map((item, index) => {
      const rank = index + 1;
      const band = bandForRank(rank);
      return {
        ...item,
        rank,
        bandId: band?.id ?? 'middle',
      };
    });

  const bands = SPECTRUM_BANDS.map((band) => ({
    ...band,
    items: items.filter((item) => item.bandId === band.id),
  }));

  return {
    ...category,
    region,
    items,
    bands,
    responseCount: region.votes,
  };
}
