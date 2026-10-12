import { useMemo } from 'react';
import { bucketItems } from '../data/bucketItems.js';
import { countries } from '../data/countries.js';
import { languages } from '../data/languages.js';
import { spectrumVegetables } from '../data/spectrumVegetables.js';
import { vegetables } from '../data/vegetables.js';
import { applyLexicon } from './applyLexicon.js';
import { useI18n } from './useI18n.js';
import { lexicons } from './lexicon/index.js';

export function useSurveyCatalog() {
  const { locale } = useI18n();

  return useMemo(() => {
    const lexicon = lexicons[locale] ?? {};
    const localizedBuckets = applyLexicon(bucketItems, lexicon.vegetables);
    const localizedSpectrum = applyLexicon(spectrumVegetables, lexicon.vegetables);

    const localizedVegetables = applyLexicon(vegetables, lexicon.vegetables);
    const localizedCountries = applyLexicon(countries, lexicon.countries);
    const localizedLanguages = applyLexicon(languages, lexicon.languages);

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
  }, [locale]);
}
