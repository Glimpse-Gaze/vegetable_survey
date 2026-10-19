import {
  isLiveTextItem,
  liveTextItemsForLocale,
  mergeLiveOverMock,
} from '../data/blendLiveResults.js';
import { commentsForLocale } from '../data/reasonResults.js';
import { notesForLocale } from '../data/noteResults.js';
import { spectrumCopy as spectrumCopyPl } from './lexicon/pl/spectrumCopy.js';
import { spectrumCopy as spectrumCopyZh } from './lexicon/zh/spectrumCopy.js';
import { spectrumCopy as spectrumCopyFr } from './lexicon/fr/spectrumCopy.js';
import { spectrumCopy as spectrumCopyIt } from './lexicon/it/spectrumCopy.js';
import { spectrumCopy as spectrumCopyDe } from './lexicon/de/spectrumCopy.js';
import { spectrumCopy as spectrumCopyEs } from './lexicon/es/spectrumCopy.js';
import { spectrumCopy as spectrumCopyZhHant } from './lexicon/zh-hant/spectrumCopy.js';
import { spectrumCopy as spectrumCopyKo } from './lexicon/ko/spectrumCopy.js';
import { spectrumCopy as spectrumCopyTh } from './lexicon/th/spectrumCopy.js';
import { spectrumCopy as spectrumCopyEsMx } from './lexicon/es-mx/spectrumCopy.js';
import { spectrumCopy as spectrumCopyPtBr } from './lexicon/pt-br/spectrumCopy.js';
import { spectrumCopy as spectrumCopyPtPt } from './lexicon/pt-pt/spectrumCopy.js';

const BAND_KEYS = {
  least: 'q4.least',
  middle: 'q4.middle',
  most: 'q4.most',
};

const SPECTRUM_COPY = {
  pl: spectrumCopyPl,
  zh: spectrumCopyZh,
  fr: spectrumCopyFr,
  it: spectrumCopyIt,
  de: spectrumCopyDe,
  es: spectrumCopyEs,
  'zh-hant': spectrumCopyZhHant,
  ko: spectrumCopyKo,
  th: spectrumCopyTh,
  'es-mx': spectrumCopyEsMx,
  'pt-br': spectrumCopyPtBr,
  'pt-pt': spectrumCopyPtPt,
};

function withSpectrumCopy(item, locale) {
  const copy = SPECTRUM_COPY[locale]?.[item.id];
  if (!copy) return item;
  return {
    ...item,
    note: copy.note ?? item.note,
    fact: copy.fact ?? item.fact,
  };
}

function nameFromMaps(id, fallback, maps) {
  if (!id) return fallback;
  for (const map of maps) {
    const hit = map.get(id);
    if (hit?.name) return hit.name;
  }
  return fallback;
}

function remapItem(item, maps, t) {
  if (!item || typeof item !== 'object') return item;
  const next = {
    ...item,
    name: nameFromMaps(item.id, item.name, maps),
  };
  if (item.leader) next.leader = remapItem(item.leader, maps, t);
  if (Array.isArray(item.items)) {
    next.items = item.items.map((entry) => remapItem(entry, maps, t));
  }
  if (Array.isArray(item.rows)) {
    next.rows = item.rows.map((row) => ({
      ...row,
      title: t(`results.buckets.title.${row.id}`, row.title),
    }));
  }
  return next;
}

/** Overlay translated chrome and lexicon names onto a results section. */
export function localizeResultsSection(section, catalog, t, locale = 'en') {
  if (!section) return section;

  const maps = [
    catalog.vegetablesById,
    catalog.countriesById,
    catalog.languagesById,
    catalog.bucketById,
    catalog.spectrumById,
  ];

  const copy = t(`results.categories.${section.id}.title`)
    ? {
        eyebrow: t(`results.categories.${section.id}.eyebrow`),
        title: t(`results.categories.${section.id}.title`),
        prompt: t(`results.categories.${section.id}.prompt`),
        designNote: t(`results.categories.${section.id}.designNote`),
      }
    : {};

  const next = {
    ...section,
    ...copy,
  };

  if (section.region) {
    next.region = {
      ...section.region,
      name:
        section.region.id === 'global'
          ? t('results.worldRegion')
          : nameFromMaps(section.region.id, section.region.name, maps),
    };
  }

  if (section.language) {
    next.language = {
      ...section.language,
      name: nameFromMaps(section.language.id, section.language.name, maps),
    };
  }

  if (Array.isArray(section.items)) {
    next.items = section.items.map((item) => {
      const remapped = remapItem(item, maps, t);
      if (item.id && t(`criteria.${item.id}`) !== `criteria.${item.id}`) {
        remapped.name = t(`criteria.${item.id}`);
      }
      return remapped;
    });
    if (next.items[0]) next.leader = next.items[0];
  }

  if (Array.isArray(section.columns)) {
    next.columns = section.columns.map((column) => ({
      ...remapItem(column, maps, t),
      title: t(`results.buckets.title.${column.id}`),
      leader: column.leader ? remapItem(column.leader, maps, t) : null,
    }));
  }

  if (Array.isArray(section.lookupItems)) {
    next.lookupItems = section.lookupItems.map((item) => remapItem(item, maps, t));
  }

  if (Array.isArray(section.bands)) {
    next.bands = section.bands.map((band) => ({
      ...band,
      title: t(BAND_KEYS[band.id] ?? band.title),
      items: (band.items ?? []).map((item) =>
        withSpectrumCopy(remapItem(item, maps, t), locale),
      ),
    }));
  }

  if (section.userRanked) {
    next.userRanked = remapItem(section.userRanked, maps, t);
  }

  if (section.userVoteName || section.userVoteId) {
    next.userVoteName = nameFromMaps(
      section.userVoteId,
      section.userVoteName,
      maps,
    );
  }

  if (Array.isArray(section.commentPool)) {
    // Locale swap keeps same-locale live custom reasons; AI fillers swap fully.
    const live = liveTextItemsForLocale(
      section.commentPool.filter(isLiveTextItem),
      locale,
    );
    next.commentPool = mergeLiveOverMock(commentsForLocale(locale), live);
  }

  if (Array.isArray(section.notePool)) {
    const live = liveTextItemsForLocale(
      section.notePool.filter(isLiveTextItem),
      locale,
    );
    next.notePool = mergeLiveOverMock(notesForLocale(locale), live);
  }

  return next;
}
