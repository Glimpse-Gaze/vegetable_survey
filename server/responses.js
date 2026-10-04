import { neon } from '@neondatabase/serverless';
import { consumeRateLimit } from './rateLimit.js';
import {
  generateRankingCode,
  isPublicResponseCode,
  isUuid,
  publicResponseId,
} from './rankingCode.js';

const MAX_BODY_BYTES = 200_000;
const MAX_DEV_MESSAGE = 1000;

let ensuredDevColumn = false;
let ensuredRankingCode = false;

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function validateResponsePayload(payload) {
  if (!isPlainObject(payload)) {
    throw new Error('Response must be an object.');
  }
  if (!isPlainObject(payload.initialAssociation)) {
    throw new Error('Missing initial association.');
  }
  if (!isPlainObject(payload.sortBuckets)) {
    throw new Error('Missing bucket sort.');
  }
  if (!Array.isArray(payload.spectrum) || payload.spectrum.length !== 10) {
    throw new Error('Spectrum must list ten items.');
  }
  if (!isPlainObject(payload.mostVegetable)) {
    throw new Error('Missing most-vegetable answer.');
  }
  if (!isPlainObject(payload.openDescription)) {
    throw new Error('Missing written definition.');
  }
  if (!isPlainObject(payload.background)) {
    throw new Error('Missing background.');
  }
}

const MIN_PUBLIC_NOTE = 3;

export function storedOpenDescription(openDescription) {
  const text = String(openDescription?.text ?? '').trim();
  const publish =
    Boolean(openDescription?.publicDisplay) && text.length >= MIN_PUBLIC_NOTE;
  if (openDescription?.publicDisplay && !publish) {
    return { text: '', publicDisplay: false };
  }
  return {
    ...(openDescription ?? {}),
    text,
    publicDisplay: publish,
  };
}

export function comparisonFromPayload(payload) {
  const note = storedOpenDescription(payload?.openDescription);
  const publicWriteup = note.publicDisplay;
  const publicCustom = Boolean(payload?.customCriterionPublic);
  return {
    initialAssociation: payload?.initialAssociation ?? null,
    initialCriteria: Array.isArray(payload?.initialCriteria)
      ? payload.initialCriteria
      : [],
    customCriterion: publicCustom ? payload?.customCriterion ?? '' : '',
    customCriterionPublic: publicCustom,
    sortBuckets: payload?.sortBuckets ?? null,
    spectrum: Array.isArray(payload?.spectrum) ? payload.spectrum : [],
    mostVegetable: payload?.mostVegetable ?? null,
    openDescription: publicWriteup ? note : { text: '', publicDisplay: false },
  };
}

export async function ensureDeveloperMessageColumn(databaseUrl) {
  if (ensuredDevColumn) return;
  const sql = neon(databaseUrl);
  await sql`
    ALTER TABLE responses
    ADD COLUMN IF NOT EXISTS developer_message text
  `;
  ensuredDevColumn = true;
}

export async function ensureRankingCodeColumn(databaseUrl) {
  if (ensuredRankingCode) return;
  const sql = neon(databaseUrl);
  await sql`
    ALTER TABLE responses
    ADD COLUMN IF NOT EXISTS ranking_code text
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS responses_ranking_code_idx
    ON responses (ranking_code)
    WHERE ranking_code IS NOT NULL
  `;
  ensuredRankingCode = true;
}

export async function findResponseRow(id, databaseUrl) {
  const code = String(id ?? '').trim();
  if (!isPublicResponseCode(code)) return null;
  await ensureRankingCodeColumn(databaseUrl);
  const sql = neon(databaseUrl);
  if (isUuid(code)) {
    const rows = await sql`
      SELECT id, ranking_code, payload
      FROM responses
      WHERE id = ${code}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
  const rows = await sql`
    SELECT id, ranking_code, payload
    FROM responses
    WHERE ranking_code = ${code}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function uniqueRankingCode(sql) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRankingCode();
    const rows = await sql`
      SELECT 1 FROM responses WHERE ranking_code = ${code} LIMIT 1
    `;
    if (!rows.length) return code;
  }
  throw new Error('Could not mint a ranking code.');
}

