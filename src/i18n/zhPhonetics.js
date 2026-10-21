import { pinyin } from 'pinyin-pro';

const TONE_MARK = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 0: '', 5: '' };

const INITIALS = [
  ['zh', 'ㄓ'],
  ['ch', 'ㄔ'],
  ['sh', 'ㄕ'],
  ['b', 'ㄅ'],
  ['p', 'ㄆ'],
  ['m', 'ㄇ'],
  ['f', 'ㄈ'],
  ['d', 'ㄉ'],
  ['t', 'ㄊ'],
  ['n', 'ㄋ'],
  ['l', 'ㄌ'],
  ['g', 'ㄍ'],
  ['k', 'ㄎ'],
  ['h', 'ㄏ'],
  ['j', 'ㄐ'],
  ['q', 'ㄑ'],
  ['x', 'ㄒ'],
  ['r', 'ㄖ'],
  ['z', 'ㄗ'],
  ['c', 'ㄘ'],
  ['s', 'ㄙ'],
];

const FINALS = {
  a: 'ㄚ',
  o: 'ㄛ',
  e: 'ㄜ',
  ê: 'ㄝ',
  er: 'ㄦ',
  ai: 'ㄞ',
  ei: 'ㄟ',
  ao: 'ㄠ',
  ou: 'ㄡ',
  an: 'ㄢ',
  en: 'ㄣ',
  ang: 'ㄤ',
  eng: 'ㄥ',
  i: 'ㄧ',
  ia: 'ㄧㄚ',
  ie: 'ㄧㄝ',
  iao: 'ㄧㄠ',
  iu: 'ㄧㄡ',
  ian: 'ㄧㄢ',
  in: 'ㄧㄣ',
  iang: 'ㄧㄤ',
  ing: 'ㄧㄥ',
  iong: 'ㄩㄥ',
  u: 'ㄨ',
  ua: 'ㄨㄚ',
  uo: 'ㄨㄛ',
  uai: 'ㄨㄞ',
  ui: 'ㄨㄟ',
  uan: 'ㄨㄢ',
  un: 'ㄨㄣ',
  uang: 'ㄨㄤ',
  ueng: 'ㄨㄥ',
  ong: 'ㄨㄥ',
  v: 'ㄩ',
  ve: 'ㄩㄝ',
  van: 'ㄩㄢ',
  vn: 'ㄩㄣ',
};

const STANDALONE = {
  zhi: 'ㄓ',
  chi: 'ㄔ',
  shi: 'ㄕ',
  ri: 'ㄖ',
  zi: 'ㄗ',
  ci: 'ㄘ',
  si: 'ㄙ',
  yi: 'ㄧ',
  ya: 'ㄧㄚ',
  ye: 'ㄧㄝ',
  yao: 'ㄧㄠ',
  you: 'ㄧㄡ',
  yan: 'ㄧㄢ',
  yin: 'ㄧㄣ',
  yang: 'ㄧㄤ',
  ying: 'ㄧㄥ',
  yong: 'ㄩㄥ',
  wu: 'ㄨ',
  wa: 'ㄨㄚ',
  wo: 'ㄨㄛ',
  wai: 'ㄨㄞ',
  wei: 'ㄨㄟ',
  wan: 'ㄨㄢ',
  wen: 'ㄨㄣ',
  wang: 'ㄨㄤ',
  weng: 'ㄨㄥ',
  yu: 'ㄩ',
  yue: 'ㄩㄝ',
  yuan: 'ㄩㄢ',
  yun: 'ㄩㄣ',
};

function syllableToZhuyin(syllable) {
  const match = String(syllable)
    .toLowerCase()
    .replace('ü', 'v')
    .match(/^([a-zvê:]+)([0-5])?$/);
  if (!match) return '';
  const body = match[1].replace('u:', 'v');
  const tone = match[2] ?? '1';
  let zh = STANDALONE[body];
  if (!zh) {
    let initial = '';
    let final = body;
    for (const [latin, bpmf] of INITIALS) {
      if (body.startsWith(latin) && body.length > latin.length) {
        initial = bpmf;
        final = body.slice(latin.length);
        break;
      }
    }
    if (initial === 'ㄐ' || initial === 'ㄑ' || initial === 'ㄒ') {
      if (final.startsWith('u')) final = `v${final.slice(1)}`;
    }
    const finalZh = FINALS[final];
    if (!finalZh) return '';
    zh = `${initial}${finalZh}`;
  }
  if (tone === '0' || tone === '5') return `˙${zh}`;
  return `${zh}${TONE_MARK[tone] ?? ''}`;
}

function formsFor(text) {
  if (!/\p{Script=Han}/u.test(text)) return [];
  const numbered = pinyin(text, {
    toneType: 'num',
    type: 'array',
    nonZh: 'removed',
    v: true,
  }).filter(Boolean);
  if (!numbered.length) return [];
  const plain = numbered.map((part) => part.replace(/[0-5]$/u, ''));
  const asU = (form) => form.replace(/v/g, 'u');
  const zhuyin = numbered.map(syllableToZhuyin).filter(Boolean);
  return [
    plain.join(''),
    plain.join(' '),
    asU(plain.join('')),
    asU(plain.join(' ')),
    numbered.join(''),
    numbered.join(' '),
    asU(numbered.join('')),
    asU(numbered.join(' ')),
    zhuyin.join(''),
    zhuyin.join(' '),
    zhuyin.join('').replace(/[ˉˊˇˋ˙]/g, ''),
  ];
}

/** Add pinyin and zhuyin aliases for every Chinese name on a catalog item. */
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
