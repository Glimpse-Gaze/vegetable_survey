const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT = /^[0-9A-Za-z]{12}$/;
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function isUuid(value) {
  return UUID.test(String(value ?? '').trim());
}

export function isShortRankingCode(value) {
  return SHORT.test(String(value ?? '').trim());
}

export function isPublicResponseCode(value) {
  const code = String(value ?? '').trim();
  return isUuid(code) || isShortRankingCode(code);
}

export function generateRankingCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

export function publicResponseId(row) {
  return row?.ranking_code || String(row?.id ?? '');
}
