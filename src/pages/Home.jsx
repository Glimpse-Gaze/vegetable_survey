import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandFooter } from '../components/BrandFooter.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { LocaleSwitcher } from '../components/LocaleSwitcher.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { withLocale } from '../i18n/paths.js';
import { acknowledgeResults, readMyResponseId } from '../utils/myResponse.js';
import { version } from '../../package.json';

export function Home() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [askResults, setAskResults] = useState(false);
  const resultsPath = withLocale(locale, '/results');

  function handleSeeResults() {
    if (readMyResponseId()) {
      navigate(resultsPath);
      return;
    }
    setAskResults(true);
  }

  return (
    <div className="home-shell">
      <div className="locale-tools">
        <LocaleSwitcher />
      </div>
      <section className="home-panel">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1 className="home-title">{t('home.title')}</h1>
        <p className="home-lede">
          {t('home.question')}
          <br /><br />
          {t('home.lede')}
        </p>
        <div className="home-actions">
          <Link className="home-button home-button-primary" to={withLocale(locale, '/survey')}>
            {t('home.takeSurvey')}
          </Link>
          <button
            className="home-button home-button-secondary"
            type="button"
            onClick={handleSeeResults}
          >
            {t('home.seeResults')}
          </button>
        </div>
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
