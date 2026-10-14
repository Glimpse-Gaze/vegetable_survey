import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { withLocale } from '../i18n/paths.js';
import { readMyResponseId } from '../utils/myResponse.js';

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
      {askResults ? (
        <ConfirmDialog
          title={t('home.skipTitle')}
          message={t('home.skipMessage')}
          confirmLabel={t('home.skipContinue')}
          cancelLabel={t('dialog.cancel')}
          onConfirm={() => navigate(resultsPath)}
          onCancel={() => setAskResults(false)}
        />
      ) : null}
    </div>
  );
}
