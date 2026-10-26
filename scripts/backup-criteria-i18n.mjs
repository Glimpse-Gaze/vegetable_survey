/**
 * Snapshot criteria labels from every locale before Q2 migration.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(root, 'src', 'i18n', 'messages');
const outPath = path.join(root, 'docs', 'criteria-i18n-backup-pre-q2-migration.json');

function extractCriteriaBlock(source) {
  const match = source.match(/criteria:\s*\{([\s\S]*?)\n  \},/);
  if (!match) return null;
  const body = match[1];
  const out = {};
  for (const item of body.matchAll(/(\w+):\s*'((?:\\'|[^'])*)'/g)) {
    out[item[1]] = item[2].replace(/\\'/g, "'");
  }
  for (const item of body.matchAll(/(\w+):\s*"((?:\\"|[^"])*)"/g)) {
    if (!out[item[1]]) out[item[1]] = item[2].replace(/\\"/g, '"');
  }
  return out;
}

const entries = await fs.readdir(messagesDir);
const backup = {
  savedAt: new Date().toISOString(),
  note: 'Pre-migration criteria labels for comparison after Q2 rewrite.',
  locales: {},
};

for (const file of entries) {
  if (!file.endsWith('.js') || file === 'index.js' || file === 'en.js') continue;
  const source = await fs.readFile(path.join(messagesDir, file), 'utf8');
  const criteria = extractCriteriaBlock(source);
  if (!criteria) {
    console.warn(`No criteria block in ${file}`);
    continue;
  }
  backup.locales[file.replace(/\.js$/, '')] = criteria;
  console.log(`${file}: ${Object.keys(criteria).length} keys`);
}

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(backup, null, 2)}\n`);
console.log(`Wrote ${outPath}`);
