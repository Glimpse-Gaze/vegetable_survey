import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  insertResponseLimited,
  lookupComparison,
  lookupFillPayload,
  readJsonBody,
  saveDeveloperMessage,
  validateResponsePayload,
} from './server/responses.js';
import { clientIp, hashedIpBucket } from './server/rateLimit.js';
import {
  clearVisitorReasonVotes,
  listReasonVoteScores,
  upsertReasonVote,
} from './server/reasonVotes.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function errorStatus(error, fallback = 500) {
  if (error?.status === 429 || error?.status === 403 || error?.status === 404) {
    return error.status;
  }
  return fallback;
}

function surveyApiPlugin(databaseUrl, rateSecret) {
  return {
    name: 'survey-api',
    configureServer(server) {
      server.middlewares.use('/api/reason-votes', async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next();
          return;
        }

        try {
          if (!databaseUrl) {
            if (req.method === 'GET') {
              json(res, 200, { scores: {} });
              return;
            }
            json(res, 503, { error: 'DATABASE_URL is not set.' });
            return;
          }

          if (req.method === 'GET') {
            const scores = await listReasonVoteScores(databaseUrl);
            json(res, 200, { scores });
            return;
          }

          const body = await readJsonBody(req);
          const ballotId = body.responseId || body.visitorId;
          const scores = body.reset
            ? await clearVisitorReasonVotes(
                databaseUrl,
                ballotId,
                body.family ?? null,
              )
            : await upsertReasonVote(databaseUrl, {
                commentId: body.commentId,
                responseId: ballotId,
                value: body.value,
              });
          json(res, 200, { scores });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save.';
          json(res, errorStatus(error, message.includes('Invalid') ||
            message.includes('must be') ||
            message.includes('limit')
            ? 400
            : 500), { error: message, code: error?.code });
        }
      });

      server.middlewares.use('/api/developer-message', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          if (!databaseUrl) {
            json(res, 503, { error: 'DATABASE_URL is not set.' });
            return;
          }
          const body = await readJsonBody(req);
          const row = await saveDeveloperMessage(
            body.responseId,
            body.message,
            databaseUrl,
          );
          json(res, 200, row);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save.';
          json(
            res,
            errorStatus(
              error,
              message.includes('Write a little') ? 400 : 500,
            ),
            { error: message },
          );
        }
      });

      server.middlewares.use('/api/responses', async (req, res, next) => {
        if (req.method !== 'POST' && req.method !== 'GET') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json');

        try {
          if (!databaseUrl) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'DATABASE_URL is not set.' }));
            return;
          }

          if (req.method === 'GET') {
            const url = new URL(req.url ?? '', 'http://localhost');
            const id = url.searchParams.get('id');
            const row =
              url.searchParams.get('fill') === '1'
                ? await lookupFillPayload(id, databaseUrl)
                : await lookupComparison(id, databaseUrl);
            res.statusCode = 200;
            res.end(JSON.stringify(row));
            return;
          }

          const payload = await readJsonBody(req);
          validateResponsePayload(payload);
          const bucket = hashedIpBucket(clientIp(req), rateSecret || databaseUrl);
          const row = await insertResponseLimited(payload, databaseUrl, bucket);
          res.statusCode = 201;
          res.end(JSON.stringify({ id: row.id, createdAt: row.created_at }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save.';
          res.statusCode = errorStatus(
            error,
            message.includes('Missing') || message.includes('too large')
              ? 400
              : 500,
          );
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      surveyApiPlugin(env.DATABASE_URL, env.RATE_LIMIT_SECRET),
    ],
  };
});
