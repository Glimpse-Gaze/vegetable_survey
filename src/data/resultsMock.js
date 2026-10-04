import { CONTINENTS } from './continents.js';
import { bucketItems } from './bucketItems.js';
import broccoli from '../content/Broccoli.jpg';
import brusselsSprouts from '../content/Brussel_sprouts.jpg';
import cabbage from '../content/Cabbage.jpg';
import carrots from '../content/Carrots.jpg';
import cauliflower from '../content/Cauliflower.jpg';
import celery from '../content/Celery.jpg';
import corn from '../content/Corn.jpg';
import onion from '../content/Onion.jpg';
import pakChoi from '../content/Pok_choi.jpg';
import potato from '../content/Potato.jpg';
import pumpkin from '../content/Pumpkin.jpg';
import tomato from '../content/Tomato.jpg';
import turnip from '../content/Turnips.jpg';
import placeholder from '../content/Placeholder.jpg';
import { DEV_SPEEDRUN } from './devSpeedrun.js';
import { vegetables } from './vegetables.js';
import { findCanonicalMatch } from '../utils/autocomplete.js';
import { normalizeText } from '../utils/normalization.js';
import { getSpectrumSection } from './spectrumResults.js';
import { getReasonsSection } from './reasonResults.js';
import { getNotesSection } from './noteResults.js';
import { languages } from './languages.js';

export const VEGETABLE_ART = {
  broccoli,
  brussels_sprouts: brusselsSprouts,
  cabbage,
  carrot: carrots,
  cauliflower,
  celery,
  corn,
  onion,
  pak_choi: pakChoi,
  potato,
  pumpkin,
  tomato,
  turnip,
};

export const VEGETABLE_LABELS = {
  broccoli: 'Broccoli',
  brussels_sprouts: 'Brussels sprouts',
  cabbage: 'Cabbage',
  carrot: 'Carrot',
  cauliflower: 'Cauliflower',
  celery: 'Celery',
  corn: 'Corn',
  onion: 'Onion',
  pak_choi: 'Pak choi',
  potato: 'Potato',
  pumpkin: 'Pumpkin',
  tomato: 'Tomato',
  turnip: 'Turnip',
};

const CATALOGUE_NAMES = Object.fromEntries(
  vegetables.map((item) => [item.id, item.name]),
);

/** Blades show this many leaders per region. Tune between 10 and 15. */
export const BLADE_BOARD_SIZE = 12;

function displayVoteName(answer) {
  const raw = String(answer?.rawAnswer ?? '').trim();
  if (raw) return raw;
  const id = answer?.canonicalId;
  return VEGETABLE_LABELS[id] ?? CATALOGUE_NAMES[id] ?? null;
}

function resolveVoteId(canonicalId, rawAnswer) {
  if (canonicalId) return canonicalId;
  return findCanonicalMatch(rawAnswer, vegetables);
}

function labelForVoteId(id) {
  return VEGETABLE_LABELS[id] ?? CATALOGUE_NAMES[id] ?? null;
}

