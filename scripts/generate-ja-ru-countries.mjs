import { writeFileSync } from 'node:fs';
import { countries } from '../src/data/countries.js';
import { COUNTRY_ISO3 } from '../src/data/countryIso3.js';

const ISO3_TO_2 = {
  AFG: 'AF', AGO: 'AO', ALB: 'AL', AND: 'AD', ARE: 'AE', ARG: 'AR', ARM: 'AM', ATA: 'AQ',
  ATG: 'AG', AUS: 'AU', AUT: 'AT', AZE: 'AZ', BDI: 'BI', BEL: 'BE', BEN: 'BJ', BFA: 'BF',
  BGD: 'BD', BGR: 'BG', BHR: 'BH', BHS: 'BS', BIH: 'BA', BLR: 'BY', BLZ: 'BZ', BOL: 'BO',
  BRA: 'BR', BRB: 'BB', BRN: 'BN', BTN: 'BT', BWA: 'BW', CAF: 'CF', CAN: 'CA', CHE: 'CH',
  CHL: 'CL', CHN: 'CN', CIV: 'CI', CMR: 'CM', COD: 'CD', COG: 'CG', COL: 'CO', COM: 'KM',
  CPV: 'CV', CRI: 'CR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', DEU: 'DE', DJI: 'DJ', DMA: 'DM',
  DNK: 'DK', DOM: 'DO', DZA: 'DZ', ECU: 'EC', EGY: 'EG', ERI: 'ER', ESP: 'ES', EST: 'EE',
  ETH: 'ET', FIN: 'FI', FJI: 'FJ', FRA: 'FR', FSM: 'FM', GAB: 'GA', GBR: 'GB', GEO: 'GE',
  GHA: 'GH', GIN: 'GN', GMB: 'GM', GNB: 'GW', GNQ: 'GQ', GRC: 'GR', GRD: 'GD', GRL: 'GL',
  GTM: 'GT', GUY: 'GY', HND: 'HN', HRV: 'HR', HTI: 'HT', HUN: 'HU', IDN: 'ID', IND: 'IN',
  IRL: 'IE', IRN: 'IR', IRQ: 'IQ', ISL: 'IS', ISR: 'IL', ITA: 'IT', JAM: 'JM', JOR: 'JO',
  JPN: 'JP', KAZ: 'KZ', KEN: 'KE', KGZ: 'KG', KHM: 'KH', KIR: 'KI', KNA: 'KN', KOR: 'KR',
  KWT: 'KW', LAO: 'LA', LBN: 'LB', LBR: 'LR', LBY: 'LY', LCA: 'LC', LIE: 'LI', LKA: 'LK',
  LSO: 'LS', LTU: 'LT', LUX: 'LU', LVA: 'LV', MAR: 'MA', MCO: 'MC', MDA: 'MD', MDG: 'MG',
  MDV: 'MV', MEX: 'MX', MHL: 'MH', MKD: 'MK', MLI: 'ML', MLT: 'MT', MMR: 'MM', MNE: 'ME',
  MNG: 'MN', MOZ: 'MZ', MRT: 'MR', MUS: 'MU', MWI: 'MW', MYS: 'MY', NAM: 'NA', NER: 'NE',
  NGA: 'NG', NIC: 'NI', NLD: 'NL', NOR: 'NO', NPL: 'NP', NRU: 'NR', NZL: 'NZ', OMN: 'OM',
  PAK: 'PK', PAN: 'PA', PER: 'PE', PHL: 'PH', PLW: 'PW', PNG: 'PG', POL: 'PL', PRI: 'PR',
  PRK: 'KP', PRT: 'PT', PRY: 'PY', QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', SAU: 'SA',
  SDN: 'SD', SDS: 'SS', SEN: 'SN', SGP: 'SG', SLB: 'SB', SLE: 'SL', SLV: 'SV', SMR: 'SM',
  SOM: 'SO', SRB: 'RS', SSD: 'SS', STP: 'ST', SUR: 'SR', SVK: 'SK', SVN: 'SI', SWE: 'SE',
  SWZ: 'SZ', SYC: 'SC', SYR: 'SY', TCD: 'TD', TGO: 'TG', THA: 'TH', TJK: 'TJ', TKM: 'TM',
  TLS: 'TL', TON: 'TO', TTO: 'TT', TUN: 'TN', TUR: 'TR', TUV: 'TV', TZA: 'TZ', UGA: 'UG',
  UKR: 'UA', URY: 'UY', USA: 'US', UZB: 'UZ', VAT: 'VA', VCT: 'VC', VEN: 'VE', VNM: 'VN',
  VUT: 'VU', WSM: 'WS', YEM: 'YE', ZAF: 'ZA', ZMB: 'ZM', ZWE: 'ZW', HKG: 'HK', MAC: 'MO',
  PSE: 'PS', TWN: 'TW',
};

