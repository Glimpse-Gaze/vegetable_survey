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
    const match = LOCALES.find((item) => item.id === locale);
    document.documentElement.lang = match?.htmlLang ?? DEFAULT_LOCALE;
    const title = lookup(bundles[locale], 'home.title');
    document.title = typeof title === 'string' ? title : 'The Great Vegetable Survey';
  }, [locale]);

  useEffect(() => {
    const id = 'zh-hans-fonts';
    if (locale !== 'zh') {
      document.getElementById(id)?.remove();
      return undefined;
    }
    if (document.getElementById(id)) return undefined;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700&display=swap';
    document.head.appendChild(link);
    return undefined;
  }, [locale]);

  const value = useMemo(() => {
    function t(key, vars) {
      const local = lookup(bundles[locale], key);
      const fallback = lookup(bundles.en, key);
      const template = typeof local === 'string' ? local : fallback;
      if (typeof template !== 'string') return key;
      return interpolate(template, vars);
    }

    return { locale, setLocale, t, locales: LOCALES };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
