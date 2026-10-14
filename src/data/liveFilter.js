import { CONTINENTS, continentOf, isContinentId, voteCountsForRegion } from './continents.js';
import { countries } from './countries.js';
import { criteria } from './criteria.js';
import { bucketItems } from './bucketItems.js';
import { iso3ForCountry } from './countryIso3.js';
import {
  ALL_LANGUAGES_ID,
  REGIONS,
  VOTE_THRESHOLD,
} from './resultsMock.js';
import {
  bandForRank,
  SLOT_COUNT,
  SPECTRUM_BANDS,
  spectrumVegetables,
} from './spectrumVegetables.js';
import { languages as languageCatalog } from './languages.js';

const countryNameById = Object.fromEntries(
  countries.map((country) => [country.id, country.name]),
);
const languageNameById = Object.fromEntries(
  languageCatalog.map((item) => [item.id, item.name]),
);
const criteriaLabelById = Object.fromEntries(
  criteria.map((item) => [item.id, item.label]),
);
const bucketLabelById = Object.fromEntries(
  bucketItems.map((item) => [item.id, item.name]),
);

const BUCKET_COLUMNS = [
  { id: 'not_vegetable', title: 'Not a vegetable' },
  { id: 'in_between', title: 'Something in-between' },
  { id: 'definitely_vegetable', title: 'Definite vegetable' },
];

export function isGlobalResultsView(regionId, languageId) {
  return regionId === 'global' && languageId === ALL_LANGUAGES_ID;
}

function bump(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + amount;
}

function shareOf(votes, respondents) {
  if (!respondents) return 0;
  return Math.min(1, Math.max(0, votes / respondents));
}

export function filterBallots(ballots, regionId = 'global', languageId = ALL_LANGUAGES_ID) {
  return (ballots ?? []).filter((ballot) => {
    if (regionId !== 'global' && !voteCountsForRegion(ballot.place, regionId)) {
      return false;
    }
    if (languageId !== ALL_LANGUAGES_ID) {
      if (!ballot.languages?.includes(languageId)) return false;
    }
    return true;
  });
}

export function aggregateBallots(ballots) {
  const associations = {};
  const mostVegetable = {};
  const criteriaVotes = {};
  const places = {};
  const languages = {};
  const buckets = {};
  const spectrum = {};
  const customReasons = [];
  const notes = [];

  (ballots ?? []).forEach((ballot, index) => {
    bump(associations, ballot.association);
    bump(mostVegetable, ballot.mostVegetable);
    for (const criterion of ballot.criteria ?? []) bump(criteriaVotes, criterion);
    bump(places, ballot.place);
    for (const language of ballot.languages ?? []) bump(languages, language);

    for (const [id, columnId] of Object.entries(ballot.buckets ?? {})) {
      if (!buckets[id]) {
        buckets[id] = {
          not_vegetable: 0,
          in_between: 0,
          definitely_vegetable: 0,
        };
      }
      if (columnId in buckets[id]) buckets[id][columnId] += 1;
    }

    if (Array.isArray(ballot.spectrum) && ballot.spectrum.length === SLOT_COUNT) {
      ballot.spectrum.forEach((id, slot) => {
        if (!spectrum[id]) {
          spectrum[id] = Array.from({ length: SLOT_COUNT }, () => 0);
        }
        spectrum[id][slot] += 1;
      });
    }

    if (ballot.customReason?.text) {
      customReasons.push({
        id: ballot.customReason.id ?? `live-reason-${index}`,
        text: ballot.customReason.text,
        boosts: 48,
        live: true,
      });
    }
    if (ballot.note?.text) {
      notes.push({
        id: ballot.note.id ?? `live-note-${index}`,
        text: ballot.note.text,
        boosts: 48,
        live: true,
      });
    }
  });

  return {
    liveCount: ballots?.length ?? 0,
    associations,
    mostVegetable,
    criteria: criteriaVotes,
    places,
    languages,
    buckets,
    spectrum,
    customReasons,
    notes,
  };
}

/** Live counts for places + rolled-up continents (for filters / map). */
export function livePlaceTallies(ballots) {
  const counts = {};
  for (const ballot of ballots ?? []) {
    const place = ballot.place;
    if (!place) continue;
    bump(counts, place);
    const continent = continentOf(place);
    if (continent && continent !== place) bump(counts, continent);
  }
  return counts;
}

