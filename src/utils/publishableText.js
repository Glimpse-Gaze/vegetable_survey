const LATIN_VOWELS = new Set(
  [...'aeiouyàáâãäåæèéêëìíîïòóôõöøùúûüýÿąęıœāēīōū'],
);

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function isLatinVowel(char) {
  return LATIN_VOWELS.has(char.toLowerCase());
}

function hasKeyboardRun(letters) {
  const compact = letters.join('').toLowerCase();
  return KEYBOARD_ROWS.some((row) => {
    for (let index = 0; index <= row.length - 4; index += 1) {
      const slice = row.slice(index, index + 4);
      const reversed = [...slice].reverse().join('');
      if (compact.includes(slice) || compact.includes(reversed)) return true;
    }
    return false;
  });
}

/**
 * Public free text has to look like a real answer in any of the survey scripts.
 * Latin text needs a vowel once it is long enough to be mash ("sdsds").
 * Chinese, Thai, and Hangul syllables are words without Latin vowels, so they
 * stay. A run of the same mark, or consonant-only Hangul jamo, does not.
 */
export function isPublishableText(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return false;

  const chars = [...text];
  const compact = chars.filter((char) => char !== ' ').join('');
  if (/(.)\1{3,}/u.test(compact)) return false;

  const latin = chars.filter((char) => /\p{Script=Latin}/u.test(char));
  const han = chars.some((char) => /\p{Script=Han}/u.test(char));
  const hangulSyllable = chars.some((char) => /[\uAC00-\uD7A3]/.test(char));
  const thai = chars.some((char) => /\p{Script=Thai}/u.test(char));
  const hangulVowel = chars.some((char) => /[\u1161-\u1175\u314F-\u3163]/.test(char));
  const hangulConsonants = chars.filter((char) =>
    /[\u1100-\u115F\u11A8-\u11FF\u3131-\u314E]/.test(char),
  ).length;

  if (latin.length >= 3 && !latin.some(isLatinVowel)) return false;
  if (latin.length > 0 && latin.length < 3 && !han && !hangulSyllable && !thai) {
    return false;
  }
  if (hangulConsonants >= 3 && !hangulSyllable && !hangulVowel && latin.length === 0) {
    return false;
  }
  if (hasKeyboardRun(latin)) return false;
  return chars.some((char) => /\p{L}/u.test(char));
}
