import { isKana, toHiragana, toRomaji } from 'wanakana';

function formsFor(text) {
  const value = String(text ?? '').trim();
  if (!value) return [];
  const forms = [];
  if (isKana(value) || /[\u3040-\u30ff]/u.test(value)) {
    const hira = toHiragana(value);
    const roma = toRomaji(hira);
    if (hira && hira !== value) forms.push(hira);
    if (roma) {
      forms.push(roma);
      forms.push(roma.replace(/\s+/g, ''));
      forms.push(roma.replace(/['']/g, ''));
      forms.push(roma.replace(/[''\s]/g, ''));
    }
  }
  return forms;
}

/** Add hiragana and romaji aliases for Japanese catalog labels. */
export function attachPhonetics(items) {
  return items.map((item) => {
    const extra = [];
    const seen = new Set(
      [item.name, ...(item.aliases ?? [])].map((value) => String(value)),
    );
    for (const text of seen) {
      for (const form of formsFor(text)) {
        if (!form || seen.has(form)) continue;
        seen.add(form);
        extra.push(form);
      }
    }
    if (!extra.length) return item;
    return { ...item, aliases: [...(item.aliases ?? []), ...extra] };
  });
}
