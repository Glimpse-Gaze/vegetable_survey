import { useMemo, useSyncExternalStore } from 'react';
import { bucketItems } from '../data/bucketItems.js';
import { countries } from '../data/countries.js';
import { languages } from '../data/languages.js';
import { spectrumVegetables } from '../data/spectrumVegetables.js';
import { vegetables } from '../data/vegetables.js';
import { applyLexicon } from './applyLexicon.js';
import { useI18n } from './useI18n.js';
import { lexicons } from './lexicon/index.js';

let chinesePhonetics = null;
let phoneticsPromise = null;
const phoneticsListeners = new Set();

function subscribePhonetics(listener) {
  phoneticsListeners.add(listener);
  phoneticsPromise ??= import('./zhPhonetics.js').then((mod) => {
    chinesePhonetics = mod.attachPhonetics;
    phoneticsPromise = null;
    for (const notify of phoneticsListeners) notify();
  });
  return () => phoneticsListeners.delete(listener);
}

const ignorePhonetics = () => () => {};

function useChinesePhonetics(enabled) {
  return useSyncExternalStore(
    enabled ? subscribePhonetics : ignorePhonetics,
    () => (enabled ? chinesePhonetics : null),
    () => null,
  );
}

export function useSurveyCatalog() {
  const { locale } = useI18n();
  const attachPhonetics = useChinesePhonetics(locale === 'zh');

  return useMemo(() => {
    const lexicon = lexicons[locale] ?? {};
    const withPhonetics = (items) =>
      locale === 'zh' && attachPhonetics ? attachPhonetics(items) : items;
    const localizedBuckets = withPhonetics(applyLexicon(bucketItems, lexicon.vegetables));
    const localizedSpectrum = withPhonetics(applyLexicon(spectrumVegetables, lexicon.vegetables));

    const localizedVegetables = withPhonetics(applyLexicon(vegetables, lexicon.vegetables));
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
  }, [locale, attachPhonetics]);
}
