import { VOTE_THRESHOLD } from './resultsMock.js';
import { isPublishableText } from '../utils/publishableText.js';
import { iso3ForCountry } from './countryIso3.js';
import { countries } from './countries.js';
import {
  filterPublicVoteCounts,
  isCustomVoteKey,
} from '../utils/blockedLabels.js';

/** How heavily each live ballot counts relative to one mock vote at full sample size. */
export const LIVE_VOTE_BOOST = 36;

/** Keep showing the mix notice until live answers approach this. */
export const MIX_DISPLAY_TARGET = 700;

const countryNameById = Object.fromEntries(
  countries.map((country) => [country.id, country.name]),
);

export function emptyLiveSummary() {
  return {
    liveCount: 0,
    associations: {},
    mostVegetable: {},
    voteLabels: {},
    criteria: {},
    places: {},
    languages: {},
    buckets: {},
    spectrum: {},
    customReasons: [],
    notes: [],
    ballots: [],
  };
}

export function isMixingLive(live) {
  const count = live?.liveCount ?? 0;
  return count > 0 && count < MIX_DISPLAY_TARGET;
}

// Decay length that makes the first real ballot worth LIVE_VOTE_BOOST generated ones.
const SEED_DECAY = 1 / -Math.log(1 - LIVE_VOTE_BOOST / MIX_DISPLAY_TARGET);

/**
 * Generated ballots are multiplied by seedBoost, real ballots by liveBoost.
 * seedBoost starts at 1 and falls toward 0 as real answers arrive.
 * liveBoost starts at LIVE_VOTE_BOOST and eases down toward 1, so early
 * human votes move the board and later ones stop drowning the sample.
 * The displayed total stays at 700 until real answers pass it.
 */
export function mixWeights(liveCount) {
  const real = Math.max(0, Math.round(Number(liveCount) || 0));
  const target = MIX_DISPLAY_TARGET;
  if (real <= 0) {
    return { real: 0, display: target, seedBoost: 1, liveBoost: 0 };
  }
  if (real >= target) {
    return { real, display: real, seedBoost: 0, liveBoost: 1 };
  }
  const seedBoost = Math.exp(-real / SEED_DECAY);
  const liveBoost = ((1 - seedBoost) * target) / real;
  return { real, display: target, seedBoost, liveBoost };
}

function shareOf(votes, respondents) {
  if (!respondents) return 0;
  return Math.min(1, Math.max(0, votes / respondents));
}

/** Whole votes that sum to `total`. Remainder goes to the largest fractions. */
function allocateToTotal(entries, total) {
  const target = Math.max(0, Math.round(total));
  const list = entries.map((entry) => ({
    id: entry.id,
    weight: Math.max(0, Number(entry.weight) || 0),
  }));
  if (!list.length || target <= 0) {
    return Object.fromEntries(list.map((entry) => [entry.id, 0]));
  }
  const sum = list.reduce((totalWeight, entry) => totalWeight + entry.weight, 0);
  if (sum <= 0) {
    return Object.fromEntries(list.map((entry) => [entry.id, 0]));
  }
  const raw = list.map((entry) => (entry.weight / sum) * target);
  const counts = raw.map((value) => Math.floor(value));
  let left = target - counts.reduce((totalCount, count) => totalCount + count, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - counts[index] }))
    .sort((a, b) => b.frac - a.frac || list[a.index].id.localeCompare(list[b.index].id));
  for (let step = 0; step < order.length && left > 0; step += 1) {
    counts[order[step].index] += 1;
    left -= 1;
  }
  return Object.fromEntries(list.map((entry, index) => [entry.id, counts[index]]));
}

function blendedWeight(mockCount, liveCount, weights) {
  return (mockCount ?? 0) * weights.seedBoost + (liveCount ?? 0) * weights.liveBoost;
}

function rankBoard(votesById, artFor, labelFor) {
  const total = Object.values(votesById).reduce((sum, n) => sum + n, 0);
  return Object.entries(votesById)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, votes], index) => ({
      id,
      name: labelFor(id),
      art: artFor?.(id),
      votes,
      total,
      share: total ? votes / total : 0,
      rank: index + 1,
    }));
}

/**
 * Rebuild blade boards with live votes weighted over the mock tallies.
 * Counts are whole numbers and sum to the displayed sample.
 */
