import { VOTE_THRESHOLD } from './resultsMock.js';
import { iso3ForCountry } from './countryIso3.js';
import { countries } from './countries.js';

/** How heavily each live ballot counts relative to one mock vote. */
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
  };
}

export function isMixingLive(live) {
  const count = live?.liveCount ?? 0;
  return count > 0 && count < MIX_DISPLAY_TARGET;
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
  const baseVotes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  // Preserve long-tail mock items not in the top board by using item totals from ranks
  const blended = boostMap(baseVotes, liveCounts);
  const ranked = rankBoard(blended, artFor, labelFor);
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

export function blendBucketSection(section, liveBuckets) {
  if (!liveBuckets || !Object.keys(liveBuckets).length) return section;

  const columns = section.columns.map((column) => {
    const votes = Object.fromEntries(
      column.items.map((item) => [item.id, item.votes]),
    );
    for (const [id, split] of Object.entries(liveBuckets)) {
      const extra = (split?.[column.id] ?? 0) * LIVE_VOTE_BOOST;
      if (!extra) continue;
      votes[id] = (votes[id] ?? 0) + extra;
    }
    const total = section.responseCount || 1;
    const items = Object.entries(votes)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([id, count], index) => {
        const prior = column.items.find((item) => item.id === id);
        return {
          id,
          name: prior?.name ?? id,
          votes: count,
          share: count / total,
          rank: index + 1,
          isYours: prior?.isYours ?? section.userBuckets?.[id] === column.id,
        };
      });
    return {
      ...column,
      items,
      leader: items[0],
      yoursCount: items.filter((item) => item.isYours).length,
    };
  });

  const lookupItems = section.lookupItems.map((item) => {
    const live = liveBuckets[item.id];
    if (!live) return item;
    const rows = item.rows.map((row) => {
      const extra = (live[row.id] ?? 0) * LIVE_VOTE_BOOST;
      const votes = row.votes + extra;
      return {
        ...row,
        votes,
        share: section.responseCount ? votes / section.responseCount : row.share,
      };
    });
    return { ...item, rows };
  });

  return { ...section, columns, lookupItems };
}

export function blendSpectrumSection(section, liveSpectrum, bandForRank) {
  if (!liveSpectrum || !Object.keys(liveSpectrum).length) return section;

  const items = section.items
    .map((item) => {
      const liveSlots = liveSpectrum[item.id];
      if (!liveSlots) return item;
      const slotCounts = item.slotCounts.map(
        (count, index) => count + (liveSlots[index] ?? 0) * LIVE_VOTE_BOOST,
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

export function blendReasonSection(section, liveReasons) {
  if (!liveReasons?.length) return section;
  const existing = new Set(
    (section.commentPool ?? []).map((item) => item.text.trim().toLowerCase()),
  );
  const extras = liveReasons.filter(
    (item) => item.text && !existing.has(item.text.trim().toLowerCase()),
  );
  if (!extras.length) return section;
  return {
    ...section,
    commentPool: [...extras, ...(section.commentPool ?? [])],
  };
}

export function blendNoteSection(section, liveNotes) {
  if (!liveNotes?.length) return section;
  const existing = new Set(
    (section.notePool ?? []).map((item) => item.text.trim().toLowerCase()),
  );
  const extras = liveNotes.filter(
    (item) => item.text && !existing.has(item.text.trim().toLowerCase()),
  );
  if (!extras.length) return section;
  return {
    ...section,
    notePool: [...extras, ...(section.notePool ?? [])],
  };
}

export function blendReasonCriteria(section, liveCriteria) {
  if (!liveCriteria || !Object.keys(liveCriteria).length) return section;
  const respondents = Math.max(1, section.responseCount);
  const votes = Object.fromEntries(
    (section.items ?? []).map((item) => [item.id, item.votes]),
  );
  for (const [id, count] of Object.entries(liveCriteria)) {
    if (!count) continue;
    votes[id] = (votes[id] ?? 0) + count * LIVE_VOTE_BOOST;
  }
  const items = Object.entries(votes)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([id, count], index) => {
      const prior = section.items.find((item) => item.id === id);
      return {
        id,
        name: prior?.name ?? id,
        votes: count,
        share: Math.min(1, count / respondents),
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
  let next = section;

  if (categoryId === 'first-instincts') {
    next = blendBladeSection(next, live.associations, helpers);
  } else if (categoryId === 'most-vegetable') {
    next = blendBladeSection(next, live.mostVegetable, helpers);
  } else if (categoryId === 'why-vegetabley') {
    next = blendReasonCriteria(next, live.criteria);
    next = blendReasonSection(next, live.customReasons);
  } else if (categoryId === 'sort-buckets') {
    next = blendBucketSection(next, live.buckets);
  } else if (categoryId === 'vegetabley-spectrum') {
    next = blendSpectrumSection(next, live.spectrum, helpers.bandForRank);
  } else if (categoryId === 'vegetabley-words') {
    next = blendNoteSection(next, live.notes);
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
