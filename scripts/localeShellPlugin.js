import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { LOCALES } from '../src/i18n/locales.js';
import { RESULT_CATEGORIES, localizeIndexHtml, localizeResultsHtml } from './localeShells.mjs';

const LOCALE = 'zh-hant|es-mx|pt-br|pt-pt|en|pl|zh|ko|th|fr|it|de|es';
const CATEGORY = RESULT_CATEGORIES.join('|');
const RESULTS_PAGE = new RegExp(`^\\/(${LOCALE})\\/results\\/(${CATEGORY})\\/?$`);
const LOCALE_HOME = new RegExp(`^\\/(${LOCALE})(\\/.*)?$`);

export function localeShellPlugin() {
  return {
    name: 'locale-shells',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const pathname = (req.url || '').split('?')[0];
        const results = pathname.match(RESULTS_PAGE);
        const match = results ?? pathname.match(LOCALE_HOME);
        if (!match || path.extname(pathname)) {
          next();
          return;
        }
        try {
          const raw = readFileSync(path.resolve('index.html'), 'utf8');
          const html = results
            ? localizeResultsHtml(raw, results[1], results[2])
            : localizeIndexHtml(raw, match[1]);
          const transformed = await server.transformIndexHtml(req.url, html);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(transformed);
        } catch (error) {
          next(error);
        }
      });
    },
    closeBundle() {
      const distIndex = path.resolve('dist/index.html');
      const raw = readFileSync(distIndex, 'utf8');
      for (const locale of LOCALES) {
        const dir = path.resolve('dist', locale.id);
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, 'index.html'), localizeIndexHtml(raw, locale.id), 'utf8');
        for (const categoryId of RESULT_CATEGORIES) {
          const resultsDir = path.resolve(dir, 'results', categoryId);
          mkdirSync(resultsDir, { recursive: true });
          writeFileSync(
            path.join(resultsDir, 'index.html'),
            localizeResultsHtml(raw, locale.id, categoryId),
            'utf8',
          );
        }
      }
    },
  };
}