function humanizeVoteId(id) {
  return String(id ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function findRankedPick(ranked, userVoteId, userVoteName) {
  if (userVoteId) {
    const byId = ranked.find((item) => item.id === userVoteId);
    if (byId) return byId;
  }
  const q = normalizeText(userVoteName);
  if (!q) return null;
  return (
    ranked.find((item) => normalizeText(item.name) === q) ?? null
  );
}

const BOARDS = {
  global: {
    'first-instincts': {
      tomato: 186,
      carrot: 142,
      broccoli: 98,
      potato: 71,
      onion: 54,
      cabbage: 41,
      corn: 33,
      pumpkin: 22,
      cauliflower: 18,
      celery: 14,
      pak_choi: 9,
      turnip: 7,
      brussels_sprouts: 5,
    },
    'most-vegetable': {
      turnip: 131,
      broccoli: 108,
      cabbage: 91,
      carrot: 79,
      potato: 67,
      onion: 54,
      celery: 48,
      pak_choi: 40,
      corn: 29,
      brussels_sprouts: 22,
      cauliflower: 17,
      pumpkin: 9,
      tomato: 5,
    },
  },
  poland: {
    'first-instincts': {
      potato: 22,
      cabbage: 16,
      tomato: 14,
      carrot: 10,
      broccoli: 8,
      onion: 5,
      corn: 3,
      pumpkin: 2,
      cauliflower: 2,
      celery: 1,
      pak_choi: 1,
      turnip: 1,
      brussels_sprouts: 1,
    },
    'most-vegetable': {
      cabbage: 18,
      potato: 14,
      turnip: 12,
      broccoli: 10,
      carrot: 8,
      onion: 6,
      celery: 5,
      pak_choi: 4,
      corn: 3,
      brussels_sprouts: 2,
      cauliflower: 2,
      pumpkin: 1,
      tomato: 1,
    },
  },
  china: {
    'first-instincts': {
      pak_choi: 7,
      cabbage: 5,
      broccoli: 4,
      tomato: 3,
      carrot: 2,
      potato: 2,
      onion: 1,
      corn: 1,
      pumpkin: 1,
      cauliflower: 1,
      celery: 1,
    },
    'most-vegetable': {
      pak_choi: 9,
      cabbage: 6,
      broccoli: 4,
      celery: 2,
      potato: 2,
      onion: 1,
      carrot: 1,
      corn: 1,
      brussels_sprouts: 1,
      cauliflower: 1,
    },
  },
  europe: {
    'first-instincts': {
      potato: 30,
      tomato: 26,
      cabbage: 22,
      carrot: 16,
      broccoli: 12,
      onion: 8,
      corn: 5,
      pumpkin: 2,
      cauliflower: 2,
      celery: 1,
      pak_choi: 1,
      turnip: 1,
      brussels_sprouts: 1,
    },
    'most-vegetable': {
      cabbage: 24,
      potato: 18,
      turnip: 16,
      broccoli: 14,
      carrot: 12,
      onion: 9,
      celery: 8,
      pak_choi: 5,
      corn: 4,
      brussels_sprouts: 3,
      cauliflower: 2,
      pumpkin: 1,
      tomato: 1,
    },
  },
  asia: {
    'first-instincts': {
      pak_choi: 12,
      cabbage: 8,
      broccoli: 6,
      tomato: 4,
      potato: 3,
      carrot: 3,
      onion: 2,
      pumpkin: 1,
      cauliflower: 1,
      celery: 1,
    },
    'most-vegetable': {
      pak_choi: 14,
      cabbage: 9,
      broccoli: 6,
      celery: 3,
      potato: 3,
      onion: 2,
      carrot: 2,
      corn: 1,
      brussels_sprouts: 1,
    },
  },
  africa: {
    'first-instincts': {
      tomato: 8,
      onion: 5,
      potato: 4,
      cabbage: 3,
      carrot: 2,
      pumpkin: 1,
      corn: 1,
    },
    'most-vegetable': {
      cabbage: 7,
      onion: 5,
      potato: 4,
      tomato: 3,
      pumpkin: 2,
      carrot: 2,
      celery: 1,
    },
  },
  north_america: {
    'first-instincts': {
      corn: 9,
      tomato: 8,
      potato: 6,
      broccoli: 4,
      carrot: 3,
      onion: 2,
      pumpkin: 1,
    },
    'most-vegetable': {
      broccoli: 8,
      corn: 6,
      potato: 5,
      carrot: 4,
      celery: 3,
      cabbage: 3,
      tomato: 2,
      onion: 2,
    },
  },
  south_america: {
    'first-instincts': {
      tomato: 7,
      potato: 5,
      pumpkin: 3,
      onion: 3,
      corn: 2,
      carrot: 1,
    },
    'most-vegetable': {
      potato: 6,
      pumpkin: 4,
      tomato: 3,
      onion: 3,
      cabbage: 2,
      celery: 2,
      corn: 1,
    },
  },
  oceania: {
    'first-instincts': {
      potato: 6,
      pumpkin: 5,
      tomato: 4,
      carrot: 3,
      broccoli: 2,
      onion: 2,
    },
    'most-vegetable': {
      pumpkin: 6,
      broccoli: 4,
      potato: 4,
      celery: 3,
      cabbage: 3,
      carrot: 2,
    },
  },
};

const BUCKET_RESPONDENTS = 700;

const BUCKET_COLUMNS = [
  {
    id: 'not_vegetable',
    title: 'Not a vegetable',
  },
  {
    id: 'in_between',
    title: 'Something in-between',
  },
  {
    id: 'definitely_vegetable',
    title: 'Definite vegetable',
  },
];

// Each item is placed by every respondent into exactly one bucket.
const BUCKET_ITEM_VOTES = {
  mushroom: { not_vegetable: 462, in_between: 168, definitely_vegetable: 70 },
  cinnamon: { not_vegetable: 245, in_between: 315, definitely_vegetable: 140 },
  tobacco: { not_vegetable: 196, in_between: 280, definitely_vegetable: 224 },
  turmeric: { not_vegetable: 154, in_between: 336, definitely_vegetable: 210 },
  rhubarb: { not_vegetable: 112, in_between: 343, definitely_vegetable: 245 },
  garlic: { not_vegetable: 84, in_between: 406, definitely_vegetable: 210 },
  olive: { not_vegetable: 63, in_between: 175, definitely_vegetable: 462 },
  horseradish: { not_vegetable: 49, in_between: 301, definitely_vegetable: 350 },
  tomato: { not_vegetable: 168, in_between: 280, definitely_vegetable: 252 },
  avocado: { not_vegetable: 210, in_between: 245, definitely_vegetable: 245 },
  pumpkin: { not_vegetable: 175, in_between: 210, definitely_vegetable: 315 },
  cucumber: { not_vegetable: 189, in_between: 161, definitely_vegetable: 350 },
  soybean: { not_vegetable: 189, in_between: 126, definitely_vegetable: 385 },
  potato: { not_vegetable: 301, in_between: 98, definitely_vegetable: 301 },
  bell_pepper: { not_vegetable: 105, in_between: 70, definitely_vegetable: 525 },
  broccoli: { not_vegetable: 28, in_between: 112, definitely_vegetable: 560 },
  carrot: { not_vegetable: 70, in_between: 105, definitely_vegetable: 525 },
  cabbage: { not_vegetable: 70, in_between: 140, definitely_vegetable: 490 },
  spinach: { not_vegetable: 84, in_between: 161, definitely_vegetable: 455 },
  onion: { not_vegetable: 70, in_between: 210, definitely_vegetable: 420 },
  pea: { not_vegetable: 105, in_between: 210, definitely_vegetable: 385 },
  pak_choi: { not_vegetable: 140, in_between: 210, definitely_vegetable: 350 },
  rocket: { not_vegetable: 175, in_between: 210, definitely_vegetable: 315 },
  bamboo_shoot: { not_vegetable: 140, in_between: 210, definitely_vegetable: 350 },
  lotus_root: { not_vegetable: 175, in_between: 245, definitely_vegetable: 280 },
};

const BUCKET_ITEM_LABELS = Object.fromEntries(
  bucketItems.map((item) => [item.id, item.name]),
);

function userBucketsFromAnswers(answers) {
  const map = {};
  for (const [column, ids] of Object.entries(answers?.sortBuckets ?? {})) {
    for (const id of ids ?? []) map[id] = column;
  }
  return map;
}

function overlayCategory(category, answers) {
  if (!answers) {
    return {
      ...category,
      userVoteId: null,
      userVoteName: null,
      userCriteria: [],
      userSpectrum: [],
      userBuckets: {},
      userNoteText: '',
    };
  }

  const association =
    category.id === 'most-vegetable'
      ? answers.mostVegetable
      : answers.initialAssociation;
  const userVoteId = resolveVoteId(
    association?.canonicalId,
    association?.rawAnswer,
  );

  return {
    ...category,
    userVoteId,
    userVoteName:
      displayVoteName(association) ?? labelForVoteId(userVoteId),
    userCriteria: answers.initialCriteria ?? [],
    userSpectrum: answers.spectrum ?? [],
    userBuckets: userBucketsFromAnswers(answers),
    userNoteText: answers.openDescription?.text ?? '',
  };
}

function votesForColumn(columnId) {
  return Object.fromEntries(
    Object.entries(BUCKET_ITEM_VOTES).map(([id, split]) => [
      id,
      split[columnId],
    ]),
  );
}

function lookupRows(itemId, view) {
  const split = BUCKET_ITEM_VOTES[itemId];
  if (!split) return [];
  const total = view?.language ? view.votes : BUCKET_RESPONDENTS;
  const factor = view?.language ? view.votes / BUCKET_RESPONDENTS : 1;
  return BUCKET_COLUMNS.map((column) => {
    const votes = Math.round(split[column.id] * factor);
    return {
      id: column.id,
      title: column.title,
      votes,
      share: total ? votes / total : 0,
    };
  });
}

function rankBucketColumn(votesById, total, columnId, userBuckets) {
  return Object.entries(votesById)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([id, votes], index) => ({
      id,
      name: BUCKET_ITEM_LABELS[id] ?? id,
      votes,
      share: votes / total,
      rank: index + 1,
      isYours: userBuckets[id] === columnId,
    }));
}

function getBucketSection(category, region, view) {
  const userBuckets = category.userBuckets ?? {};
  const total = view?.language ? view.votes : BUCKET_RESPONDENTS;
  const columns = BUCKET_COLUMNS.map((column) => {
    const votes = reweightMap(votesForColumn(column.id), view?.shift ?? 0);
    const items = rankBucketColumn(
      view?.language
        ? Object.fromEntries(
          Object.entries(votes).map(([id, count]) => [
            id,
            Math.round(count * (view.votes / BUCKET_RESPONDENTS)),
          ]),
        )
        : votes,
      total,
      column.id,
      userBuckets,
    );
    const leader = items[0];
    return {
      ...column,
      items,
      leader,
      yoursCount: items.filter((item) => item.isYours).length,
    };
  });

  return {
    ...category,
    region,
    columns,
    lookupItems: bucketItems
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        userBucket: userBuckets[item.id] ?? null,
        rows: lookupRows(item.id, view),
      })),
    items: [],
    responseCount: total,
  };
}

