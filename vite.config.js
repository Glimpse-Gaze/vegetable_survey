import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  insertResponse,
  readJsonBody,
  validateResponsePayload,
} from './server/responses.js';
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

function surveyApiPlugin(databaseUrl) {
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
          const scores = body.reset
            ? await clearVisitorReasonVotes(databaseUrl, body.visitorId)
            : await upsertReasonVote(databaseUrl, {
                commentId: body.commentId,
                visitorId: body.visitorId,
                value: body.value,
              });
          json(res, 200, { scores });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save.';
          json(
            res,
            message.includes('Invalid') ||
            message.includes('must be') ||
            message.includes('limit')
              ? 400
              : 500,
            { error: message },
          );
        }
      });

      server.middlewares.use('/api/responses', async (req, res, next) => {
        if (req.method !== 'POST') {
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

          const payload = await readJsonBody(req);
          validateResponsePayload(payload);
          const row = await insertResponse(payload, databaseUrl);
          res.statusCode = 201;
          res.end(JSON.stringify({ id: row.id, createdAt: row.created_at }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save.';
          res.statusCode = message.includes('Missing') || message.includes('too large')
            ? 400
            : 500;
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), surveyApiPlugin(env.DATABASE_URL)],
  };
});
