import { DEFAULT_LOCALE, isLocale } from './locales.js';

const STORAGE_KEY = 'veg-survey-locale';

export function localeFromPath(pathname) {
  const match = String(pathname ?? '').match(/^\/(en|pl)(?=\/|$)/);
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

/** Prefix a path with /en or /pl, keeping any query or hash. */
export function withLocale(locale, path) {
  const id = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const match = String(path ?? '/').match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] || '/';
  const tail = match?.[2] || '';
  const stripped = pathname.replace(/^\/(en|pl)(?=\/|$)/, '') || '/';
  const next = stripped === '/' ? `/${id}` : `/${id}${stripped}`;
  return `${next}${tail}`;
}
