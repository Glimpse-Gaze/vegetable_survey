import {
  insertResponseLimited,
  lookupComparison,
  validateResponsePayload,
} from '../server/responses.js';
import { clientIp, hashedIpBucket } from '../server/rateLimit.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const id = req.query?.id;
      const row = await lookupComparison(id, process.env.DATABASE_URL);
      res.status(200).json(row);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load.';
      res.status(error?.status === 404 ? 404 : 500).json({ error: message });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = req.body;
    validateResponsePayload(payload);
    const bucket = hashedIpBucket(
      clientIp(req),
      process.env.RATE_LIMIT_SECRET || process.env.DATABASE_URL,
    );
    const row = await insertResponseLimited(
      payload,
      process.env.DATABASE_URL,
      bucket,
    );
    res.status(201).json({ id: row.id, createdAt: row.created_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    const status =
      error?.status === 429
        ? 429
        : message.includes('Missing') || message.includes('too large')
          ? 400
          : 500;
    res.status(status).json({ error: message });
  }
}
