import {
  clearVisitorReasonVotes,
  listReasonVoteScores,
  upsertReasonVote,
} from '../server/reasonVotes.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const scores = await listReasonVoteScores(process.env.DATABASE_URL);
      res.status(200).json({ scores });
      return;
    }

    const { commentId, visitorId, value, reset } = req.body ?? {};
    const scores = reset
      ? await clearVisitorReasonVotes(process.env.DATABASE_URL, visitorId)
      : await upsertReasonVote(process.env.DATABASE_URL, {
          commentId,
          visitorId,
          value,
        });
    res.status(200).json({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    const status =
      message.includes('Invalid') ||
      message.includes('must be') ||
      message.includes('limit')
        ? 400
        : 500;
    res.status(status).json({ error: message });
  }
}
