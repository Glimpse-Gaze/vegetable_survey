import { countries } from '../data/countries.js';

/** Extra English labels used in the world-map SVG titles. */
const SVG_TITLE_ALIASES = {
  'brunei darussalam': 'brunei',
  "côte d'ivoire": 'ivory_coast',
  "cote d'ivoire": 'ivory_coast',
  'ivory coast': 'ivory_coast',
  'the gambia': 'gambia',
  'lao pdr': 'laos',
  'dem. rep. korea': 'north_korea',
  'russian federation': 'russia',
  'kingdom of eswatini': 'eswatini',
  'republic of cabo verde': 'cabo_verde',
  'federated states of micronesia': 'micronesia',
  'são tomé and principe': 'sao_tome_and_principe',
  'sao tome and principe': 'sao_tome_and_principe',
  vatican: 'vatican_city',
  'democratic republic of the congo': 'congo_kinshasa',
  'republic of the congo': 'congo_brazzaville',
  'united states of america': 'united_states',
  'united states': 'united_states',
  'south korea': 'south_korea',
  'north korea': 'north_korea',
  'bosnia and herzegovina': 'bosnia_and_herzegovina',
  'czech republic': 'czechia',
  swaziland: 'eswatini',
  'greenland (den.)': 'greenland',
  greenland: 'greenland',
};

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeTitle(value) {
  return decodeEntities(value)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildIndex() {
  const index = new Map();

  for (const country of countries) {
    index.set(normalizeTitle(country.name), country.id);
    for (const alias of country.aliases ?? []) {
      index.set(normalizeTitle(alias), country.id);
    }
  }

  for (const [label, id] of Object.entries(SVG_TITLE_ALIASES)) {
    if (!index.has(label)) index.set(label, id);
  }

  return index;
}

const ENGLISH_NAME_INDEX = buildIndex();

/** Resolve a map SVG title (English) to a stable country id. */
export function countryIdFromMapTitle(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;
  return ENGLISH_NAME_INDEX.get(normalized) ?? null;
}
