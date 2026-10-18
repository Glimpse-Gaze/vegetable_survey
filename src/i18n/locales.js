/**
 * Survey languages.
 *
 * To add one:
 * 1. Append an entry here (id, nativeName, htmlLang).
 * 2. Add src/i18n/messages/<id>.js and register it in src/i18n/messages/index.js.
 * 3. Add src/i18n/lexicon/<id>/ (vegetables, countries, languages) and register it
 *    in src/i18n/lexicon/index.js. Chinese also gets pinyin and zhuyin at catalog load.
 *
 * English is the source catalog. A missing string or name falls back to English.
 * Stable ids (carrot, poland, …) stay in English in stored answers.
 */
export const LOCALES = [
  { id: 'en', nativeName: 'English', htmlLang: 'en' },
  { id: 'pl', nativeName: 'Polski', htmlLang: 'pl' },
  { id: 'zh', nativeName: '简体中文', htmlLang: 'zh-Hans' },
  { id: 'fr', nativeName: 'Français', htmlLang: 'fr' },
  { id: 'it', nativeName: 'Italiano', htmlLang: 'it' },
  { id: 'de', nativeName: 'Deutsch', htmlLang: 'de' },
  { id: 'es', nativeName: 'Español', htmlLang: 'es' },
];

export const DEFAULT_LOCALE = 'en';

export function numberLocale(locale) {
  if (locale === 'pl') return 'pl-PL';
  if (locale === 'zh') return 'zh-CN';
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'it') return 'it-IT';
  if (locale === 'de') return 'de-DE';
  if (locale === 'es') return 'es-ES';
  return 'en-GB';
}

const LOCALE_IDS = new Set(LOCALES.map((locale) => locale.id));

export function isLocale(value) {
  return LOCALE_IDS.has(value);
}
