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

    return {
      vegetables: applyLexicon(vegetables, lexicon.vegetables),
      countries: applyLexicon(countries, lexicon.countries),
      languages: applyLexicon(languages, lexicon.languages),
      bucketItems: localizedBuckets,
      spectrumVegetables: localizedSpectrum,
      bucketById: new Map(localizedBuckets.map((item) => [item.id, item])),
      spectrumById: new Map(localizedSpectrum.map((item) => [item.id, item])),
    };
  }, [locale]);
}