const SPECIAL = {
  ja: {
    prefer_not_to_disclose: ['答えたくない', '回答しない'],
    africa: 'アフリカ',
    antarctica: '南極',
    asia: 'アジア',
    europe: 'ヨーロッパ',
    north_america: ['北アメリカ', '北米'],
    oceania: 'オセアニア',
    south_america: ['南アメリカ', '南米'],
    taiwan: ['台湾', '臺灣'],
    tibet: 'チベット',
    hong_kong: '香港',
    macau: ['マカオ', '澳門'],
    palestine: 'パレスチナ',
    kosovo: 'コソボ',
    kurdistan: 'クルディスタン',
    western_sahara: '西サハラ',
    greenland: 'グリーンランド',
    puerto_rico: 'プエルトリコ',
    scotland: 'スコットランド',
    wales: 'ウェールズ',
    northern_ireland: '北アイルランド',
    england: 'イングランド',
  },
  ru: {
    prefer_not_to_disclose: ['Предпочитаю не указывать', 'Не скажу'],
    africa: 'Африка',
    antarctica: 'Антарктида',
    asia: 'Азия',
    europe: 'Европа',
    north_america: ['Северная Америка', 'Северная Америка'],
    oceania: 'Океания',
    south_america: 'Южная Америка',
    taiwan: 'Тайвань',
    tibet: 'Тибет',
    hong_kong: 'Гонконг',
    macau: 'Макао',
    palestine: 'Палестина',
    kosovo: 'Косово',
    kurdistan: 'Курдистан',
    western_sahara: 'Западная Сахара',
    greenland: 'Гренландия',
    puerto_rico: 'Пуэрто-Рико',
    scotland: 'Шотландия',
    wales: 'Уэльс',
    northern_ireland: 'Северная Ирландия',
    england: 'Англия',
  },
};

function serialize(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}

function build(locale) {
  const dn = new Intl.DisplayNames([locale], { type: 'region' });
  const special = SPECIAL[locale];
  const lines = [
    `/** ${locale === 'ja' ? 'Japanese' : 'Russian'} country and region names. */`,
    'export const countries = {',
  ];
  for (const country of countries) {
    if (special[country.id]) {
      lines.push(`  ${country.id}: ${serialize(special[country.id])},`);
      continue;
    }
    const iso3 = COUNTRY_ISO3[country.id];
    const iso2 = iso3 ? ISO3_TO_2[iso3] : null;
    const name = iso2 ? dn.of(iso2) : null;
    if (name && name !== iso2) {
      lines.push(`  ${country.id}: ${serialize(name)},`);
    } else {
      lines.push(`  ${country.id}: ${serialize(country.name)},`);
    }
  }
  lines.push('};', '');
  return `${lines.join('\n')}\n`;
}

writeFileSync('src/i18n/lexicon/ja/countries.js', build('ja'), 'utf8');
writeFileSync('src/i18n/lexicon/ru/countries.js', build('ru'), 'utf8');
console.log('countries ja/ru written');
