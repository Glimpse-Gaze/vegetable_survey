/**
 * Block public display of custom Q1/Q6 veggie labels that are curses/slurs.
 * Answers are still stored; only public feeds omit them.
 *
 * Matching is word-boundary based for Latin scripts so catalogue names like
 * "rapeseed" / "cassava" are not tripped by short stems. CJK/Thai terms use
 * whole-token equality.
 */

const SHARED_LATIN = [
  'anal',
  'anus',
  'arse',
  'asshole',
  'assholes',
  'bastard',
  'bastards',
  'bitch',
  'bitches',
  'bollocks',
  'boob',
  'boobs',
  'cock',
  'cocks',
  'cocksucker',
  'coon',
  'crap',
  'cum',
  'cunt',
  'cunts',
  'dick',
  'dicks',
  'dickhead',
  'dildo',
  'dyke',
  'fag',
  'faggot',
  'faggots',
  'fuck',
  'fucker',
  'fuckers',
  'fucking',
  'fucked',
  'fagot',
  'homo',
  'jerkoff',
  'kike',
  'milf',
  'motherfucker',
  'nazi',
  'nigga',
  'nigger',
  'nude',
  'penis',
  'piss',
  'porn',
  'pussy',
  'queer',
  'retard',
  'retarded',
  'shit',
  'shits',
  'shithead',
  'slut',
  'sluts',
  'spic',
  'tits',
  'twat',
  'vagina',
  'wank',
  'wanker',
  'whore',
  'whores',
];

const BY_LOCALE = {
  en: SHARED_LATIN,
  pl: [
    ...SHARED_LATIN,
    'chuj',
    'chuja',
    'chuje',
    'chujnia',
    'cipa',
    'cipe',
    'cipę',
    'cipki',
    'debil',
    'debilu',
    'dupa',
    'dupy',
    'dupę',
    'fiut',
    'fiuta',
    'huj',
    'jebac',
    'jebać',
    'jebany',
    'jebana',
    'kurwa',
    'kurwy',
    'kurwą',
    'kurwy',
    'kutas',
    'kutasa',
    'pierdol',
    'pierdolic',
    'pierdolić',
    'pierdolony',
    'pizda',
    'pizdy',
    'spierdalaj',
    'sukinsyn',
  ],
  de: [
    ...SHARED_LATIN,
    'arsch',
    'arschloch',
    'fotze',
    'hure',
    'hurensohn',
    'scheisse',
    'scheiße',
    'schwanz',
    'wichser',
  ],
  fr: [
    ...SHARED_LATIN,
    'connard',
    'connasse',
    'encule',
    'enculé',
    'merde',
    'pute',
    'putain',
    'salope',
  ],
  es: [
    ...SHARED_LATIN,
    'cabron',
    'cabrón',
    'coño',
    'gilipollas',
    'joder',
    'mierda',
    'pendejo',
    'puta',
    'puto',
  ],
  'es-mx': [
    ...SHARED_LATIN,
    'cabron',
    'cabrón',
    'coño',
    'culero',
    'mierda',
    'pendejo',
    'puta',
    'puto',
    'verga',
  ],
  it: [
    ...SHARED_LATIN,
    'cazzo',
    'coglione',
    'merda',
    'puttana',
    'stronzo',
    'vaffanculo',
  ],
  'pt-br': [
    ...SHARED_LATIN,
    'caralho',
    'merda',
    'porra',
    'puta',
    'puto',
    'viado',
  ],
  'pt-pt': [
    ...SHARED_LATIN,
    'caralho',
    'merda',
    'puta',
    'puto',
  ],
  // Script-heavy locales: keep shared Latin (typed in EN) + a few local tokens.
  zh: [...SHARED_LATIN, '操', '鸡巴', '屌', '妈的', '媽的'],
  'zh-hant': [...SHARED_LATIN, '操', '鸡巴', '屌', '媽的'],
  ko: [...SHARED_LATIN, '씨발', '시발', '병신', '좆', '개새끼'],
  th: [...SHARED_LATIN, 'ควย', 'เหี้ย', 'สัส', 'มึง'],
};

const CUSTOM_PREFIX = 'custom:';
export const CUSTOM_VOTE_THRESHOLD = 5;

function fold(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .trim();
}

function termsFor(locale) {
  const key = String(locale ?? 'en').toLowerCase();
  return BY_LOCALE[key] ?? BY_LOCALE.en;
}

function termHits(haystack, term) {
  const needle = fold(term);
  if (!needle || !haystack) return false;
  if (/[\u4e00-\u9fff\uac00-\ud7a3\u0e00-\u0e7f]/.test(needle)) {
    if (haystack === needle) return true;
    return haystack.split(/[\s,./|;]+/).includes(needle);
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(
    haystack,
  );
}

/** True when a free-text veggie label should stay out of public boards. */
export function isBlockedPublicLabel(text, locale = 'en') {
  const haystack = fold(text);
  if (!haystack) return true;
  return termsFor(locale).some((term) => termHits(haystack, term));
}

export function isCustomVoteKey(key) {
  return String(key ?? '').startsWith(CUSTOM_PREFIX);
}

export function customVoteKey(rawAnswer) {
  const folded = fold(rawAnswer).replace(/\s+/g, ' ');
  if (!folded) return null;
  return `${CUSTOM_PREFIX}${folded}`;
}

export function filterPublicVoteCounts(counts, labels = {}, locale = 'en') {
  const next = {};
  for (const [key, value] of Object.entries(counts ?? {})) {
    const n = Number(value) || 0;
    if (n <= 0) continue;
    if (isCustomVoteKey(key)) {
      const label = labels[key] ?? key.slice(CUSTOM_PREFIX.length);
      if (isBlockedPublicLabel(label, locale)) continue;
      if (n < CUSTOM_VOTE_THRESHOLD) continue;
    }
    next[key] = n;
  }
  return next;
}