export function blendBladeSection(section, liveCounts, helpers, liveCount = 0) {
  const { artFor, labelFor } = helpers;
  const weights = mixWeights(liveCount);
  if (!liveCounts || !Object.keys(liveCounts).length) {
    return { ...section, responseCount: weights.display };
  }
  const baseVotes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  const ids = new Set([...Object.keys(baseVotes), ...Object.keys(liveCounts)]);
  const blended = allocateToTotal(
    [...ids].map((id) => ({
      id,
      weight: blendedWeight(baseVotes[id], liveCounts[id], weights),
    })),
    weights.display,
  );
  const ranked = rankBoard(blended, artFor, labelFor).map((item) => ({
    ...item,
    votes: Math.round(item.votes),
    share: item.share,
  }));
  const boardSize = section.items?.length ?? ranked.length;
  const items = ranked.slice(0, boardSize).map((item) => ({
    ...item,
    art: item.art ?? section.items.find((row) => row.id === item.id)?.art,
    name: item.name || section.items.find((row) => row.id === item.id)?.name || item.id,
  }));

  const userRanked = section.userVoteId
    ? ranked.find((item) => item.id === section.userVoteId) ?? null
    : section.userRanked;

  return {
    ...section,
    items,
    userRanked,
    userOnBoard: Boolean(userRanked && userRanked.rank <= items.length),
    responseCount: weights.display,
  };
}

/**
 * Each item is placed in exactly one bucket per respondent, so the three
 * column counts for an item must always sum to `respondents`. Live votes are
 * mixed into that split, then renormalized — never tacked on as unbounded extras.
 */
export function blendBucketSection(section, liveBuckets, liveCount = 0) {
  const weights = mixWeights(liveCount);
  const columnIds = (section.columns ?? []).map((column) => column.id);
  if (!columnIds.length) return { ...section, responseCount: weights.display };
  if (!liveBuckets || !Object.keys(liveBuckets).length) {
    return { ...section, responseCount: weights.display };
  }
  const respondents = weights.display;

  const splits = {};
  for (const item of section.lookupItems ?? []) {
    splits[item.id] = Object.fromEntries(
      (item.rows ?? []).map((row) => [row.id, row.votes ?? 0]),
    );
    for (const columnId of columnIds) {
      if (splits[item.id][columnId] == null) splits[item.id][columnId] = 0;
    }
  }

  for (const [id, liveSplit] of Object.entries(liveBuckets)) {
    if (!splits[id]) {
      splits[id] = Object.fromEntries(columnIds.map((columnId) => [columnId, 0]));
    }
    const mock = splits[id];
    const mockSum = columnIds.reduce((sum, columnId) => sum + (mock[columnId] ?? 0), 0);
    if (mockSum <= 0) {
      splits[id] = Object.fromEntries(
        columnIds.map((columnId) => [columnId, Math.round(liveSplit?.[columnId] ?? 0)]),
      );
      continue;
    }
    splits[id] = allocateToTotal(
      columnIds.map((columnId) => ({
        id: columnId,
        weight: blendedWeight(mock[columnId], liveSplit?.[columnId] ?? 0, weights),
      })),
      respondents,
    );
  }

  const nameById = Object.fromEntries(
    (section.lookupItems ?? []).map((item) => [item.id, item.name]),
  );
  for (const column of section.columns ?? []) {
    for (const item of column.items ?? []) {
      if (!nameById[item.id]) nameById[item.id] = item.name;
    }
  }

  const columns = section.columns.map((column) => {
    const votes = Object.fromEntries(
      Object.entries(splits).map(([id, split]) => [id, split[column.id] ?? 0]),
    );
    const items = Object.entries(votes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([id, count], index) => {
        const prior = column.items.find((item) => item.id === id);
        return {
          id,
          name: prior?.name ?? nameById[id] ?? id,
          votes: count,
          share: shareOf(count, respondents),
          rank: index + 1,
          isYours: prior?.isYours ?? section.userBuckets?.[id] === column.id,
        };
      });
    return {
      ...column,
      items,
      leader: items[0] ?? null,
      yoursCount: items.filter((item) => item.isYours).length,
    };
  });

  const lookupItems = (section.lookupItems ?? []).map((item) => {
    const split = splits[item.id];
    if (!split) return item;
    const rows = columnIds.map((columnId) => {
      const prior = item.rows?.find((row) => row.id === columnId);
      const votes = split[columnId] ?? 0;
      return {
        id: columnId,
        title: prior?.title ?? columnId,
        votes,
        share: shareOf(votes, respondents),
      };
    });
    return { ...item, rows };
  });

  return { ...section, columns, lookupItems, responseCount: respondents };
}

