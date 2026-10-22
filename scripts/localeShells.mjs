import { LOCALES } from '../src/i18n/locales.js';
import { bundles } from '../src/i18n/messages/index.js';

export const SITE = 'https://vegetable.glimpsegaze.com';

const OG_LOCALE = {
  en: 'en_GB',
  pl: 'pl_PL',
  zh: 'zh_CN',
  'zh-hant': 'zh_TW',
  ko: 'ko_KR',
  th: 'th_TH',
  fr: 'fr_FR',
  it: 'it_IT',
  de: 'de_DE',
  es: 'es_ES',
  'es-mx': 'es_MX',
  'pt-br': 'pt_BR',
  'pt-pt': 'pt_PT',
};

const en = bundles.en.home;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function replaceAll(html, from, to) {
  return html.split(from).join(to);
}

function replaceBlurb(html, english, localized) {
  const enParts = String(english).split(/\n+/).filter(Boolean);
  const localParts = String(localized).split(/\n+/).filter(Boolean);
  if (enParts.length < 2 || localParts.length !== enParts.length) {
    return replaceAll(html, english, escapeHtml(localized));
  }
  return enParts.reduce(
    (next, part, index) => replaceAll(next, part, escapeHtml(localParts[index] || '')),
    html,
  );
}

export const RESULT_CATEGORIES = [
  'first-instincts',
  'why-vegetabley',
  'sort-buckets',
  'vegetabley-spectrum',
  'most-vegetable',
  'vegetabley-words',
];

export function pageUrl(localeId) {
  return `${SITE}/${localeId}`;
}

export function resultsUrl(localeId, categoryId) {
  return `${SITE}/${localeId}/results/${categoryId}`;
}

export function localizeIndexHtml(html, localeId) {
  const home = bundles[localeId]?.home;
  const locale = LOCALES.find((item) => item.id === localeId);
  if (!home || !locale) throw new Error(`Unknown locale: ${localeId}`);

  let next = html;
  next = replaceAll(
    next,
    '<html lang="en" prefix="og: https://ogp.me/ns#">',
    `<html lang="${locale.htmlLang}" prefix="og: https://ogp.me/ns#">`,
  );
  next = replaceAll(next, en.description, escapeHtml(home.description));
  next = replaceBlurb(next, en.blurb, home.blurb);
  next = replaceAll(next, en.lede, escapeHtml(home.lede));
  next = replaceAll(next, en.question, escapeHtml(home.question));
  next = replaceAll(next, en.title, escapeHtml(home.title));
  next = replaceAll(next, en.eyebrow, escapeHtml(home.eyebrow));
  next = replaceAll(next, en.takeSurvey, escapeHtml(home.takeSurvey));
  next = replaceAll(next, en.seeResults, escapeHtml(home.seeResults));
  next = replaceAll(next, 'href="/en/survey"', `href="/${localeId}/survey"`);
  next = replaceAll(next, 'href="/en/results"', `href="/${localeId}/results"`);
  next = replaceAll(next, `${SITE}/og/en.jpg`, `${SITE}/og/${localeId}.jpg`);
  next = replaceAll(
    next,
    'rel="canonical" href="https://vegetable.glimpsegaze.com/"',
    `rel="canonical" href="${pageUrl(localeId)}"`,
  );
  next = replaceAll(
    next,
    'property="og:locale" content="en_GB"',
    `property="og:locale" content="${OG_LOCALE[localeId]}"`,
  );
  next = next.replace(/\s*<meta property="og:url" content="https:\/\/vegetable\.glimpsegaze\.com" \/>/, '');
  return next;
}

/** Stable question title, prompt, and popup note. Live vote counts stay out. */
export function localizeResultsHtml(html, localeId, categoryId) {
  const home = bundles[localeId]?.home;
  const category = bundles[localeId]?.results?.categories?.[categoryId];
  if (!home || !category?.title || !category?.prompt || !category?.designNote) {
    throw new Error(`Missing results copy: ${localeId}/${categoryId}`);
  }

  let next = localizeIndexHtml(html, localeId);
  const survey = escapeHtml(home.title);
  const heading = escapeHtml(category.title);
  next = replaceAll(next, `<title>${survey}</title>`, `<title>${heading} — ${survey}</title>`);
  next = replaceAll(next, escapeHtml(home.description), escapeHtml(category.prompt));

  const localeIds = LOCALES.map((locale) => locale.id).sort((a, b) => b.length - a.length);
  for (const id of localeIds) {
    next = replaceAll(next, `${SITE}/${id}"`, `${resultsUrl(id, categoryId)}"`);
  }
  next = replaceAll(next, `${SITE}/"`, `${resultsUrl('en', categoryId)}"`);

  const notes = String(category.designNote)
    .split(/\n\n+/)
    .map((part) => `          <p class="home-lede">${escapeHtml(part)}</p>`)
    .join('\n');
  const languages = LOCALES.map(
    (locale) =>
      `            <a href="/${locale.id}/results/${categoryId}" hreflang="${locale.htmlLang}" lang="${locale.htmlLang}">${escapeHtml(locale.nativeName)}</a>`,
  ).join('\n');
  const main = `    <main class="home-shell">
      <article class="home-panel">
        <p class="eyebrow">${escapeHtml(category.eyebrow || '')}</p>
        <h1 class="home-title">${heading}</h1>
        <p class="home-blurb">${escapeHtml(category.prompt)}</p>
${notes}
        <nav class="home-locales" aria-label="${escapeHtml(home.language)}">
${languages}
        </nav>
      </article>
    </main>`;
  return next.replace(/<main class="home-shell">[\s\S]*?<\/main>/, main);
}

function alternateLinks(hrefFor) {
  const links = [
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${hrefFor('x-default')}" />`,
    ...LOCALES.map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${locale.htmlLang}" href="${hrefFor(locale.id)}" />`,
    ),
  ];
  return links.join('\n');
}

function urlEntry(loc, links) {
  return `  <url>
    <loc>${loc}</loc>
${links}
  </url>`;
}

export function sitemapXml() {
  const homeLinks = alternateLinks((id) => (id === 'x-default' ? `${SITE}/` : pageUrl(id)));
  const homes = [`${SITE}/`, ...LOCALES.map((locale) => pageUrl(locale.id))].map((loc) =>
    urlEntry(loc, homeLinks),
  );
  const results = RESULT_CATEGORIES.flatMap((categoryId) => {
    const links = alternateLinks((id) =>
      resultsUrl(id === 'x-default' ? 'en' : id, categoryId),
    );
    return LOCALES.map((locale) => urlEntry(resultsUrl(locale.id, categoryId), links));
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...homes, ...results].join('\n')}
</urlset>
`;
}

export function hreflangHead() {
  const links = [
    `    <link rel="canonical" href="${SITE}/" />`,
    `    <link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
    ...LOCALES.map(
      (locale) =>
        `    <link rel="alternate" hreflang="${locale.htmlLang}" href="${pageUrl(locale.id)}" />`,
    ),
    `    <meta property="og:locale" content="en_GB" />`,
    ...LOCALES.filter((locale) => locale.id !== 'en').map(
      (locale) =>
        `    <meta property="og:locale:alternate" content="${OG_LOCALE[locale.id]}" />`,
    ),
  ];
  return links.join('\n');
}