export async function insertResponse(payload, databaseUrl) {
  const openDescription = storedOpenDescription(payload.openDescription);
  const storedPayload = { ...payload, openDescription };
  const serialized = JSON.stringify(storedPayload);
  if (serialized.length > MAX_BODY_BYTES) {
    throw new Error('Response is too large.');
  }

  validateResponsePayload(storedPayload);
  await ensureDeveloperMessageColumn(databaseUrl);
  await ensureRankingCodeColumn(databaseUrl);
  const sql = neon(databaseUrl);
  const publicDisplay = openDescription.publicDisplay;
  const rankingCode = await uniqueRankingCode(sql);
  const rows = await sql`
    INSERT INTO responses (payload, public_display, ranking_code)
    VALUES (${serialized}::jsonb, ${publicDisplay}, ${rankingCode})
    RETURNING id, ranking_code, created_at
  `;

  return {
    id: publicResponseId(rows[0]),
    created_at: rows[0].created_at,
  };
}

export async function lookupComparison(id, databaseUrl) {
  const row = await findResponseRow(id, databaseUrl);
  if (!row) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  return {
    id: publicResponseId(row),
    ...comparisonFromPayload(row.payload),
  };
}

export function fillFromPayload(payload, publicId) {
  const publicCustom = Boolean(payload?.customCriterionPublic);
  return {
    id: publicId,
    initialAssociation: payload?.initialAssociation ?? null,
    initialCriteria: Array.isArray(payload?.initialCriteria)
      ? payload.initialCriteria
      : [],
    customCriterion: payload?.customCriterion ?? '',
    customCriterionPublic: publicCustom,
    sortBuckets: payload?.sortBuckets ?? null,
    spectrum: Array.isArray(payload?.spectrum) ? payload.spectrum : [],
    mostVegetable: payload?.mostVegetable ?? null,
    openDescription: storedOpenDescription(
      payload?.openDescription ?? { text: '', publicDisplay: false },
    ),
    background: payload?.background ?? null,
  };
}

export async function lookupFillPayload(id, databaseUrl) {
  const row = await findResponseRow(id, databaseUrl);
  if (!row) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  return fillFromPayload(row.payload, publicResponseId(row));
}

export async function resolveResponseUuid(id, databaseUrl) {
  const row = await findResponseRow(id, databaseUrl);
  return row ? String(row.id) : null;
}

export async function responseExists(id, databaseUrl) {
  const row = await findResponseRow(id, databaseUrl);
  return Boolean(row);
}

export async function insertResponseLimited(payload, databaseUrl, bucket) {
  await consumeRateLimit(databaseUrl, `submit:${bucket}`, 6, 15 * 60);
  return insertResponse(payload, databaseUrl);
}

export async function saveDeveloperMessage(id, message, databaseUrl) {
  const row = await findResponseRow(id, databaseUrl);
  if (!row) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  const trimmed = String(message ?? '').trim().slice(0, MAX_DEV_MESSAGE);
  if (!trimmed) {
    throw new Error('Write a little something, or skip this.');
  }

  const uuid = String(row.id);
  await consumeRateLimit(databaseUrl, `devnote:${uuid}`, 8, 15 * 60);
  await ensureDeveloperMessageColumn(databaseUrl);
  const sql = neon(databaseUrl);
  const rows = await sql`
    UPDATE responses
    SET developer_message = ${trimmed}
    WHERE id = ${uuid}
    RETURNING id, ranking_code
  `;
  if (!rows.length) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  return { id: publicResponseId(rows[0]) };
}

export async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Response is too large.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) throw new Error('Empty body.');
  return JSON.parse(raw);
}
