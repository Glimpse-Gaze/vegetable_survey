export function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

const ZHUYIN_TONE = /[ˉˊˇˋ˙]/g;

/** Search key: tones, tone digits, and spaces do not matter. */
export function normalizeQuery(value) {
  const prepared = String(value ?? '').replace(/[üÜǖǘǚǜ]/g, 'v');
  return normalizeText(prepared)
    .replace(ZHUYIN_TONE, '')
    .replace(/[0-9]/g, '')
    .replace(/[''·.．]+/g, '')
    .replace(/\s+/g, '');
}
