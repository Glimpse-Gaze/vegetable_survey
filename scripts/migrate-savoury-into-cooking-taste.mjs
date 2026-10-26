/**
 * Absorb savoury into cooking + taste (50/50), integer floor extras via duplicate ids.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, 'docs', 'q2-savoury-merge-report.json');

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
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );
}

function stripOne(list, id) {
  const index = list.indexOf(id);
  if (index === -1) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
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

  let cookingHalves = 0;
  let tasteHalves = 0;
  const dual = { cooking: 0, taste: 0, both: 0, alone: 0 };

  const rewritten = rows.map((row, index) => {
    const before = beforeLists[index];
    const hasSavoury = before.includes('savoury');
    if (!hasSavoury) {
      return {
        id: row.id,
        ranking_code: row.ranking_code,
        before,
        after: [...before],
        dualHits: [],
      };
    }

    const hadCooking = before.includes('cooking');
    const hadTaste = before.includes('taste');
    // Every savoury vote splits 50/50 into cooking + taste pools.
    cookingHalves += 0.5;
    tasteHalves += 0.5;

    const dualHits = [];
    if (hadCooking && hadTaste) {
      dual.both += 1;
      dualHits.push('cooking', 'taste');
    } else if (hadCooking) {
      dual.cooking += 1;
      dualHits.push('cooking');
    } else if (hadTaste) {
      dual.taste += 1;
      dualHits.push('taste');
    } else {
      dual.alone += 1;
      dualHits.push('alone');
    }

    return {
      id: row.id,
      ranking_code: row.ranking_code,
      before,
      after: stripOne(before, 'savoury'),
      dualHits,
    };
  });

  const extras = {
    cooking: Math.floor(cookingHalves),
    taste: Math.floor(tasteHalves),
  };
  const droppedHalves = {
    cooking: cookingHalves - extras.cooking,
    taste: tasteHalves - extras.taste,
  };

  const topUpsApplied = [];
  for (const survivor of ['cooking', 'taste']) {
    const extra = extras[survivor];
    const candidates = rewritten
      .filter((row) => row.after.includes(survivor))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    let applied = 0;
    for (const row of candidates) {
      if (applied >= extra) break;
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

  const afterHist = histogram(rewritten.map((row) => row.after));
  const changed = rewritten.filter(
    (row) => JSON.stringify(row.before) !== JSON.stringify(row.after),
  );

  const report = {
    savedAt: new Date().toISOString(),
    dryRun,
    responseCount: rows.length,
    savouryBreakdown: dual,
    cookingHalves,
    tasteHalves,
    extrasFloor: extras,
    droppedHalves,
    topUpsApplied,
    beforeHistogram: beforeHist,
    afterHistogram: afterHist,
    changedRowCount: changed.length,
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
  console.log(`Wrote ${reportPath}`);
  console.log('Breakdown:', dual);
  console.log('Extras:', extras, 'dropped:', droppedHalves);
  console.log('Before savoury/cooking/taste:', {
    savoury: beforeHist.savoury ?? 0,
    cooking: beforeHist.cooking ?? 0,
    taste: beforeHist.taste ?? 0,
  });
  console.log('After:', {
    savoury: afterHist.savoury ?? 0,
    cooking: afterHist.cooking ?? 0,
    taste: afterHist.taste ?? 0,
  });

  if (dryRun) {
    console.log('Dry run — no writes.');
    return;
  }

  for (const row of changed) {
    await sql`
      UPDATE responses
      SET payload = jsonb_set(payload, '{initialCriteria}', ${JSON.stringify(row.after)}::jsonb, true)
      WHERE id = ${row.id}
    `;
  }

  const leftover = await sql`
    SELECT COUNT(*)::int AS bad
    FROM responses
    WHERE payload->'initialCriteria' ? 'savoury'
  `;
  const verify = await sql`
    SELECT crit AS criterion, COUNT(*)::int AS votes
    FROM responses r,
    LATERAL jsonb_array_elements_text(COALESCE(r.payload->'initialCriteria', '[]'::jsonb)) AS crit
    WHERE crit IN ('cooking', 'taste', 'savoury')
    GROUP BY crit
    ORDER BY crit
  `;
  console.log('Verified:', verify);
  console.log('Leftover savoury rows:', leftover[0]?.bad ?? leftover.bad);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