function rankBoard(votesById) {
  const total = Object.values(votesById).reduce((sum, n) => sum + n, 0);
  return Object.entries(votesById)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, votes], index) => ({
      id,
      name: labelForVoteId(id) ?? humanizeVoteId(id),
      art: VEGETABLE_ART[id] ?? placeholder,
      votes,
      total,
      share: total ? votes / total : 0,
      rank: index + 1,
    }));
}

export const CATEGORIES = [
  {
    id: 'first-instincts',
    eyebrow: 'Question 1',
    designNote:
      'This question checks people’s first instincts. It looks for the common associations of the word “vegetable”: plants that are popular, easy to find in a shop, or simply eaten most often.',
    title: 'First instincts',
    prompt: 'Which vegetable comes to people\'s mind first?',
    layout: 'blades',
    userVoteId: 'broccoli',
  },
  {
    id: 'why-vegetabley',
    eyebrow: 'Question 2',
    designNote:
      'This question asks people to justify that first instinct. It nudges them to look again at their own criteria for what makes something a vegetable.',
    title: 'Why does it feel vegetabley?',
    prompt: 'The reasons people marked for their first instinct.',
    layout: 'reasons',
    userCriteria: DEV_SPEEDRUN.initialCriteria,
  },
  {
    id: 'sort-buckets',
    eyebrow: 'Question 3',
    designNote:
      'This question looks at the cultural idea of a vegetable, mixing familiar plants with less obvious ones. It tests the criteria people are using: savouriness, colour, how a plant is cooked, or its botanical status.',
    title: 'Which of these count as vegetables?',
    prompt: 'Not a vegetable, in-between, or definitely a vegetable?',
    layout: 'buckets',
  },
  {
    id: 'vegetabley-spectrum',
    eyebrow: 'Question 4',
    designNote:
      'These ten plants were selected as they represent different botanical families, or very different parts of the same family. Roots vs stems, leaves, flowers, fruits, and grains. This ranking is there to see whether the botanical status, plant anatomy, or geographic origin has any bearing on how vegetabley something feels.',
    title: 'Vegetableness spectrum',
    prompt:
      'From the least to the most vegetabley plants.',
    layout: 'spectrum',
    userSpectrum: DEV_SPEEDRUN.spectrum,
  },
  {
    id: 'most-vegetable',
    eyebrow: 'Question 5',
    designNote:
      'This question was inspired by the podcast The Rest Is Science. Like the spectrum before it, it asks people to sort and rank their judgment of edible plants. It comes late in the survey, after people have stress-tested the idea of a vegetable, so it can be compared with those first instincts.',
    title: 'The most vegetable vegetable',
    prompt: 'What feels most vegetabley?',
    layout: 'blades',
    userVoteId: 'turnip',
  },
  {
    id: 'vegetabley-words',
    eyebrow: 'Question 6',
    designNote:
      '“Vegetable” is a social idea. It depends on context, place, language, and more. This question gives people room to explain their earlier choices and describe the criteria they were using.',
    title: 'What makes something feel like a vegetable?',
    prompt:
      'People described their criteria for vegetableness.',
    layout: 'notes',
    userNoteText: DEV_SPEEDRUN.openDescription.text,
  },
];

