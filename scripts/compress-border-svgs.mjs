/**
 * Rasterize Mainpage_border SVGs to transparent WebP for the homepage.
 * Originals in SVG/ are left untouched; output goes to web/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch (error) {
  console.error('Cannot load sharp. From the project folder, run: npm install');
  console.error(error?.message ?? error);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src', 'assets', 'Mainpage_border', 'SVG');
const outDir = path.join(root, 'src', 'assets', 'Mainpage_border', 'web');

/** Display-oriented caps (covers ~2x up to ~1600 CSS px / tall desktops). */
const SPECS = {
  'Top.svg': { width: 2800, density: 144 },
  'Bottom2.svg': { width: 2800, density: 144 },
  'Left.svg': { height: 2400, density: 144 },
  'Right.svg': { height: 2400, density: 144 },
};

const QUALITY = 82;

async function compressOne(fileName) {
  const spec = SPECS[fileName];
  if (!spec) return null;

  const inputPath = path.join(srcDir, fileName);
  const outName = fileName.replace(/\.svg$/i, '.webp');
  const outputPath = path.join(outDir, outName);
  const before = (await fs.stat(inputPath)).size;

  let pipeline = sharp(inputPath, { density: spec.density, unlimited: true }).ensureAlpha();
  if (spec.width) {
    pipeline = pipeline.resize({
      width: spec.width,
      fit: 'inside',
      withoutEnlargement: false,
    });
  } else {
    pipeline = pipeline.resize({
      height: spec.height,
      fit: 'inside',
      withoutEnlargement: false,
    });
  }

  const output = await pipeline.webp({ quality: QUALITY, alphaQuality: 90 }).toBuffer();
  await fs.writeFile(outputPath, output);

  return {
    file: outName,
    before,
    after: output.length,
  };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const names = Object.keys(SPECS);
  for (const name of names) {
    const result = await compressOne(name);
    if (!result) continue;
    const beforeMb = (result.before / (1024 * 1024)).toFixed(2);
    const afterKb = (result.after / 1024).toFixed(1);
    console.log(`${name} → web/${result.file}: ${beforeMb} MB → ${afterKb} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
