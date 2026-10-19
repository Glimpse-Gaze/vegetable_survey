import { VOTE_THRESHOLD } from './resultsMock.js';
import { iso3ForCountry } from './countryIso3.js';
import { countries } from './countries.js';

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

function liveBoostFor(respondents) {
  const sample = Math.max(1, respondents || MIX_DISPLAY_TARGET);
  return LIVE_VOTE_BOOST * (sample / MIX_DISPLAY_TARGET);
}

function shareOf(votes, respondents) {
  if (!respondents) return 0;
  return Math.min(1, Math.max(0, votes / respondents));
}

function boostMap(base, liveCounts, boost = LIVE_VOTE_BOOST) {
  const next = { ...base };
  for (const [id, count] of Object.entries(liveCounts ?? {})) {
    if (!count) continue;
    next[id] = (next[id] ?? 0) + count * boost;
  }
  return next;
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
 * Keeps the displayed responseCount from the mock section.
 */
export function blendBladeSection(section, liveCounts, { artFor, labelFor }) {
  if (!liveCounts || !Object.keys(liveCounts).length) return section;
  const respondents = Math.max(1, section.responseCount || MIX_DISPLAY_TARGET);
  const boost = liveBoostFor(respondents);
  const baseVotes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  const blended = boostMap(baseVotes, liveCounts, boost);
  const ranked = rankBoard(blended, artFor, labelFor).map((item) => ({
    ...item,
    // Blades show share of the board total; keep that relative slice.
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
  };
}

/**
 * Each item is placed in exactly one bucket per respondent, so the three
 * column counts for an item must always sum to `respondents`. Live votes are
 * mixed into that split, then renormalized — never tacked on as unbounded extras.
 */
function renormalizeBucketSplit(split, columnIds, respondents) {
  const raw = Object.fromEntries(
    columnIds.map((id) => [id, Math.max(0, split?.[id] ?? 0)]),
  );
  const sum = columnIds.reduce((total, id) => total + raw[id], 0);
  if (sum <= 0) {
    return Object.fromEntries(columnIds.map((id) => [id, 0]));
  }

  const next = {};
  let allocated = 0;
  columnIds.forEach((id, index) => {
    if (index === columnIds.length - 1) {
      next[id] = Math.max(0, respondents - allocated);
      return;
    }
    const votes = Math.round((raw[id] / sum) * respondents);
    next[id] = votes;
    allocated += votes;
  });
  return next;
}

export function blendBucketSection(section, liveBuckets) {
  if (!liveBuckets || !Object.keys(liveBuckets).length) return section;

  const respondents = Math.max(1, section.responseCount || MIX_DISPLAY_TARGET);
  const boost = liveBoostFor(respondents);
  const columnIds = (section.columns ?? []).map((column) => column.id);
  if (!columnIds.length) return section;

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
    for (const columnId of columnIds) {
      const extra = (liveSplit?.[columnId] ?? 0) * boost;
      if (!extra) continue;
      splits[id][columnId] = (splits[id][columnId] ?? 0) + extra;
    }
  }

  for (const id of Object.keys(splits)) {
    splits[id] = renormalizeBucketSplit(splits[id], columnIds, respondents);
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

  return { ...section, columns, lookupItems };
}

export function blendSpectrumSection(section, liveSpectrum, bandForRank) {
  if (!liveSpectrum || !Object.keys(liveSpectrum).length) return section;
  const respondents = Math.max(1, section.responseCount || MIX_DISPLAY_TARGET);
  const boost = liveBoostFor(respondents);

  const items = section.items
    .map((item) => {
      const liveSlots = liveSpectrum[item.id];
      if (!liveSlots) return item;
      const slotCounts = item.slotCounts.map(
        (count, index) => count + (liveSlots[index] ?? 0) * boost,
      );
      const weight = slotCounts.reduce((sum, n) => sum + n, 0) || 1;
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
  };
}

const TEXT_LOCALES = new Set(['en', 'pl', 'zh', 'fr', 'it', 'de', 'es']);

function knownTextLocale(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .split('-')[0];
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
    if (!text.trim()) return false;
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
  if (!liveCriteria || !Object.keys(liveCriteria).length) return section;
  const respondents = Math.max(1, section.responseCount || MIX_DISPLAY_TARGET);
  const boost = liveBoostFor(respondents);
  const sample = Math.max(0, Number(liveCount) || 0);
  // Each live ballot counts as `boost` mock ballots. Grow the denominator
  // with that sample so a popular criterion is a share of people, not a
  // count that then gets clamped to 100% on its own.
  const denom = respondents + sample * boost;
  const votes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  for (const [id, count] of Object.entries(liveCriteria)) {
    if (!count) continue;
    votes[id] = (votes[id] ?? 0) + count * boost;
  }
  const items = Object.entries(votes)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([id, count], index) => {
      const prior = section.items.find((item) => item.id === id);
      const share = shareOf(count, denom);
      return {
        id,
        name: prior?.name ?? id,
        votes: Math.round(share * respondents),
        share,
        rank: index + 1,
        isYours: prior?.isYours ?? false,
      };
    });
  return {
    ...section,
    items,
    leader: items[0],
  };
}

export function applyLiveBlend(section, categoryId, live, helpers = {}) {
  if (!live?.liveCount) return section;
  const locale = helpers.locale ?? 'en';
  let next = section;

  if (categoryId === 'first-instincts') {
    next = blendBladeSection(next, live.associations, helpers);
  } else if (categoryId === 'most-vegetable') {
    next = blendBladeSection(next, live.mostVegetable, helpers);
  } else if (categoryId === 'why-vegetabley') {
    next = blendReasonCriteria(next, live.criteria, live.liveCount);
    next = blendReasonSection(next, live.customReasons, locale);
  } else if (categoryId === 'sort-buckets') {
    next = blendBucketSection(next, live.buckets);
  } else if (categoryId === 'vegetabley-spectrum') {
    next = blendSpectrumSection(next, live.spectrum, helpers.bandForRank);
  } else if (categoryId === 'vegetabley-words') {
    next = blendNoteSection(next, live.notes, locale);
  }

  return next;
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
