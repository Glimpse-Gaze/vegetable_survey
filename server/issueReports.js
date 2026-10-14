import { neon } from '@neondatabase/serverless';
import { consumeRateLimit } from './rateLimit.js';

const MAX_MESSAGE = 5000;

let ensuredTable = false;

async function ensureIssueReportsTable(databaseUrl) {
  if (ensuredTable) return;
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS issue_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      message text NOT NULL,
      locale text,
      path text,
      user_agent text
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS issue_reports_created_at_idx
    ON issue_reports (created_at DESC)
  `;
  ensuredTable = true;
}

export async function saveIssueReport(
  { message, locale, path, userAgent },
  databaseUrl,
  bucket,
) {
  const trimmed = String(message ?? '').trim().slice(0, MAX_MESSAGE);
  if (!trimmed) {
    throw new Error('Please write a short message.');
  }

  await consumeRateLimit(databaseUrl, `issue:${bucket}`, 5, 15 * 60);
  await ensureIssueReportsTable(databaseUrl);

  const sql = neon(databaseUrl);
  const rows = await sql`
    INSERT INTO issue_reports (message, locale, path, user_agent)
    VALUES (
      ${trimmed},
      ${locale ? String(locale).slice(0, 16) : null},
      ${path ? String(path).slice(0, 512) : null},
      ${userAgent ? String(userAgent).slice(0, 512) : null}
    )
    RETURNING id, created_at
  `;

  return { id: rows[0].id, createdAt: rows[0].created_at };
}
