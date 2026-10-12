/**
 * Resize/compress JPGs under src/content for spectrum blades (~12rem wide).
 * Overwrites in place. Skips files already under the size budget unless --force.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src', 'content');
const MAX_EDGE = 960;
const QUALITY = 78;
const SKIP_UNDER_KB = 400;
const force = process.argv.includes('--force');

async function compressFile(filePath) {
  const before = (await fs.stat(filePath)).size;
  if (!force && before < SKIP_UNDER_KB * 1024) {
    return { file: path.basename(filePath), skipped: true, before };
  }

  const input = await fs.readFile(filePath);
  const output = await sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();

  if (output.length >= before && !force) {
    return { file: path.basename(filePath), skipped: true, before, reason: 'no-gain' };
  }

  await fs.writeFile(filePath, output);
  return {
    file: path.basename(filePath),
    before,
    after: output.length,
  };
}

const entries = await fs.readdir(contentDir, { withFileTypes: true });
const jpgs = entries
  .filter((entry) => entry.isFile() && /\.jpe?g$/i.test(entry.name))
  .map((entry) => path.join(contentDir, entry.name));

const results = [];
for (const file of jpgs) {
  results.push(await compressFile(file));
}

for (const result of results) {
  if (result.skipped) {
    console.log(
      `${result.file}: skipped${result.reason ? ` (${result.reason})` : ''}`,
    );
    continue;
  }
  const beforeKb = (result.before / 1024).toFixed(1);
  const afterKb = (result.after / 1024).toFixed(1);
  console.log(`${result.file}: ${beforeKb} KB → ${afterKb} KB`);
}