export const REGIONS = [
  {
    id: 'global',
    name: 'World (including undisclosed)',
    iso3: null,
    kind: 'world',
    votes: 700,
    live: true,
  },
  {
    id: 'africa',
    name: 'Africa',
    iso3: null,
    kind: 'continent',
    votes: 24,
    live: true,
  },
  {
    id: 'asia',
    name: 'Asia',
    iso3: null,
    kind: 'continent',
    votes: 41,
    live: true,
  },
  {
    id: 'europe',
    name: 'Europe',
    iso3: null,
    kind: 'continent',
    votes: 127,
    live: true,
  },
  {
    id: 'north_america',
    name: 'North America',
    iso3: null,
    kind: 'continent',
    votes: 33,
    live: true,
  },
  {
    id: 'oceania',
    name: 'Oceania',
    iso3: null,
    kind: 'continent',
    votes: 22,
    live: true,
  },
  {
    id: 'south_america',
    name: 'South America',
    iso3: null,
    kind: 'continent',
    votes: 21,
    live: true,
  },
  { id: 'poland', name: 'Poland', iso3: 'POL', kind: 'country', votes: 86, live: true },
  { id: 'china', name: 'China', iso3: 'CHN', kind: 'country', votes: 28, live: true },
];

export const REGION_GROUPS = [
  { label: 'World', ids: ['global'] },
  {
    label: 'Continents',
    ids: CONTINENTS.map((continent) => continent.id),
  },
  { label: 'Countries', ids: ['poland', 'china'] },
];

