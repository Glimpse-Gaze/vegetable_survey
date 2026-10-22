import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { LOCALES } from '../src/i18n/locales.js';
import { bundles } from '../src/i18n/messages/index.js';
import { sitemapXml } from './localeShells.mjs';

const WIDTH = 1200;
const HEIGHT = 630;

const LATIN = new Set(['en', 'pl', 'de', 'fr', 'es', 'es-mx', 'it', 'pt-br', 'pt-pt']);

const FONT_FILE = {
  en: 'C:/Windows/Fonts/palab.ttf',
  pl: 'C:/Windows/Fonts/palab.ttf',
  de: 'C:/Windows/Fonts/palab.ttf',
  fr: 'C:/Windows/Fonts/palab.ttf',
  es: 'C:/Windows/Fonts/palab.ttf',
  'es-mx': 'C:/Windows/Fonts/palab.ttf',
  it: 'C:/Windows/Fonts/palab.ttf',
  'pt-br': 'C:/Windows/Fonts/palab.ttf',
  'pt-pt': 'C:/Windows/Fonts/palab.ttf',
  zh: 'C:/Windows/Fonts/NotoSerifSC-VF.ttf',
  'zh-hant': 'C:/Windows/Fonts/NotoSerifTC-VF.ttf',
  ko: 'C:/Windows/Fonts/malgunbd.ttf',
  th: 'C:/Windows/Fonts/LEELAWDB.TTF',
};

const bodyFont = readFileSync('C:/Windows/Fonts/segoeuib.ttf').toString('base64');
const fontData = new Map();

function fontBase64(file) {
  if (!fontData.has(file)) fontData.set(file, readFileSync(file).toString('base64'));
  return fontData.get(file);
}

function splitTitle(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || [...text].length <= 22) return [text];
  let best = null;
  for (let index = 1; index < words.length; index += 1) {
    const lines = [words.slice(0, index).join(' '), words.slice(index).join(' ')];
    const diff = Math.abs([...lines[0]].length - [...lines[1]].length);
    if (!best || diff < best.diff) best = { diff, lines };
  }
  return best.lines;
}

function bannerTitle(locale) {
  const title = bundles[locale.id].home.title;
  const text = LATIN.has(locale.id) ? title.toLocaleUpperCase(locale.htmlLang) : title;
  return splitTitle(text);
}

const photo = await sharp('src/content/Default.jpg')
  .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.62, saturation: 0.9 })
  .toBuffer();

mkdirSync('public/og', { recursive: true });

for (const locale of LOCALES) {
  const lines = bannerTitle(locale);
  const longest = Math.max(...lines.map((line) => [...line].length));
  const size = longest > 18 ? 58 : lines.length > 1 ? 72 : 84;
  const display = fontBase64(FONT_FILE[locale.id]);
  const titleSvg = lines
    .map((line, index) => {
      const y = lines.length === 1 ? 318 : 272 + index * 92;
      return `<text x="600" y="${y}" text-anchor="middle" fill="#f7f1e4" filter="url(#shadow)" font-family="Display, Palatino Linotype, Georgia, serif" font-size="${size}" font-weight="700">${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</text>`;
    })
    .join('\n  ');
  const urlY = lines.length === 1 ? 390 : 272 + lines.length * 92 + 8;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face { font-family: "Display"; src: url("data:font/ttf;base64,${display}") format("truetype"); font-weight: 700; }
      @font-face { font-family: "Body"; src: url("data:font/ttf;base64,${bodyFont}") format("truetype"); font-weight: 700; }
    </style>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#142015" stop-opacity="0.18"/>
      <stop offset="38%" stop-color="#142015" stop-opacity="0.55"/>
      <stop offset="62%" stop-color="#142015" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#142015" stop-opacity="0.28"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#142015" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>
  ${titleSvg}
  <text x="600" y="${urlY}" text-anchor="middle" fill="#f7f1e4" filter="url(#shadow)" font-family="Body, Segoe UI, sans-serif" font-size="28" font-weight="700">vegetable.glimpsegaze.com</text>
</svg>`;

  await sharp(photo)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`public/og/${locale.id}.jpg`);
  console.log(locale.id, lines.join(' / '));
}

writeFileSync('public/sitemap.xml', sitemapXml(), 'utf8');
console.log('sitemap.xml');
