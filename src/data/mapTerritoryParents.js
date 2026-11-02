/**
 * Overseas territories drawn as their own map shapes, tallied with the
 * sovereign country (same idea as Puerto Rico → United States).
 *
 * Keys use the map-place ids from mapPlaceNames.js / survey country ids.
 */
export const TERRITORY_PLACE_PARENT = {
  puerto_rico: 'united_states',
  american_samoa: 'united_states',
  guam: 'united_states',
  northern_mariana_islands: 'united_states',
  us_virgin_islands: 'united_states',

  french_southern_lands: 'france',
  new_caledonia: 'france',
  saint_barthelemy: 'france',
  saint_martin: 'france',
  french_polynesia: 'france',
  saint_pierre_and_miquelon: 'france',
  wallis_and_futuna: 'france',

  falkland_islands: 'united_kingdom',
  british_indian_ocean_territory: 'united_kingdom',
  anguilla: 'united_kingdom',
  bermuda: 'united_kingdom',
  cayman_islands: 'united_kingdom',
  guernsey: 'united_kingdom',
  gibraltar: 'united_kingdom',
  isle_of_man: 'united_kingdom',
  jersey: 'united_kingdom',
  montserrat: 'united_kingdom',
  saint_helena: 'united_kingdom',
  turks_and_caicos: 'united_kingdom',
  british_virgin_islands: 'united_kingdom',

  aruba: 'netherlands',
  curacao: 'netherlands',
  sint_maarten: 'netherlands',

  indian_ocean_territories: 'australia',
  norfolk_island: 'australia',

  cook_islands: 'new_zealand',
  niue: 'new_zealand',

  faroe_islands: 'denmark',
  aland_islands: 'finland',
};

/**
 * Survey places that are not first-class map countries: votes also count for
 * the sovereign parent, while the child keeps its own filterable tally.
 * (Taiwan stays standalone — not listed here.)
 */
export const PLACE_ROLLUP_PARENT = {
  scotland: 'united_kingdom',
  england: 'united_kingdom',
  wales: 'united_kingdom',
  northern_ireland: 'united_kingdom',

  hong_kong: 'china',
  macau: 'china',
  tibet: 'china',
};

/** Territory ISO3 class on the SVG → sovereign ISO3. */
export const TERRITORY_ISO_AS_COUNTRY = {
  PRI: 'USA',
  ASM: 'USA',
  GUM: 'USA',
  MNP: 'USA',
  VIR: 'USA',

  ATF: 'FRA',
  NCL: 'FRA',
  BLM: 'FRA',
  MAF: 'FRA',
  PYF: 'FRA',
  SPM: 'FRA',
  WLF: 'FRA',

  FLK: 'GBR',
  IOT: 'GBR',
  AIA: 'GBR',
  BMU: 'GBR',
  CYM: 'GBR',
  GGY: 'GBR',
  GIB: 'GBR',
  IMN: 'GBR',
  JEY: 'GBR',
  MSR: 'GBR',
  SHN: 'GBR',
  TCA: 'GBR',
  VGB: 'GBR',

  ABW: 'NLD',
  CUW: 'NLD',
  SXM: 'NLD',

  IOA: 'AUS',
  NFK: 'AUS',

  COK: 'NZL',
  NIU: 'NZL',

  FRO: 'DNK',
  ALD: 'FIN',

  // Markers that pool with China on the results map.
  HKG: 'CHN',
  MAC: 'CHN',
};

/** Territory ISO3 → parent survey / place id (for tip labels). */
export const TERRITORY_ISO_COUNTRY_ID = {
  PRI: 'united_states',
  ASM: 'united_states',
  GUM: 'united_states',
  MNP: 'united_states',
  VIR: 'united_states',

  ATF: 'france',
  NCL: 'france',
  BLM: 'france',
  MAF: 'france',
  PYF: 'france',
  SPM: 'france',
  WLF: 'france',

  FLK: 'united_kingdom',
  IOT: 'united_kingdom',
  AIA: 'united_kingdom',
  BMU: 'united_kingdom',
  CYM: 'united_kingdom',
  GGY: 'united_kingdom',
  GIB: 'united_kingdom',
  IMN: 'united_kingdom',
  JEY: 'united_kingdom',
  MSR: 'united_kingdom',
  SHN: 'united_kingdom',
  TCA: 'united_kingdom',
  VGB: 'united_kingdom',

  ABW: 'netherlands',
  CUW: 'netherlands',
  SXM: 'netherlands',

  IOA: 'australia',
  NFK: 'australia',

  COK: 'new_zealand',
  NIU: 'new_zealand',

  FRO: 'denmark',
  ALD: 'finland',

  HKG: 'china',
  MAC: 'china',
};

/** Sovereign parent for filter/tally rollup (subdivision or territory). */
export function rollupParentOf(placeId) {
  if (!placeId) return placeId;
  return PLACE_ROLLUP_PARENT[placeId] ?? TERRITORY_PLACE_PARENT[placeId] ?? placeId;
}

/** Map fold target (same parents as rollup). */
export function parentPlaceId(placeId) {
  return rollupParentOf(placeId);
}
