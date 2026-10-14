import fs from 'node:fs';

const svg = fs.readFileSync('src/assets/map/World_Equal.svg', 'utf8');
const re = /<g class="([A-Z]{3})(?: [A-Z]{0,3})?">[\s\S]*?<title>([^<]+)<\/title>/g;
const byTitle = {};
let match;
while ((match = re.exec(svg))) {
  byTitle[match[2]] = match[1];
}

const { countries } = await import('../src/data/countries.js');
const { countryIdFromMapTitle } = await import('../src/i18n/countryNameIndex.js');

const byId = {};
for (const [title, iso3] of Object.entries(byTitle)) {
  const id = countryIdFromMapTitle(title);
  if (id) byId[id] = iso3;
}

// Force known REGIONS
byId.poland = 'POL';
byId.china = 'CHN';

fs.writeFileSync(
  'src/data/countryIso3.js',
  `/** Map country ids → ISO3 codes used by the equal-earth SVG. Auto-extracted. */\nexport const COUNTRY_ISO3 = ${JSON.stringify(byId, null, 2)};\n\nexport function iso3ForCountry(id) {\n  return COUNTRY_ISO3[id] ?? null;\n}\n`,
);
console.log('wrote', Object.keys(byId).length, 'ids');
