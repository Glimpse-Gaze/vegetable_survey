import { bundles } from '../src/i18n/messages/index.js';

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

function looksEnglish(text) {
  const s = String(text);
  if (!/[A-Za-z]{3,}/.test(s)) return false;
  if (/[\u0100-\u024f\u0400-\u04ff\u4e00-\u9fff\uac00-\ud7a3\u0e00-\u0e7f]/.test(s)) {
    return false;
  }
  const hits = (
    s.match(
      /\b(the|and|or|of|to|for|with|your|you|this|that|because|something|else|share|results|survey|vegetable|please|choose|continue|back|its|how|often|considered|specific|feels|grown|exposed|structure|appearance|harvested|consume|taste)\b/gi,
    ) || []
  ).length;
  return hits >= 1;
}

const locales = Object.fromEntries(
  Object.entries(bundles).map(([id, tree]) => [id, flatten(tree)]),
);
const en = locales.en;
const nonEn = Object.keys(locales).filter((id) => id !== 'en');

console.log('=== Keys present in EN but missing in some locales ===\n');
for (const key of Object.keys(en).sort()) {
  const missing = nonEn.filter((loc) => locales[loc][key] === undefined);
  if (!missing.length) continue;
  console.log(key);
  console.log(`  missing in: ${missing.join(', ')}`);
  console.log(`  EN: ${JSON.stringify(en[key])}`);
  console.log('');
}

console.log('\n=== Non-EN strings that still look like English ===\n');
const englishyByKey = {};
for (const loc of nonEn) {
  for (const [key, value] of Object.entries(locales[loc])) {
    if (value.length < 10) continue;
    if (!looksEnglish(value)) continue;
    if (!englishyByKey[key]) englishyByKey[key] = [];
    englishyByKey[key].push({ loc, value });
  }
}
for (const key of Object.keys(englishyByKey).sort()) {
  console.log(key);
  for (const { loc, value } of englishyByKey[key]) {
    console.log(`  [${loc}] ${JSON.stringify(value)}`);
  }
  if (en[key]) console.log(`  [en] ${JSON.stringify(en[key])}`);
  console.log('');
}
