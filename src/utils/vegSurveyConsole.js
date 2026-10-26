import { isLocale } from '../i18n/locales.js';
import { localeFromPath, preferredLocale, withLocale } from '../i18n/paths.js';

const FLAG = 'veg-survey-open-code';
const EVENT = 'veg-survey-open-code';
const PREFILL_FLAG = 'veg-survey-prefill';
const PREFILL_EVENT = 'veg-survey-prefill';
export const SET_LOCALE_EVENT = 'veg-survey-set-locale';

function onSurveyPage() {
  const locale = localeFromPath(window.location.pathname);
  if (!locale) return false;
  return new RegExp(`^/${locale}/survey/?$`).test(window.location.pathname);
}

function openSurvey() {
  const locale = localeFromPath(window.location.pathname) ?? preferredLocale();
  window.location.assign(withLocale(locale, '/survey'));
}

export function requestRankingCodePanel() {
  try {
    sessionStorage.setItem(FLAG, '1');
  } catch {
    // private mode
  }
  window.dispatchEvent(new Event(EVENT));
  if (!onSurveyPage()) openSurvey();
}

export function consumeRankingCodePanelFlag() {
  try {
    if (sessionStorage.getItem(FLAG) === '1') {
      sessionStorage.removeItem(FLAG);
      return true;
    }
  } catch {
    // private mode
  }
  return false;
}

export function subscribeRankingCodePanel(onOpen) {
  function handle() {
    onOpen();
  }
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}

export function requestSurveyPrefill() {
  try {
    sessionStorage.setItem(PREFILL_FLAG, '1');
  } catch {
    // private mode
  }
  window.dispatchEvent(new Event(PREFILL_EVENT));
  if (!onSurveyPage()) openSurvey();
}

export function consumeSurveyPrefillFlag() {
  try {
    if (sessionStorage.getItem(PREFILL_FLAG) === '1') {
      sessionStorage.removeItem(PREFILL_FLAG);
      return true;
    }
  } catch {
    // private mode
  }
  return false;
}

export function subscribeSurveyPrefill(onPrefill) {
  function handle() {
    onPrefill();
  }
  window.addEventListener(PREFILL_EVENT, handle);
  return () => window.removeEventListener(PREFILL_EVENT, handle);
}

function currentLocale() {
  return localeFromPath(window.location.pathname) ?? preferredLocale();
}

function requestLocale(next) {
  const value = String(next ?? '').trim().toLowerCase();
  if (!isLocale(value)) {
    console.warn(`[vegSurvey] Unknown locale "${next}". Try loc = 'pl' (or en, th, …).`);
    return currentLocale();
  }
  window.dispatchEvent(new CustomEvent(SET_LOCALE_EVENT, { detail: value }));
  return value;
}

export function installVegSurveyConsole() {
  window.vegSurvey = requestSurveyPrefill;

  // Dev: loc = 'pl'  or  loc('th')  — works even when the survey language pill is locked.
  Object.defineProperty(window, 'loc', {
    configurable: true,
    enumerable: false,
    get() {
      const here = currentLocale();
      const fn = (next) => {
        if (next == null || next === '') return here;
        return requestLocale(next);
      };
      fn.toString = () => here;
      fn.valueOf = () => here;
      fn[Symbol.toPrimitive] = () => here;
      return fn;
    },
    set(value) {
      requestLocale(value);
    },
  });
}
