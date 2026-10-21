import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n.js';
import { withLocale } from '../../i18n/paths.js';
import { isResponseId, resultsSharePath, resultsShareUrl } from '../../utils/myResponse.js';

export function SurveyNudge({ kind = 'compare', onThisMachine = false }) {
  const { t, locale } = useI18n();
  return (
    <p className="survey-nudge">
      <Link to={withLocale(locale, '/survey')}>
        {onThisMachine
          ? t('results.gate.completeHere')
          : t('results.gate.complete')}
      </Link>{kind === 'vote' ? t('results.gate.toVote') : t('results.gate.toCompare')}
    </p>
  );
}

export function OwnRankingCode({ code }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  async function copyLink() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(resultsShareUrl(locale, code));
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="response-code-own">
      <p className="response-code-title">{t('results.gate.rankingsTitle')}</p>
      <p className="response-code-kicker">{t('results.gate.yourCode')}</p>
      <button
        className={copied ? 'response-code is-copied' : 'response-code'}
        type="button"
        onClick={copyCode}
        aria-live="polite"
      >
        {copied ? t('results.gate.copied') : code}
      </button>
      <button
        className={linkCopied ? 'response-code-copy response-code-share is-copied' : 'response-code-copy response-code-share'}
        type="button"
        onClick={copyLink}
      >
        {linkCopied ? t('results.gate.linkCopied') : t('results.gate.shareLink')}
      </button>
      <p className="response-code-hint">{t('results.gate.keepCode')}</p>
    </div>
  );
}

export function ResponseCodeCard({
  code,
  categoryId,
  viewingOther = false,
  invalid = false,
}) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState('');
  const [filledFrom, setFilledFrom] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [openedFor, setOpenedFor] = useState('');
  const [formError, setFormError] = useState('');
  const [checking, setChecking] = useState(false);
  const error = formError || (invalid ? t('results.gate.incorrect') : '');
  const opened = openedFor === categoryId;
  const showForm = opened || invalid || !code;

  if (invalid && filledFrom !== code) {
    setFilledFrom(code ?? '');
    setDraft(code ?? '');
  }

  async function copyLink() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(resultsShareUrl(locale, code));
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  async function handleLoad(event) {
    event.preventDefault();
    const next = draft.trim();
    if (!next || checking) return;
    if (!isResponseId(next)) {
      setFormError(t('results.gate.incorrect'));
      setOpenedFor(categoryId);
      return;
    }
    setChecking(true);
    try {
      const result = await fetch(`/api/responses?id=${encodeURIComponent(next)}`);
      if (!result.ok) {
        setFormError(t('results.gate.incorrect'));
        setOpenedFor(categoryId);
        return;
      }
    } catch {
      setFormError(t('results.gate.incorrect'));
      setOpenedFor(categoryId);
      return;
    } finally {
      setChecking(false);
    }
    setFormError('');
    navigate(withLocale(locale, resultsSharePath(categoryId, next)));
    setDraft('');
    setOpenedFor('');
  }

  if (!showForm) {
    return (
      <button
        className="response-code-pill"
        type="button"
        onClick={() => setOpenedFor(categoryId)}
      >
        {t('results.gate.rankingsTitle')}
      </button>
    );
  }

  return (
    <div className="response-code-card is-rankings">
      {code && !viewingOther ? <OwnRankingCode code={code} /> : null}
      {viewingOther && code && !invalid ? (
        <p className="response-code-line">
          {t('results.gate.viewing')}{' '}
          <code className="response-code">{code}</code>
          <button
            className={
              linkCopied ? 'response-code-copy is-copied' : 'response-code-copy'
            }
            type="button"
            onClick={copyLink}
          >
            {linkCopied ? t('results.gate.linkCopied') : t('results.gate.shareLink')}
          </button>
        </p>
      ) : null}
      <form className="response-code-form" onSubmit={handleLoad}>
        <label htmlFor="ranking-code">{t('results.gate.openCode')}</label>
        <div className="response-code-row">
          <textarea
            id="ranking-code"
            rows={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.replace(/[\r\n]+/g, ''));
              setFormError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t('results.gate.paste')}
            autoComplete="off"
            spellCheck="false"
            aria-invalid={error ? true : undefined}
          />
          <button type="submit" disabled={!draft.trim() || checking}>
            {t('results.gate.open')}
          </button>
        </div>
        {error ? (
          <p className="response-code-error" role="alert">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