export const LIVE_COUNTRIES = REGIONS.filter((region) => region.iso3);

export const VOTE_THRESHOLD = 20;

export function getCategory(categoryId) {
  return CATEGORIES.find((item) => item.id === categoryId) ?? CATEGORIES[0];
}

export function getRegion(regionId) {
  return REGIONS.find((item) => item.id === regionId) ?? REGIONS[0];
}

export const ALL_LANGUAGES_ID = 'all';

// Native languages people marked, by place. A missing pair means nobody gave it.
const NATIVE_COUNTS = {
  africa: {
    english: 6,
    french: 5,
    arabic: 7,
    swahili: 4,
    hausa: 3,
    yoruba: 2,
    amharic: 2,
    portuguese: 2,
    afrikaans: 1,
  },
  asia: {
    mandarin: 16,
    cantonese: 6,
    hakka: 3,
    wu_chinese: 2,
    min_nan: 2,
    english: 4,
    hindi: 5,
    malay: 3,
    japanese: 2,
    korean: 2,
    vietnamese: 2,
    thai: 1,
    indonesian: 2,
    bengali: 2,
    tamil: 1,
    arabic: 2,
  },
  europe: {
    polish: 70,
    english: 22,
    german: 14,
    french: 12,
    spanish: 8,
    italian: 6,
    ukrainian: 5,
    russian: 4,
    dutch: 3,
    swedish: 2,
    romanian: 2,
    portuguese: 2,
    mandarin: 3,
    cantonese: 1,
  },
  north_america: {
    english: 20,
    spanish: 8,
    french: 3,
    mandarin: 2,
  },
  oceania: {
    english: 14,
    mandarin: 3,
    maori: 2,
    samoan: 1,
  },
  south_america: {
    spanish: 12,
    portuguese: 4,
    brazilian_portuguese: 3,
    quechua: 1,
  },
  china: {
    mandarin: 18,
    cantonese: 7,
    hakka: 4,
    wu_chinese: 3,
    min_nan: 2,
    english: 5,
    malay: 2,
    hindi: 1,
  },
  poland: {
    polish: 74,
    english: 11,
    ukrainian: 4,
    german: 2,
    russian: 3,
  },
};

