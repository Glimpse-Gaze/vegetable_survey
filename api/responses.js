import { insertResponse, validateResponsePayload } from '../server/responses.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = req.body;
    validateResponsePayload(payload);
    const row = await insertResponse(payload, process.env.DATABASE_URL);
    res.status(201).json({ id: row.id, createdAt: row.created_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    const status = message.includes('Missing') || message.includes('too large')
      ? 400
      : 500;
    res.status(status).json({ error: message });
  }
}
