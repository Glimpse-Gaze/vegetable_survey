import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { SUPPORT_URL } from '../BrandFooter.jsx';

const TIP_DELAY_MS = 5 * 60 * 1000;

/** Resets on full page load; survives in-app results navigation. */
let tipDismissedThisLoad = false;

export function ResultsTipDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (tipDismissedThisLoad) return undefined;
    const timer = window.setTimeout(() => {
      if (!tipDismissedThisLoad) setOpen(true);
    }, TIP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    tipDismissedThisLoad = true;
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="confirm-layer results-tip-layer">
      <div
        className="confirm-card results-tip-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-tip-title"
      >
        <button
          className="results-tip-close"
          type="button"
          onClick={dismiss}
          aria-label={t('results.tip.close')}
        >
          ×
        </button>
        <h2 id="results-tip-title">{t('results.tip.title')}</h2>
        <p className="results-tip-body">
          {t('results.tip.before')}{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
            {t('results.tip.link')}
          </a>
          {t('results.tip.after')}
        </p>
        <div className="confirm-actions">
          <button
            className="home-button home-button-secondary"
            type="button"
            onClick={dismiss}
          >
            {t('results.tip.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
