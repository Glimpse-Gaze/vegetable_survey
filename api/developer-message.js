import { saveDeveloperMessage, readJsonBody } from '../server/responses.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = req.body ?? {};
    const row = await saveDeveloperMessage(
      body.responseId,
      body.message,
      process.env.DATABASE_URL,
    );
    res.status(200).json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    const status =
      error?.status === 429 || error?.status === 404
        ? error.status
        : message.includes('Write a little')
          ? 400
          : 500;
    res.status(status).json({ error: message });
  }
}
