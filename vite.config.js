import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  insertResponse,
  readJsonBody,
  validateResponsePayload,
} from './server/responses.js';

function surveyApiPlugin(databaseUrl) {
  return {
    name: 'survey-api',
    configureServer(server) {
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
