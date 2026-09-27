import { neon } from '@neondatabase/serverless';

const MAX_BODY_BYTES = 200_000;

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

export async function insertResponse(payload, databaseUrl) {
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_BODY_BYTES) {
    throw new Error('Response is too large.');
  }

  validateResponsePayload(payload);

  const sql = neon(databaseUrl);
  const publicDisplay = Boolean(payload.openDescription?.publicDisplay);
  const rows = await sql`
    INSERT INTO responses (payload, public_display)
    VALUES (${serialized}::jsonb, ${publicDisplay})
    RETURNING id, created_at
  `;

  return rows[0];
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
