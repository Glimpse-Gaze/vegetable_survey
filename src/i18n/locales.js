/**
 * Survey languages.
 *
 * To add one:
 * 1. Append an entry here (id, nativeName, htmlLang).
 * 2. Add src/i18n/messages/<id>.js and register it in src/i18n/messages/index.js.
 * 3. Add src/i18n/lexicon/<id>/ (vegetables, countries, languages) and register it
 *    in src/i18n/lexicon/index.js. Simplified and Traditional Chinese also get
 *    pinyin and zhuyin at catalog load.
 *
 * English is the source catalog. A missing string or name falls back to English.
 * Stable ids (carrot, poland, …) stay in English in stored answers.
 */
export const LOCALES = [
  { id: 'en', nativeName: 'English', htmlLang: 'en' },
  { id: 'pl', nativeName: 'Polski', htmlLang: 'pl' },
  { id: 'ru', nativeName: 'Русский', htmlLang: 'ru' },
  { id: 'zh', nativeName: '简体中文', htmlLang: 'zh-Hans' },
  { id: 'zh-hant', nativeName: '繁體中文', htmlLang: 'zh-Hant' },
  { id: 'ko', nativeName: '한국어', htmlLang: 'ko' },
  { id: 'ja', nativeName: '日本語', htmlLang: 'ja' },
  { id: 'th', nativeName: 'ไทย', htmlLang: 'th' },
  { id: 'fr', nativeName: 'Français', htmlLang: 'fr' },
  { id: 'it', nativeName: 'Italiano', htmlLang: 'it' },
  { id: 'de', nativeName: 'Deutsch', htmlLang: 'de' },
  { id: 'es', nativeName: 'Español (España)', htmlLang: 'es-ES' },
  { id: 'es-mx', nativeName: 'Español (México)', htmlLang: 'es-MX' },
  { id: 'pt-br', nativeName: 'Português (Brasil)', htmlLang: 'pt-BR' },
  { id: 'pt-pt', nativeName: 'Português (Portugal)', htmlLang: 'pt-PT' },
];

export const DEFAULT_LOCALE = 'en';

export function numberLocale(locale) {
  if (locale === 'pl') return 'pl-PL';
  if (locale === 'ru') return 'ru-RU';
  if (locale === 'zh') return 'zh-CN';
  if (locale === 'zh-hant') return 'zh-TW';
  if (locale === 'ko') return 'ko-KR';
  if (locale === 'ja') return 'ja-JP';
  if (locale === 'th') return 'th-TH-u-nu-latn';
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'it') return 'it-IT';
  if (locale === 'de') return 'de-DE';
  if (locale === 'es') return 'es-ES';
  if (locale === 'es-mx') return 'es-MX';
  if (locale === 'pt-br') return 'pt-BR';
  if (locale === 'pt-pt') return 'pt-PT';
  return 'en-GB';
}

const LOCALE_IDS = new Set(LOCALES.map((locale) => locale.id));

export function isLocale(value) {
  return LOCALE_IDS.has(value);
}
