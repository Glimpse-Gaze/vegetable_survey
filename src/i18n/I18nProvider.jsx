import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { I18nContext } from './useI18n.js';
import { DEFAULT_LOCALE, LOCALES, isLocale } from './locales.js';
import { bundles } from './messages/index.js';
import {
  localeFromPath,
  preferredLocale,
  rememberLocale,
  withLocale,
} from './paths.js';
import { SET_LOCALE_EVENT } from '../utils/vegSurveyConsole.js';

function lookup(tree, key) {
  return key.split('.').reduce((node, part) => {
    if (node == null || typeof node !== 'object') return undefined;
    return node[part];
  }, tree);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] == null ? '' : String(vars[name]),
  );
}

export function I18nProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathLocale = localeFromPath(location.pathname);
  const locale = pathLocale ?? preferredLocale();

  const setLocale = useCallback((next) => {
    if (!isLocale(next)) return;
    rememberLocale(next);
    const target = `${withLocale(next, location.pathname)}${location.search}${location.hash}`;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (target !== current) navigate(target);
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    function onDevLocale(event) {
      const next = event?.detail;
      if (isLocale(next)) setLocale(next);
    }
    window.addEventListener(SET_LOCALE_EVENT, onDevLocale);
    return () => window.removeEventListener(SET_LOCALE_EVENT, onDevLocale);
  }, [setLocale]);

  useEffect(() => {
    const match = LOCALES.find((item) => item.id === locale);
    document.documentElement.lang = match?.htmlLang ?? DEFAULT_LOCALE;
    const title = lookup(bundles[locale], 'home.title');
    document.title = typeof title === 'string' ? title : 'The Great Vegetable Survey';
    const description = lookup(bundles[locale], 'home.description')
      ?? lookup(bundles.en, 'home.description');
    if (typeof description === 'string') {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [locale]);

  useEffect(() => {
    const sheets = {
      zh: {
        id: 'zh-hans-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700&display=swap',
      },
      'zh-hant': {
        id: 'zh-hant-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap',
      },
      ko: {
        id: 'ko-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@600;700&display=swap',
      },
      ja: {
        id: 'ja-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap',
      },
      ru: {
        id: 'ru-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Serif:wght@600;700&display=swap',
      },
      th: {
        id: 'th-fonts',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&family=Noto+Serif+Thai:wght@600;700&display=swap',
      },
    };
    const active = sheets[locale];
    for (const sheet of Object.values(sheets)) {
      if (sheet !== active) document.getElementById(sheet.id)?.remove();
    }
    if (!active || document.getElementById(active.id)) return undefined;
    const link = document.createElement('link');
    link.id = active.id;
    link.rel = 'stylesheet';
    link.href = active.href;
    document.head.appendChild(link);
    return undefined;
  }, [locale]);

  const value = useMemo(() => {
    function raw(key) {
      const local = lookup(bundles[locale], key);
      const fallback = lookup(bundles.en, key);
      if (typeof local === 'string') return local;
      if (typeof fallback === 'string') return fallback;
      return key;
    }

    function t(key, vars) {
      const local = lookup(bundles[locale], key);
      const fallback = lookup(bundles.en, key);
      const template = typeof local === 'string' ? local : fallback;
      if (typeof template !== 'string') return key;
      return interpolate(template, vars);
    }

    return { locale, setLocale, t, raw, locales: LOCALES };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
