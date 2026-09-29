import { neon } from '@neondatabase/serverless';

const COMMENT_ID = /^[a-z0-9_-]{1,40}$/i;
const VISITOR_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIKES = 5;
const MAX_DISLIKES = 5;

let ensured = false;

function sqlClient(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }
  return neon(databaseUrl);
}

export async function ensureReasonVotesTable(databaseUrl) {
  if (ensured) return;
  const sql = sqlClient(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS custom_reason_votes (
      comment_id text NOT NULL,
      visitor_id uuid NOT NULL,
      value smallint NOT NULL CHECK (value IN (-1, 1)),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (comment_id, visitor_id)
    )
  `;
  ensured = true;
}

export async function listReasonVoteScores(databaseUrl) {
  await ensureReasonVotesTable(databaseUrl);
  const sql = sqlClient(databaseUrl);
  const rows = await sql`
    SELECT
      comment_id,
      COUNT(*) FILTER (WHERE value = 1)::int AS likes,
      COUNT(*) FILTER (WHERE value = -1)::int AS dislikes
    FROM custom_reason_votes
    GROUP BY comment_id
  `;

  const scores = {};
  for (const row of rows) {
    const likes = Number(row.likes) || 0;
    const dislikes = Number(row.dislikes) || 0;
    scores[row.comment_id] = {
      likes,
      dislikes,
      net: likes - dislikes,
    };
  }
  return scores;
}

export async function upsertReasonVote(databaseUrl, { commentId, visitorId, value }) {
  if (!COMMENT_ID.test(commentId)) {
    throw new Error('Invalid comment.');
  }
  if (!VISITOR_ID.test(visitorId)) {
    throw new Error('Invalid visitor.');
  }
  if (![ -1, 0, 1 ].includes(value)) {
    throw new Error('Vote must be like, dislike, or clear.');
  }

  await ensureReasonVotesTable(databaseUrl);
  const sql = sqlClient(databaseUrl);

  if (value === 1 || value === -1) {
    const existing = await sql`
      SELECT comment_id, value
      FROM custom_reason_votes
      WHERE visitor_id = ${visitorId}
    `;
    const current = existing.find((row) => row.comment_id === commentId);
    if (Number(current?.value) !== value) {
      const used = existing.filter(
        (row) => row.comment_id !== commentId && Number(row.value) === value,
      ).length;
      const cap = value === 1 ? MAX_LIKES : MAX_DISLIKES;
      if (used >= cap) {
        throw new Error(
          value === 1 ? 'Like limit reached.' : 'Dislike limit reached.',
        );
      }
    }
  }

  if (value === 0) {
    await sql`
      DELETE FROM custom_reason_votes
      WHERE comment_id = ${commentId} AND visitor_id = ${visitorId}
    `;
  } else {
    await sql`
      INSERT INTO custom_reason_votes (comment_id, visitor_id, value, updated_at)
      VALUES (${commentId}, ${visitorId}, ${value}, now())
      ON CONFLICT (comment_id, visitor_id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  }

  return listReasonVoteScores(databaseUrl);
}

export async function clearVisitorReasonVotes(databaseUrl, visitorId) {
  if (!VISITOR_ID.test(visitorId)) {
    throw new Error('Invalid visitor.');
  }

  await ensureReasonVotesTable(databaseUrl);
  const sql = sqlClient(databaseUrl);
  await sql`
    DELETE FROM custom_reason_votes
    WHERE visitor_id = ${visitorId}
  `;
  return listReasonVoteScores(databaseUrl);
}
