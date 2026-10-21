/**
 * Letters that stay distinct under Unicode NFD, typed without the special key.
 * Decomposable accents (é, ñ, ü, ą, …) are stripped separately.
 */
const LATIN_ASCII = {
  ł: 'l',
  ø: 'o',
  đ: 'd',
  ð: 'd',
  ħ: 'h',
  ŧ: 't',
  ı: 'i',
  ŋ: 'n',
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  þ: 'th',
};

function foldLatinLetters(value) {
  return String(value ?? '').replace(
    /[łøđðħŧıŋßæœþ]/g,
    (letter) => LATIN_ASCII[letter],
  );
}

export function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

const ZHUYIN_TONE = /[ˉˊˇˋ˙]/g;

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** Dubeolsik commits syllables; search also accepts loose jamo. */
function hangulToJamo(value) {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code >= 0x1100 && code <= 0x1112) {
      out += CHO[code - 0x1100];
      continue;
    }
    if (code >= 0x1161 && code <= 0x1175) {
      out += JUNG[code - 0x1161];
      continue;
    }
    if (code >= 0x11a8 && code <= 0x11c2) {
      out += JONG[code - 0x11a7];
      continue;
    }
    if (code < HANGUL_BASE || code > HANGUL_LAST) {
      out += ch;
      continue;
    }
    const syllable = code - HANGUL_BASE;
    out += CHO[Math.floor(syllable / 588)];
    out += JUNG[Math.floor((syllable % 588) / 28)];
    const jong = syllable % 28;
    if (jong) out += JONG[jong];
  }
  return out;
}

/** Search key: tones, tone digits, and spaces do not matter. Hangul folds to jamo. Latin letters fold to ASCII. */
export function normalizeQuery(value) {
  const prepared = foldLatinLetters(String(value ?? '').toLowerCase());
  return hangulToJamo(normalizeText(prepared))
    .replace(ZHUYIN_TONE, '')
    .replace(/[0-9]/g, '')
    .replace(/[''·.．]+/g, '')
    .replace(/\s+/g, '');
}
