import { neon } from '@neondatabase/serverless';
import { consumeRateLimit } from './rateLimit.js';

const MAX_BODY_BYTES = 200_000;
const MAX_DEV_MESSAGE = 1000;
const RESPONSE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let ensuredDevColumn = false;

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

export function comparisonFromPayload(payload) {
  const publicWriteup = Boolean(payload?.openDescription?.publicDisplay);
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
    openDescription: publicWriteup
      ? payload.openDescription
      : { text: '', publicDisplay: false },
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

export async function insertResponse(payload, databaseUrl) {
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_BODY_BYTES) {
    throw new Error('Response is too large.');
  }

  validateResponsePayload(payload);
  await ensureDeveloperMessageColumn(databaseUrl);
  const sql = neon(databaseUrl);
  const publicDisplay = Boolean(payload.openDescription?.publicDisplay);
  const rows = await sql`
    INSERT INTO responses (payload, public_display)
    VALUES (${serialized}::jsonb, ${publicDisplay})
    RETURNING id, created_at
  `;

  return rows[0];
}

export async function lookupComparison(id, databaseUrl) {
  if (!RESPONSE_ID.test(String(id ?? ''))) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT id, payload
    FROM responses
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows.length) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  return {
    id: rows[0].id,
    ...comparisonFromPayload(rows[0].payload),
  };
}

export async function responseExists(id, databaseUrl) {
  if (!RESPONSE_ID.test(String(id ?? ''))) return false;
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT 1
    FROM responses
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function insertResponseLimited(payload, databaseUrl, bucket) {
  await consumeRateLimit(databaseUrl, `submit:${bucket}`, 6, 15 * 60);
  return insertResponse(payload, databaseUrl);
}

export async function saveDeveloperMessage(id, message, databaseUrl) {
  if (!RESPONSE_ID.test(String(id ?? ''))) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  const trimmed = String(message ?? '').trim().slice(0, MAX_DEV_MESSAGE);
  if (!trimmed) {
    throw new Error('Write a little something, or skip this.');
  }

  await consumeRateLimit(databaseUrl, `devnote:${id}`, 8, 15 * 60);
  await ensureDeveloperMessageColumn(databaseUrl);
  const sql = neon(databaseUrl);
  const rows = await sql`
    UPDATE responses
    SET developer_message = ${trimmed}
    WHERE id = ${id}
    RETURNING id
  `;
  if (!rows.length) {
    const error = new Error('Unknown code.');
    error.status = 404;
    throw error;
  }
  return { id: rows[0].id };
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
