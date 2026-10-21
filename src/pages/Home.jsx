import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandFooter } from '../components/BrandFooter.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { LocaleSwitcher } from '../components/LocaleSwitcher.jsx';
import { ShareBar } from '../components/ShareBar.jsx';
import { LOCALES } from '../i18n/locales.js';
import { useI18n } from '../i18n/useI18n.js';
import { withLocale } from '../i18n/paths.js';
import { acknowledgeResults, readMyResponseId } from '../utils/myResponse.js';
import { version } from '../../package.json';

export function Home() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [askResults, setAskResults] = useState(false);
  const resultsPath = withLocale(locale, '/results');

  return (
    <div className="home-shell">
      <div className="locale-tools">
        <LocaleSwitcher />
      </div>
      <section className="home-panel">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1 className="home-title">{t('home.title')}</h1>
        <h2 className="home-question">{t('home.question')}</h2>
        <p className="home-blurb">{t('home.blurb')}</p>
        <p className="home-lede">{t('home.lede')}</p>
        <div className="home-actions">
          <Link className="home-button home-button-primary" to={withLocale(locale, '/survey')}>
            {t('home.takeSurvey')}
          </Link>
          <Link
            className="home-button home-button-secondary"
            to={resultsPath}
            onClick={(event) => {
              if (
                event.metaKey
                || event.ctrlKey
                || event.shiftKey
                || event.altKey
                || event.button !== 0
              ) {
                return;
              }
              if (readMyResponseId()) return;
              event.preventDefault();
              setAskResults(true);
            }}
          >
            {t('home.seeResults')}
          </Link>
        </div>
        <ShareBar labelled />
        <nav className="home-locales" aria-label={t('home.language')}>
          {LOCALES.map((item) => (
            <Link
              key={item.id}
              to={`/${item.id}`}
              hrefLang={item.htmlLang}
              lang={item.htmlLang}
              aria-current={item.id === locale ? 'page' : undefined}
            >
              {item.nativeName}
            </Link>
          ))}
        </nav>
      </section>
      <BrandFooter className="brand-footer--page" />
      <p className="home-version">{version}</p>
      {askResults ? (
        <ConfirmDialog
          title={t('home.skipTitle')}
          message={t('home.skipMessage')}
          confirmLabel={t('home.skipContinue')}
          cancelLabel={t('dialog.cancel')}
          onConfirm={() => {
            acknowledgeResults();
            navigate(resultsPath);
          }}
          onCancel={() => setAskResults(false)}
        />
      ) : null}
    </div>
  );
}