export function blendSpectrumSection(section, liveSpectrum, bandForRank, liveCount = 0) {
  const weights = mixWeights(liveCount);
  if (!section.items?.length) return { ...section, responseCount: weights.display };

  const items = section.items
    .map((item) => {
      const liveSlots = liveSpectrum?.[item.id];
      const weighted = (item.slotCounts ?? []).map(
        (count, index) => blendedWeight(count, liveSlots?.[index] ?? 0, weights),
      );
      const allocated = allocateToTotal(
        weighted.map((weight, index) => ({ id: String(index), weight })),
        weights.display,
      );
      const slotCounts = weighted.map((_, index) => allocated[String(index)] ?? 0);
      const weight = slotCounts.reduce((sum, count) => sum + count, 0) || 1;
      const meanRank =
        slotCounts.reduce((sum, count, index) => sum + (index + 1) * count, 0) /
        weight;
      return {
        ...item,
        slotCounts,
        slotShares: slotCounts.map((count) => count / weight),
        meanRank,
      };
    })
    .sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name))
    .map((item, index) => {
      const rank = index + 1;
      const band = typeof bandForRank === 'function' ? bandForRank(rank) : null;
      return {
        ...item,
        rank,
        bandId: band?.id ?? item.bandId,
      };
    });

  const bands = (section.bands ?? []).map((band) => ({
    ...band,
    items: items.filter((item) => item.bandId === band.id),
  }));

  return {
    ...section,
    items,
    bands,
    responseCount: weights.display,
  };
}

const TEXT_LOCALES = new Set([
  'en',
  'pl',
  'zh',
  'zh-hant',
  'ko',
  'th',
  'fr',
  'it',
  'de',
  'es',
  'es-mx',
  'pt-br',
  'pt-pt',
]);

function knownTextLocale(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return TEXT_LOCALES.has(raw) ? raw : '';
}

function normalizeTextLocale(value, text = '') {
  const known = knownTextLocale(value);
  // A stored survey language wins, even when the reply itself is written
  // in another language (a German session can still contain English).
  if (known) return known;
  // Unicode escapes: raw Polish letters in /…/ break Rolldown when bundling vite.config.
  if (
    /[\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c\u0104\u0106\u0118\u0141\u0143\u00d3\u015a\u0179\u017b]/.test(
      text,
    )
  ) {
    return 'pl';
  }
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  return 'en';
}

/** Keep only live free-text answers written in the active UI locale. */
export function liveTextItemsForLocale(items, locale = 'en') {
  const want = normalizeTextLocale(locale);
  return (items ?? []).filter((item) => {
    const text = String(item?.text ?? '');
    if (!isPublishableText(text)) return false;
    return normalizeTextLocale(item?.locale, text) === want;
  });
}

/**
 * Put real answers first and drop an equal number of AI fillers so the pool
 * size stays stable (e.g. 5 live + 55 mock instead of 65 total).
 */
export function mergeLiveOverMock(mockPool, liveItems) {
  const mock = Array.isArray(mockPool) ? mockPool : [];
  if (!liveItems?.length) return mock;

  const seen = new Set();
  const live = [];
  for (const item of liveItems) {
    const key = String(item?.text ?? '')
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    live.push({ ...item, live: true });
  }
  if (!live.length) return mock;

  const ai = mock.filter((item) => {
    const key = String(item?.text ?? '')
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const keepAi = Math.max(0, mock.length - live.length);
  return [...live, ...ai.slice(0, keepAi)];
}

export function isLiveTextItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.live) return true;
  return String(item.id ?? '').startsWith('live-');
}

export function blendReasonSection(section, liveReasons, locale = 'en') {
  const scoped = liveTextItemsForLocale(liveReasons, locale);
  if (!scoped.length) return section;
  const next = mergeLiveOverMock(section.commentPool, scoped);
  if (next === section.commentPool) return section;
  return { ...section, commentPool: next };
}

export function blendNoteSection(section, liveNotes, locale = 'en') {
  const scoped = liveTextItemsForLocale(liveNotes, locale);
  if (!scoped.length) return section;
  const next = mergeLiveOverMock(section.notePool, scoped);
  if (next === section.notePool) return section;
  return { ...section, notePool: next };
}

