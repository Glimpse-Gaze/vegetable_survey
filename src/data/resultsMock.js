import { CONTINENTS } from './continents.js';
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

function rankBoard(votesById) {
  const total = Object.values(votesById).reduce((sum, n) => sum + n, 0);
  return Object.entries(votesById)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, votes], index) => ({
      id,
      name: VEGETABLE_LABELS[id],
      art: VEGETABLE_ART[id],
      votes,
      total,
      share: votes / total,
      rank: index + 1,
    }));
}

export const CATEGORIES = [
  {
    id: 'first-instincts',
    eyebrow: 'Question 1',
    title: 'First instincts',
    prompt: 'Which vegetable comes to mind first?',
    userVoteId: 'broccoli',
  },
  {
    id: 'most-vegetable',
    eyebrow: 'Question 5',
    title: 'The most vegetable vegetable',
    prompt: 'What feels most vegetabley?',
    userVoteId: 'turnip',
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

export function getSection(categoryId, regionId) {
  const category = getCategory(categoryId);
  const region = getRegion(regionId);
  const votes = BOARDS[region.id]?.[category.id] ?? BOARDS.global[category.id];
  return {
    ...category,
    region,
    items: rankBoard(votes),
    responseCount: region.votes,
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
