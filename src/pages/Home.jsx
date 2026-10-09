import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { withLocale } from '../i18n/paths.js';

export function Home() {
  const navigate = useNavigate();
  const { t, locale, setLocale, locales } = useI18n();
  const [askResults, setAskResults] = useState(false);

  return (
    <div className="home-shell">
      <label className="home-locale">
        <span className="sr-only">{t('home.language')}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          {locales.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nativeName}
            </option>
          ))}
        </select>
      </label>
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
            onClick={() => setAskResults(true)}
          >
            {t('home.seeResults')}
          </button>
        </div>
      </section>
      {askResults ? (
        <ConfirmDialog
          title={t('home.skipTitle')}
          message={t('home.skipMessage')}
          confirmLabel={t('dialog.proceed')}
          cancelLabel={t('dialog.cancel')}
          onConfirm={() => navigate(withLocale(locale, '/results'))}
          onCancel={() => setAskResults(false)}
        />
      ) : null}
    </div>
  );
}