export function blendReasonCriteria(section, liveCriteria, liveCount = 0) {
  const weights = mixWeights(liveCount);
  if (!liveCriteria || !Object.keys(liveCriteria).length) {
    return { ...section, responseCount: weights.display };
  }
  const votes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  for (const id of Object.keys(liveCriteria)) {
    if (votes[id] == null) votes[id] = 0;
  }
  const items = Object.entries(votes)
    .map(([id, mockCount]) => {
      const weight = blendedWeight(mockCount, liveCriteria[id], weights);
      const denom = weights.seedBoost <= 0
        ? weights.display
        : (section.responseCount || MIX_DISPLAY_TARGET) * weights.seedBoost
          + weights.real * weights.liveBoost;
      const share = denom > 0 ? Math.min(1, Math.max(0, weight / denom)) : 0;
      const shown = Math.max(0, Math.min(weights.display, Math.round(share * weights.display)));
      return { id, shown, share };
    })
    .sort((a, b) => b.shown - a.shown || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map((entry, index) => {
      const prior = section.items.find((item) => item.id === entry.id);
      return {
        id: entry.id,
        name: prior?.name ?? entry.id,
        votes: entry.shown,
        share: entry.share,
        rank: index + 1,
        isYours: prior?.isYours ?? false,
      };
    });
  return {
    ...section,
    items,
    leader: items[0],
    responseCount: weights.display,
  };
}

/**
 * Catalogue veggies stay global; custom:* labels only count in the UI locale
 * they were written under.
 */
function voteCountsForUiLocale(counts, ballots, field, locale, labels) {
  const want = normalizeTextLocale(locale);
  const next = { ...(counts ?? {}) };
  for (const key of Object.keys(next)) {
    if (isCustomVoteKey(key)) delete next[key];
  }
  for (const ballot of ballots ?? []) {
    if (normalizeTextLocale(ballot?.locale) !== want) continue;
    const key = ballot?.[field];
    if (!isCustomVoteKey(key)) continue;
    next[key] = (next[key] ?? 0) + 1;
  }
  return filterPublicVoteCounts(next, labels ?? {}, want);
}

export function applyLiveBlend(section, categoryId, live, helpers = {}) {
  if (!live?.liveCount) return section;
  const locale = helpers.locale ?? 'en';
  let next = section;

  const sample = live.liveCount;
  if (categoryId === 'first-instincts') {
    next = blendBladeSection(
      next,
      voteCountsForUiLocale(
        live.associations,
        live.ballots,
        'association',
        locale,
        live.voteLabels,
      ),
      helpers,
      sample,
    );
  } else if (categoryId === 'most-vegetable') {
    next = blendBladeSection(
      next,
      voteCountsForUiLocale(
        live.mostVegetable,
        live.ballots,
        'mostVegetable',
        locale,
        live.voteLabels,
      ),
      helpers,
      sample,
    );
  } else if (categoryId === 'why-vegetabley') {
    next = blendReasonCriteria(next, live.criteria, sample);
    next = blendReasonSection(next, live.customReasons, locale);
  } else if (categoryId === 'sort-buckets') {
    next = blendBucketSection(next, live.buckets, sample);
  } else if (categoryId === 'vegetabley-spectrum') {
    next = blendSpectrumSection(next, live.spectrum, helpers.bandForRank, sample);
  } else if (categoryId === 'vegetabley-words') {
    next = blendNoteSection(next, live.notes, locale);
  }

  return { ...next, responseCount: mixWeights(sample).display };
}

/**
 * Merge mock map countries with live place counts.
 * ≥ threshold → filterable green; 1..threshold-1 → emerging orange.
 */
export function mapCountriesFromLive(mockLiveCountries, livePlaces = {}) {
  const byId = new Map(
    mockLiveCountries.map((country) => [country.id, { ...country }]),
  );

  for (const [placeId, count] of Object.entries(livePlaces)) {
    if (!count) continue;
    const iso3 = iso3ForCountry(placeId);
    if (!iso3) continue;
    const existing = byId.get(placeId);
    if (existing) {
      byId.set(placeId, {
        ...existing,
        votes: Math.max(existing.votes, count),
        liveCount: count,
      });
    } else {
      byId.set(placeId, {
        id: placeId,
        name: countryNameById[placeId] ?? placeId,
        iso3,
        kind: 'country',
        votes: count,
        liveCount: count,
        live: count >= VOTE_THRESHOLD,
      });
    }
  }

  return [...byId.values()];
}
