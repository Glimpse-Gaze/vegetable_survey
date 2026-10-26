/**
 * Rewrite locale criteria blocks for the Q2 roster.
 * Unchanged ids keep localized copy; rewritten/new ids use EN (except PL).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(root, 'src', 'i18n', 'messages');
const backupPath = path.join(root, 'docs', 'criteria-i18n-backup-pre-q2-migration.json');

const EN = {
  structure: 'Because of its structure or texture.',
  cooking: 'Because of the way you consume it.',
  underground: 'Because of how it grows, or how it is harvested.',
  appearance: 'Its appearance makes me think of vegetables.',
  healthy: 'It is considered healthy or nutritious.',
  local: "I'm often exposed to it.",
  just_feels: 'It just feels like a vegetable to me.',
  plant: 'It is a specific part of a plant.',
  taste: 'It has a taste I associate with vegetables.',
  childhood: "It's something I grew up eating.",
  other: 'Something else',
  savoury: 'It is usually used in savoury dishes.',
};

const PL = {
  structure: 'Ze względu na strukturę lub teksturę.',
  cooking: 'Ze względu na to, jak się to spożywa',
  underground: 'Przez to, jak to rośnie, albo jak jest zbierane',
  appearance: 'Wyglądem kojarzy mi się z warzywami',
  healthy: 'Jest zdrowe i pełne witamin',
  local: 'Często mam z tym do czynienia',
  just_feels: 'Po prostu wydaje mi się być warzywem',
  plant: 'Jest konkretną częścią rośliny',
  taste: 'Ma smak, który kojarzę z warzywami',
};

const UNCHANGED = new Set(['childhood', 'other', 'savoury']);
const ORDER = [
  'structure',
  'cooking',
  'underground',
  'appearance',
  'healthy',
  'local',
  'just_feels',
  'plant',
  'taste',
  'childhood',
  'other',
  'savoury',
];

function escapeSingle(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatBlock(labels) {
  const lines = ORDER.map((id) => `    ${id}: '${escapeSingle(labels[id])}',`);
  return `criteria: {\n${lines.join('\n')}\n  },`;
}

function buildLabels(locale, previous) {
  if (locale === 'pl') {
    return Object.fromEntries(
      ORDER.map((id) => [
        id,
        UNCHANGED.has(id) ? (previous[id] ?? EN[id]) : (PL[id] ?? EN[id]),
      ]),
    );
  }
  return Object.fromEntries(
    ORDER.map((id) => [
      id,
      UNCHANGED.has(id) ? (previous[id] ?? EN[id]) : EN[id],
    ]),
  );
}

const backup = JSON.parse(await fs.readFile(backupPath, 'utf8'));
const files = (await fs.readdir(messagesDir)).filter(
  (file) => file.endsWith('.js') && file !== 'index.js' && file !== 'en.js',
);

for (const file of files) {
  const locale = file.replace(/\.js$/, '');
  const filePath = path.join(messagesDir, file);
  const source = await fs.readFile(filePath, 'utf8');
  const previous = backup.locales[locale] ?? {};
  const labels = buildLabels(locale, previous);
  const next = source.replace(/criteria:\s*\{[\s\S]*?\n  \},/, formatBlock(labels));
  if (next === source) {
    console.warn(`No criteria block replaced in ${file}`);
    continue;
  }
  await fs.writeFile(filePath, next);
  console.log(`Updated ${file}`);
}