const CONTINENT_IDS = [
  'africa',
  'asia',
  'europe',
  'north_america',
  'oceania',
  'south_america',
];

function languageName(languageId) {
  return languages.find((item) => item.id === languageId)?.name ?? languageId;
}

export function nativeCount(regionId, languageId) {
  if (!languageId || languageId === ALL_LANGUAGES_ID) return 0;
  if (regionId === 'global') {
    return CONTINENT_IDS.reduce(
      (sum, id) => sum + (NATIVE_COUNTS[id]?.[languageId] ?? 0),
      0,
    );
  }
  return NATIVE_COUNTS[regionId]?.[languageId] ?? 0;
}

export function languagesForRegion(regionId) {
  const counts = regionId === 'global'
    ? CONTINENT_IDS.reduce((merged, id) => {
      for (const [languageId, count] of Object.entries(NATIVE_COUNTS[id] ?? {})) {
        merged[languageId] = (merged[languageId] ?? 0) + count;
      }
      return merged;
    }, {})
    : (NATIVE_COUNTS[regionId] ?? {});
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ id, name: languageName(id), count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export function regionsForLanguage(languageId) {
  if (!languageId || languageId === ALL_LANGUAGES_ID) {
    return REGIONS.map((region) => region.id);
  }
  return REGIONS
    .filter((region) => region.id === 'global' || nativeCount(region.id, languageId) > 0)
    .map((region) => region.id);
}

function hashFilter(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function reweightMap(votes, shift) {
  if (!shift) return votes;
  const ids = Object.keys(votes);
  if (ids.length < 2) return votes;
  const offset = shift % ids.length;
  const rotated = ids.slice(offset).concat(ids.slice(0, offset));
  return Object.fromEntries(ids.map((id, index) => [rotated[index], votes[id]]));
}

export function resultView(region, languageId) {
  const count = nativeCount(region.id, languageId);
  if (!languageId || languageId === ALL_LANGUAGES_ID || count <= 0) {
    return { region, language: null, votes: region.votes, shift: 0 };
  }
  const hash = hashFilter(`${region.id}:${languageId}`);
  return {
    region,
    language: { id: languageId, name: languageName(languageId) },
    votes: count,
    shift: (hash % 6) + 1,
  };
}

function artFor(id) {
  return VEGETABLE_ART[id] ?? placeholder;
}

export function getSection(categoryId, regionId, userAnswers = null, languageId = ALL_LANGUAGES_ID) {
  const category = overlayCategory(getCategory(categoryId), userAnswers);
  const region = getRegion(regionId);
  const view = resultView(region, languageId);
  if (category.layout === 'buckets') {
    return { ...getBucketSection(category, region, view), language: view.language };
  }
  if (category.layout === 'reasons') {
    return { ...getReasonsSection(category, region, view), language: view.language };
  }
  if (category.layout === 'spectrum') {
    return { ...getSpectrumSection(category, region, artFor, view), language: view.language };
  }
  if (category.layout === 'notes') {
    return { ...getNotesSection(category, region, view), language: view.language };
  }
  const source = BOARDS[region.id]?.[category.id] ?? BOARDS.global[category.id];
  const votes = view.language
    ? Object.fromEntries(
      Object.entries(reweightMap(source, view.shift)).map(([id, count]) => {
        const sum = Object.values(source).reduce((total, value) => total + value, 0) || 1;
        return [id, Math.max(0, Math.round(count * (view.votes / sum)))];
      }),
    )
    : source;
  const ranked = rankBoard(votes);
  const items = ranked.slice(0, BLADE_BOARD_SIZE);
  const userRanked = findRankedPick(
    ranked,
    category.userVoteId,
    category.userVoteName,
  );
  return {
    ...category,
    region,
    items,
    userRanked,
    userOnBoard: Boolean(userRanked && userRanked.rank <= items.length),
    responseCount: view.votes,
    language: view.language,
  };
}

export function nextCategoryId(categoryId) {
  const index = CATEGORIES.findIndex((item) => item.id === categoryId);
  return CATEGORIES[index + 1]?.id ?? null;
}

export function previousCategoryId(categoryId) {
  const index = CATEGORIES.findIndex((item) => item.id === categoryId);
  return CATEGORIES[index - 1]?.id ?? null;
}
