import { DEFAULT_LOCALE, LOCALES, isLocale } from './locales.js';

const STORAGE_KEY = 'veg-survey-locale';
const LOCALE_IDS = LOCALES.map((locale) => locale.id).join('|');
const LOCALE_PREFIX = new RegExp(`^/(${LOCALE_IDS})(?=/|$)`);

export function localeFromPath(pathname) {
  const match = String(pathname ?? '').match(LOCALE_PREFIX);
  return match ? match[1] : null;
}

export function preferredLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // private mode
  }
  return DEFAULT_LOCALE;
}

export function rememberLocale(locale) {
  if (!isLocale(locale)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // private mode
  }
}

/** Prefix a path with the locale id, keeping any query or hash. */
export function withLocale(locale, path) {
  const id = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const match = String(path ?? '/').match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] || '/';
  const tail = match?.[2] || '';
  const stripped = pathname.replace(LOCALE_PREFIX, '') || '/';
  const next = stripped === '/' ? `/${id}` : `/${id}${stripped}`;
  return `${next}${tail}`;
}
