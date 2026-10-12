/**
 * Survey languages.
 *
 * To add one:
 * 1. Append an entry here (id, nativeName, htmlLang).
 * 2. Add src/i18n/messages/<id>.js and register it in src/i18n/messages/index.js.
 * 3. Add src/i18n/lexicon/<id>.js (vegetables, countries, languages) and register it
 *    in src/i18n/lexicon/index.js.
 *
 * English is the source catalog. A missing string or name falls back to English.
 * Stable ids (carrot, poland, …) stay in English in stored answers.
 */
export const LOCALES = [
  { id: 'en', nativeName: 'English', htmlLang: 'en' },
  { id: 'pl', nativeName: 'Polski', htmlLang: 'pl' },
];

export const DEFAULT_LOCALE = 'en';

const LOCALE_IDS = new Set(LOCALES.map((locale) => locale.id));

export function isLocale(value) {
  return LOCALE_IDS.has(value);
}
