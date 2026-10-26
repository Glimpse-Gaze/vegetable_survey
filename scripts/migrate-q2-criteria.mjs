/**
 * Rewrite responses.payload.initialCriteria for the Q2 criteria roster.
 * Loads DATABASE_URL from .env.local (never logs the secret).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, 'docs', 'q2-criteria-migration-report.json');

const FINAL = new Set([
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
]);

/** absorbed id → survivor */
const ABSORB = {
  green: 'appearance',
  regularly_eaten: 'local',
  edible: 'plant',
  common_label: 'just_feels',
};

const MERGE_PAIRS = [
  { absorbed: 'green', survivor: 'appearance' },
  { absorbed: 'regularly_eaten', survivor: 'local' },
  { absorbed: 'edible', survivor: 'plant' },
  { absorbed: 'common_label', survivor: 'just_feels' },
];

async function readDatabaseUrl() {
  const text = await fs.readFile(path.join(root, '.env.local'), 'utf8');
  const line = text.split(/\r?\n/).find((row) => row.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL missing in .env.local');
  let value = line.slice('DATABASE_URL='.length).trim();
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function histogram(lists) {
  const counts = {};
  for (const list of lists) {
    for (const id of list) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function rewriteList(original) {
  const dualHits = {};
  for (const pair of MERGE_PAIRS) {
    const hasAbsorbed = original.includes(pair.absorbed);
    const hasSurvivor = original.includes(pair.survivor);
    if (hasAbsorbed && hasSurvivor) dualHits[pair.survivor] = true;
  }

  const mapped = original.map((id) => ABSORB[id] ?? id);
  const next = [];
  const seen = new Set();
  for (const id of mapped) {
    if (!FINAL.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return { next, dualHits };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sql = neon(await readDatabaseUrl());

  const rows = await sql`
    SELECT id, ranking_code, payload->'initialCriteria' AS criteria
    FROM responses
    ORDER BY id
  `;

  const beforeLists = rows.map((row) =>
    Array.isArray(row.criteria) ? row.criteria.map(String) : [],
  );
  const beforeHist = histogram(beforeLists);

  const dualCounts = Object.fromEntries(MERGE_PAIRS.map((p) => [p.survivor, 0]));
  const rewritten = rows.map((row, index) => {
    const original = beforeLists[index];
    const { next, dualHits } = rewriteList(original);
    for (const survivor of Object.keys(dualHits)) {
      dualCounts[survivor] += 1;
    }
    return {
      id: row.id,
      ranking_code: row.ranking_code,
      before: original,
      after: next,
      dualHits: Object.keys(dualHits),
    };
  });

  const halfPools = Object.fromEntries(
    MERGE_PAIRS.map((p) => [p.survivor, dualCounts[p.survivor] * 0.5]),
  );
  const extras = Object.fromEntries(
    Object.entries(halfPools).map(([id, halves]) => [id, Math.floor(halves)]),
  );
  const droppedHalves = Object.fromEntries(
    Object.entries(halfPools).map(([id, halves]) => [id, halves - Math.floor(halves)]),
  );

  const topUpsApplied = [];
  for (const [survivor, extra] of Object.entries(extras)) {
    if (extra <= 0) continue;
    const candidates = rewritten
      .filter((row) => row.after.includes(survivor))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    let applied = 0;
    for (const row of candidates) {
      if (applied >= extra) break;
      // One duplicate occurrence = +1 aggregate vote for this survivor.
      row.after.push(survivor);
      topUpsApplied.push({
        survivor,
        id: row.id,
        ranking_code: row.ranking_code,
      });
      applied += 1;
    }
    if (applied < extra) {
      throw new Error(`Could not place ${extra} top-ups for ${survivor}; only ${applied}`);
    }
  }

  const afterLists = rewritten.map((row) => row.after);
  const afterHist = histogram(afterLists);

  const changed = rewritten.filter(
    (row) => JSON.stringify(row.before) !== JSON.stringify(row.after),
  );

  const report = {
    savedAt: new Date().toISOString(),
    dryRun,
    responseCount: rows.length,
    beforeHistogram: beforeHist,
    afterHistogram: afterHist,
    dualSelectCounts: dualCounts,
    halfPools,
    extrasFloor: extras,
    droppedHalves,
    topUpsApplied,
    changedRowCount: changed.length,
    unchangedRowCount: rows.length - changed.length,
    sampleChanges: changed.slice(0, 12).map((row) => ({
      id: row.id,
      ranking_code: row.ranking_code,
      before: row.before,
      after: row.after,
      dualHits: row.dualHits,
    })),
    allChanged: changed.map((row) => ({
      id: row.id,
      ranking_code: row.ranking_code,
      before: row.before,
      after: row.after,
      dualHits: row.dualHits,
    })),
  };

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote report ${reportPath}`);
  console.log(`Rows: ${rows.length}, changed: ${changed.length}, dryRun: ${dryRun}`);
  console.log('Before:', beforeHist);
  console.log('After:', afterHist);
  console.log('Extras:', extras);

  if (dryRun) {
    console.log('Dry run — no database writes.');
    return;
  }

  for (const row of rewritten) {
    if (JSON.stringify(row.before) === JSON.stringify(row.after)) continue;
    await sql`
      UPDATE responses
      SET payload = jsonb_set(payload, '{initialCriteria}', ${JSON.stringify(row.after)}::jsonb, true)
      WHERE id = ${row.id}
    `;
  }

  const verify = await sql`
    SELECT crit AS criterion, COUNT(*)::int AS votes
    FROM responses r,
    LATERAL jsonb_array_elements_text(COALESCE(r.payload->'initialCriteria', '[]'::jsonb)) AS crit
    GROUP BY crit
    ORDER BY votes DESC, crit
  `;
  const leftover = await sql`
    SELECT COUNT(*)::int AS bad
    FROM responses r,
    LATERAL jsonb_array_elements_text(COALESCE(r.payload->'initialCriteria', '[]'::jsonb)) AS crit
    WHERE crit IN ('green', 'regularly_eaten', 'edible', 'common_label')
  `;

  console.log('Verified histogram:', Object.fromEntries(verify.map((r) => [r.criterion, r.votes])));
  console.log('Leftover absorbed ids:', leftover[0]?.bad ?? leftover.bad);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
