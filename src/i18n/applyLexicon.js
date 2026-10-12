/**
 * Overlay a locale's display names onto a catalog.
 * The English name stays searchable as an alias. Extra aliases in the
 * lexicon entry (array entries after the first) are added too.
 * A string entry is just the display name.
 */
export function applyLexicon(items, lexicon) {
  if (!lexicon) return items;

  return items.map((item) => {
    const entry = lexicon[item.id];
    if (entry == null) return item;

    const names = (Array.isArray(entry) ? entry : [entry]).filter(Boolean);
    const [localized, ...extra] = names;
    if (!localized) return item;

    const display = localized;
    const aliases = [
      ...(display === item.name ? [] : [item.name]),
      ...extra,
      ...(item.aliases ?? []),
    ];

    if (display === item.name && extra.length === 0) return item;
    return { ...item, name: display, aliases };
  });
}
