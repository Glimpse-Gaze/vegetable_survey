import { useMemo, useSyncExternalStore } from 'react';
import { bucketItems } from '../data/bucketItems.js';
import { countries } from '../data/countries.js';
import { languages } from '../data/languages.js';
import { spectrumVegetables } from '../data/spectrumVegetables.js';
import { vegetables } from '../data/vegetables.js';
import { applyLexicon } from './applyLexicon.js';
import { useI18n } from './useI18n.js';
import { lexicons } from './lexicon/index.js';
import { normalizeQuery } from '../utils/normalization.js';

let chinesePhonetics = null;
let japanesePhonetics = null;
let chinesePromise = null;
let japanesePromise = null;
const chineseListeners = new Set();
const japaneseListeners = new Set();

function subscribeChinesePhonetics(listener) {
  chineseListeners.add(listener);
  chinesePromise ??= import('./zhPhonetics.js').then((mod) => {
    chinesePhonetics = mod.attachPhonetics;
    chinesePromise = null;
    for (const notify of chineseListeners) notify();
  });
  return () => chineseListeners.delete(listener);
}

function subscribeJapanesePhonetics(listener) {
  japaneseListeners.add(listener);
  japanesePromise ??= import('./jaPhonetics.js').then((mod) => {
    japanesePhonetics = mod.attachPhonetics;
    japanesePromise = null;
    for (const notify of japaneseListeners) notify();
  });
  return () => japaneseListeners.delete(listener);
}

const ignorePhonetics = () => () => {};

/** Spectrum ids such as corn are answers in their own right. Add one when its
 * localized name is not already the display name of another vegetable. */
function withDistinctSpectrum(items, lexicon) {
  const localized = applyLexicon(items, lexicon);
  const taken = new Set(localized.map((item) => normalizeQuery(item.name)));
  const ids = new Set(localized.map((item) => item.id));
  const extras = [];
  for (const source of spectrumVegetables) {
    if (ids.has(source.id)) continue;
    const [next] = applyLexicon(
      [{ id: source.id, name: source.name, aliases: [] }],
      lexicon,
    );
    const key = normalizeQuery(next.name);
    if (!key || taken.has(key)) continue;
    taken.add(key);
    ids.add(next.id);
    extras.push(next);
  }
  return [...localized, ...extras];
}

function usePhoneticsLoader(enabled, subscribe, getSnapshot) {
  return useSyncExternalStore(
    enabled ? subscribe : ignorePhonetics,
    () => (enabled ? getSnapshot() : null),
    () => null,
  );
}

export function useSurveyCatalog() {
  const { locale } = useI18n();
  const chinese = locale === 'zh' || locale === 'zh-hant';
  const japanese = locale === 'ja';
  const attachChinese = usePhoneticsLoader(
    chinese,
    subscribeChinesePhonetics,
    () => chinesePhonetics,
  );
  const attachJapanese = usePhoneticsLoader(
    japanese,
    subscribeJapanesePhonetics,
    () => japanesePhonetics,
  );
  const attachPhonetics = chinese ? attachChinese : japanese ? attachJapanese : null;
  const phoneticsReady = Boolean(attachPhonetics);

  return useMemo(() => {
    const lexicon = lexicons[locale] ?? {};
    const withPhonetics = (items) =>
      phoneticsReady && attachPhonetics ? attachPhonetics(items) : items;
    const localizedBuckets = withPhonetics(applyLexicon(bucketItems, lexicon.vegetables));
    const localizedSpectrum = withPhonetics(applyLexicon(spectrumVegetables, lexicon.vegetables));

    const localizedVegetables = withPhonetics(
      withDistinctSpectrum(vegetables, lexicon.vegetables),
    );
    const localizedCountries = withPhonetics(applyLexicon(countries, lexicon.countries));
    const localizedLanguages = withPhonetics(applyLexicon(languages, lexicon.languages));

    return {
      vegetables: localizedVegetables,
      countries: localizedCountries,
      languages: localizedLanguages,
      bucketItems: localizedBuckets,
      spectrumVegetables: localizedSpectrum,
      vegetablesById: new Map(localizedVegetables.map((item) => [item.id, item])),
      countriesById: new Map(localizedCountries.map((item) => [item.id, item])),
      languagesById: new Map(localizedLanguages.map((item) => [item.id, item])),
      bucketById: new Map(localizedBuckets.map((item) => [item.id, item])),
      spectrumById: new Map(localizedSpectrum.map((item) => [item.id, item])),
    };
  }, [locale, phoneticsReady, attachPhonetics]);
}
