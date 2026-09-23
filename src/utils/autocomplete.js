import { normalizeText } from './normalization.js';

export function findCanonicalMatch(query, vegetables) {
  const q = normalizeText(query);
  if (!q) return null;

  for (const vegetable of vegetables) {
    if (normalizeText(vegetable.name) === q) return vegetable.id;
  }

  for (const vegetable of vegetables) {
    if (vegetable.aliases.some((alias) => normalizeText(alias) === q)) {
      return vegetable.id;
    }
  }

  return null;
}

export function getSuggestions(query, vegetables, limit = 6) {
  const q = normalizeText(query);
  if (q.length < 2) return [];

  const scored = [];

  for (const vegetable of vegetables) {
    const name = normalizeText(vegetable.name);
    const namePrefix = name.startsWith(q);
    const aliasPrefix = vegetable.aliases.some((alias) =>
      normalizeText(alias).startsWith(q),
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
    return a.name.localeCompare(b.name);
  });

  return scored.slice(0, limit).map((item) => item.vegetable);
}