export function liveLanguageTallies(ballots, regionId = 'global') {
  const scoped = filterBallots(ballots, regionId, ALL_LANGUAGES_ID);
  const counts = {};
  for (const ballot of scoped) {
    for (const language of ballot.languages ?? []) bump(counts, language);
  }
  return counts;
}

export function filterablePlaceIds(ballots, threshold = VOTE_THRESHOLD) {
  const tallies = livePlaceTallies(ballots);
  const ids = new Set(['global']);
  for (const [id, count] of Object.entries(tallies)) {
    if (count >= threshold) ids.add(id);
  }
  return ids;
}

export function filterableLanguages(ballots, regionId = 'global', threshold = VOTE_THRESHOLD) {
  const tallies = liveLanguageTallies(ballots, regionId);
  return Object.entries(tallies)
    .filter(([, count]) => count >= threshold)
    .map(([id, count]) => ({
      id,
      name: languageNameById[id] ?? id,
      count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export function placeFilterGroups(ballots, threshold = VOTE_THRESHOLD) {
  const ids = filterablePlaceIds(ballots, threshold);
  const continentIds = CONTINENTS.map((item) => item.id).filter((id) => ids.has(id));
  const countryIds = [...ids].filter(
    (id) => id !== 'global' && !isContinentId(id),
  ).sort((a, b) =>
    (countryNameById[a] ?? a).localeCompare(countryNameById[b] ?? b, 'en'),
  );

  return [
    { label: 'World', ids: ['global'] },
    continentIds.length ? { label: 'Continents', ids: continentIds } : null,
    countryIds.length ? { label: 'Countries', ids: countryIds } : null,
  ].filter(Boolean);
}

export function resolveLiveRegion(regionId, placeTallies = {}) {
  const known = REGIONS.find((region) => region.id === regionId);
  if (known) {
    return {
      ...known,
      votes: regionId === 'global'
        ? known.votes
        : placeTallies[regionId] ?? known.votes,
    };
  }
  return {
    id: regionId,
    name: countryNameById[regionId] ?? regionId,
    iso3: iso3ForCountry(regionId),
    kind: isContinentId(regionId) ? 'continent' : 'country',
    votes: placeTallies[regionId] ?? 0,
    live: true,
  };
}

function rankVotes(votesById, respondents, labelFor, limit = 12) {
  return Object.entries(votesById)
    .filter(([, votes]) => votes > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, votes], index) => ({
      id,
      name: labelFor(id),
      votes,
      total: respondents,
      share: shareOf(votes, respondents),
      rank: index + 1,
    }));
}

function buildBladeLive(category, region, language, aggregate, helpers) {
  const respondents = aggregate.liveCount;
  const source =
    category.id === 'most-vegetable'
      ? aggregate.mostVegetable
      : aggregate.associations;
  const ranked = rankVotes(
    source,
    respondents,
    (id) => helpers.labelFor?.(id) ?? id,
    helpers.boardSize ?? 12,
  );
  const items = ranked.map((item) => ({
    ...item,
    art: helpers.artFor?.(item.id),
  }));
  const userRanked = category.userVoteId
    ? ranked.find((item) => item.id === category.userVoteId)
      ?? items.find((item) => item.id === category.userVoteId)
      ?? null
    : null;

  return {
    ...category,
    region,
    language,
    items,
    userRanked,
    userOnBoard: Boolean(userRanked && userRanked.rank <= items.length),
    responseCount: respondents,
  };
}

function buildReasonsLive(category, region, language, aggregate) {
  const respondents = Math.max(1, aggregate.liveCount);
  const items = rankVotes(
    aggregate.criteria,
    respondents,
    (id) => criteriaLabelById[id] ?? id,
    5,
  ).map((item) => ({
    ...item,
    isYours: (category.userCriteria ?? []).includes(item.id),
  }));

  return {
    ...category,
    region,
    language,
    items,
    leader: items[0] ?? null,
    commentPool: aggregate.customReasons ?? [],
    responseCount: aggregate.liveCount,
  };
}

function buildBucketsLive(category, region, language, aggregate) {
  const respondents = Math.max(1, aggregate.liveCount);
  const userBuckets = category.userBuckets ?? {};

  const columns = BUCKET_COLUMNS.map((column) => {
    const votes = {};
    for (const [id, split] of Object.entries(aggregate.buckets ?? {})) {
      votes[id] = split?.[column.id] ?? 0;
    }
    const items = rankVotes(
      votes,
      respondents,
      (id) => bucketLabelById[id] ?? id,
      5,
    ).map((item) => ({
      ...item,
      isYours: userBuckets[item.id] === column.id,
    }));
    return {
      ...column,
      items,
      leader: items[0] ?? null,
      yoursCount: items.filter((item) => item.isYours).length,
    };
  });

  const lookupItems = bucketItems
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => {
      const split = aggregate.buckets?.[item.id] ?? {
        not_vegetable: 0,
        in_between: 0,
        definitely_vegetable: 0,
      };
      return {
        id: item.id,
        name: item.name,
        userBucket: userBuckets[item.id] ?? null,
        rows: BUCKET_COLUMNS.map((column) => ({
          id: column.id,
          title: column.title,
          votes: split[column.id] ?? 0,
          share: shareOf(split[column.id] ?? 0, respondents),
        })),
      };
    });

  return {
    ...category,
    region,
    language,
    columns,
    lookupItems,
    items: [],
    responseCount: aggregate.liveCount,
  };
}

function buildSpectrumLive(category, region, language, aggregate, helpers) {
  const respondents = Math.max(1, aggregate.liveCount);
  const items = spectrumVegetables
    .map((vegetable) => {
      const slotCounts =
        aggregate.spectrum?.[vegetable.id]
        ?? Array.from({ length: SLOT_COUNT }, () => 0);
      const weight = slotCounts.reduce((sum, n) => sum + n, 0) || 1;
      const meanRank =
        slotCounts.reduce((sum, count, index) => sum + (index + 1) * count, 0)
        / weight;
      const userSlot = (category.userSpectrum ?? []).indexOf(vegetable.id) + 1;
      return {
        ...vegetable,
        art: helpers.artFor?.(vegetable.id),
        slotCounts,
        slotShares: slotCounts.map((count) => count / weight),
        meanRank,
        userSlot: userSlot || null,
      };
    })
    .sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name))
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
    language,
    items,
    bands,
    responseCount: aggregate.liveCount,
  };
}

