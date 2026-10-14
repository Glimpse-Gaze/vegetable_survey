import { useId, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n.js';
import reportIcon from '../assets/report.png';

const MAX_CHARS = 5000;

async function submitIssueReport({ message, locale, path }) {
  const result = await fetch('/api/issue-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, locale, path }),
  });

  if (!result.ok) {
    let error = 'Could not send the report.';
    try {
      const body = await result.json();
      if (body?.error) error = body.error;
    } catch {
      // keep default
    }
    return { ok: false, error };
  }

  return { ok: true };
}

export function ReportIssuesDialog({ onClose }) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const titleId = useId();
  const fieldId = useId();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const remaining = MAX_CHARS - message.length;
  const canSubmit = message.trim().length > 0 && status !== 'sending';

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('sending');
    setError('');
    const result = await submitIssueReport({
      message,
      locale,
      path: `${location.pathname}${location.search}`,
    });

    if (!result.ok) {
      setStatus('idle');
      setError(result.error || t('report.error'));
      return;
    }

    setStatus('sent');
  }

  return (
    <div className="confirm-layer" onClick={onClose}>
      <div
        className="confirm-card report-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {status === 'sent' ? (
          <>
            <h2 id={titleId}>{t('report.thanksTitle')}</h2>
            <p>{t('report.thanksMessage')}</p>
            <div className="confirm-actions">
              <button
                className="home-button home-button-primary"
                type="button"
                onClick={onClose}
              >
                {t('report.close')}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id={titleId}>{t('report.title')}</h2>
            <p>{t('report.description')}</p>
            <label className="report-label" htmlFor={fieldId}>
              {t('report.fieldLabel')}
            </label>
            <textarea
              id={fieldId}
              className="report-textarea"
              value={message}
              maxLength={MAX_CHARS}
              rows={7}
              placeholder={t('report.placeholder')}
              onChange={(event) => setMessage(event.target.value)}
              disabled={status === 'sending'}
            />
            <p className="report-count">
              {t('report.charsLeft', { count: remaining })}
            </p>
            {error ? <p className="field-note">{error}</p> : null}
            <div className="confirm-actions">
              <button
                className="home-button home-button-primary"
                type="submit"
                disabled={!canSubmit}
              >
                {status === 'sending' ? t('report.sending') : t('report.submit')}
              </button>
              <button
                className="home-button home-button-secondary"
                type="button"
                onClick={onClose}
                disabled={status === 'sending'}
              >
                {t('dialog.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function ReportIssuesButton({ className = '', variant = 'chip' }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const label = t('report.button');
  const iconOnly = variant === 'fab';
  const classes = ['report-issues-btn', `is-${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        className={classes}
        type="button"
        aria-label={label}
        data-tooltip={iconOnly ? label : undefined}
        onClick={() => setOpen(true)}
      >
        <img src={reportIcon} alt="" width={18} height={18} aria-hidden="true" />
        {iconOnly ? null : <span>{label}</span>}
      </button>
      {open ? <ReportIssuesDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
