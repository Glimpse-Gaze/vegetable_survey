import { saveIssueReport } from '../server/issueReports.js';
import { clientIp, hashedIpBucket } from '../server/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = req.body ?? {};
    const bucket = hashedIpBucket(
      clientIp(req),
      process.env.RATE_LIMIT_SECRET || process.env.DATABASE_URL,
    );
    const row = await saveIssueReport(
      {
        message: body.message,
        locale: body.locale,
        path: body.path,
        userAgent: req.headers?.['user-agent'],
      },
      process.env.DATABASE_URL,
      bucket,
    );
    res.status(201).json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    const status =
      error?.status === 429
        ? 429
        : message.includes('Please write')
          ? 400
          : 500;
    res.status(status).json({ error: message });
  }
}