function buildNotesLive(category, region, language, aggregate) {
  return {
    ...category,
    region,
    language,
    notePool: aggregate.notes ?? [],
    userNoteText: category.userNoteText ?? '',
    responseCount: aggregate.liveCount,
  };
}

/**
 * Build a results section from live ballots only (no mock reweighting).
 */
export function buildLiveSection(category, regionId, languageId, ballots, helpers = {}) {
  const filtered = filterBallots(ballots, regionId, languageId);
  const aggregate = aggregateBallots(filtered);
  const placeTallies = livePlaceTallies(ballots);
  const region = resolveLiveRegion(regionId, placeTallies);
  const language =
    languageId && languageId !== ALL_LANGUAGES_ID
      ? { id: languageId, name: languageNameById[languageId] ?? languageId }
      : null;

  if (category.layout === 'blades') {
    return buildBladeLive(category, region, language, aggregate, helpers);
  }
  if (category.layout === 'reasons') {
    return buildReasonsLive(category, region, language, aggregate);
  }
  if (category.layout === 'buckets') {
    return buildBucketsLive(category, region, language, aggregate);
  }
  if (category.layout === 'spectrum') {
    return buildSpectrumLive(category, region, language, aggregate, helpers);
  }
  if (category.layout === 'notes') {
    return buildNotesLive(category, region, language, aggregate);
  }
  return {
    ...category,
    region,
    language,
    items: [],
    responseCount: aggregate.liveCount,
  };
}

/** Map countries from live tallies only (mock regions are not filter seeds). */
export function mapCountriesFromLiveTallies(placeTallies = {}) {
  const countriesOnMap = [];
  for (const [placeId, count] of Object.entries(placeTallies)) {
    if (!count || isContinentId(placeId)) continue;
    const iso3 = iso3ForCountry(placeId);
    if (!iso3) continue;
    countriesOnMap.push({
      id: placeId,
      name: countryNameById[placeId] ?? placeId,
      iso3,
      kind: 'country',
      votes: count,
      liveCount: count,
      live: count >= VOTE_THRESHOLD,
    });
  }
  return countriesOnMap;
}
