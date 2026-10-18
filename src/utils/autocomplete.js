import { normalizeQuery } from './normalization.js';

function collatorLocale(locale) {
  if (locale === 'zh') return 'zh-CN';
  return locale || 'en';
}

export function findCanonicalMatch(query, vegetables) {
  const q = normalizeQuery(query);
  if (!q) return null;

  for (const vegetable of vegetables) {
    if (normalizeQuery(vegetable.name) === q) return vegetable.id;
  }

  for (const vegetable of vegetables) {
    if (vegetable.aliases.some((alias) => normalizeQuery(alias) === q)) {
      return vegetable.id;
    }
  }

  return null;
}

function minimumQueryLength(query) {
  return /\p{Script=Han}/u.test(String(query ?? '')) ? 1 : 2;
}

export function getSuggestions(query, vegetables, limit = 6, locale = 'en') {
  const q = normalizeQuery(query);
  if (q.length < minimumQueryLength(query)) return [];

  const scored = [];

  for (const vegetable of vegetables) {
    const name = normalizeQuery(vegetable.name);
    const namePrefix = name.startsWith(q);
    const aliasPrefix = vegetable.aliases.some((alias) =>
      normalizeQuery(alias).startsWith(q),
    );

    if (!namePrefix && !aliasPrefix) continue;

    scored.push({
      vegetable,
      namePrefix,
      length: name.length,
      name,
    });
  }

  scored.sort((a, b) => {
    if (a.namePrefix !== b.namePrefix) return a.namePrefix ? -1 : 1;
    if (a.length !== b.length) return a.length - b.length;
    return a.name.localeCompare(b.name, collatorLocale(locale));
  });

  const seen = new Set();
  return scored
    .filter((item) => {
      if (seen.has(item.vegetable.id)) return false;
      seen.add(item.vegetable.id);
      return true;
    })
    .slice(0, limit)
    .map((item) => item.vegetable);
}

export function getLookupSuggestions(
  query,
  items,
  { limit = 8, featuredIds = [], browseAll = false, locale = 'en' } = {},
) {
  const q = normalizeQuery(query);

  if (q.length < minimumQueryLength(query)) {
    const featured = featuredIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);

    if (!browseAll) return featured.slice(0, limit);

    const featuredSet = new Set(featured.map((item) => item.id));
    const rest = items
      .filter((item) => !featuredSet.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name, collatorLocale(locale)));

    return [...featured, ...rest];
  }

  return getSuggestions(query, items, browseAll ? 20 : limit, locale);
}
