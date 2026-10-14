import { loadLiveResults } from '../server/liveResults.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const summary = await loadLiveResults(process.env.DATABASE_URL);
    res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );
    res.status(200).json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load.';
    res.status(500).json({ error: message });
  }
}
