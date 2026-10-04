import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isResponseId, resultsSharePath } from '../../utils/myResponse.js';

export function SurveyNudge({ kind = 'compare', onThisMachine = false }) {
  return (
    <p className="survey-nudge">
      <Link to="/survey">
        {onThisMachine
          ? 'Complete the survey on this machine'
          : 'Complete the survey'}
      </Link>
      {kind === 'vote'
        ? ' to rate answers.'
        : ' to compare your votes with others.'}
    </p>
  );
}

export function ResponseCodeCard({
  code,
  categoryId,
  viewingOther = false,
  invalid = false,
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [filledFrom, setFilledFrom] = useState('');
  const [copied, setCopied] = useState(false);
  const [openedFor, setOpenedFor] = useState('');
  const [formError, setFormError] = useState('');
  const [checking, setChecking] = useState(false);
  const sharePath = resultsSharePath(categoryId, code);
  const error = formError || (invalid ? 'Incorrect ID' : '');
  const opened = openedFor === categoryId;
  const showForm = opened || invalid || !code;

  if (invalid && filledFrom !== code) {
    setFilledFrom(code ?? '');
    setDraft(code ?? '');
  }

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

  async function handleLoad(event) {
    event.preventDefault();
    const next = draft.trim();
    if (!next || checking) return;
    if (!isResponseId(next)) {
      setFormError('Incorrect ID');
      setOpenedFor(categoryId);
      return;
    }
    setChecking(true);
    try {
      const result = await fetch(`/api/responses?id=${encodeURIComponent(next)}`);
      if (!result.ok) {
        setFormError('Incorrect ID');
        setOpenedFor(categoryId);
        return;
      }
    } catch {
      setFormError('Incorrect ID');
      setOpenedFor(categoryId);
      return;
    } finally {
      setChecking(false);
    }
    setFormError('');
    navigate(resultsSharePath(categoryId, next));
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
        Open a ranking code
      </button>
    );
  }

  return (
    <div className="response-code-card">
      {code && !viewingOther ? (
        <p className="response-code-line">
          Your code{' '}
          <code className="response-code">{code}</code>
          <button
            className={
              copied ? 'response-code-copy is-copied' : 'response-code-copy'
            }
            type="button"
            onClick={copyCode}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </p>
      ) : null}
      {viewingOther && code && !invalid ? (
        <p className="response-code-line">
          Viewing ranking{' '}
          <code className="response-code">{code}</code>
        </p>
      ) : null}
      {code && !viewingOther ? (
        <p className="response-code-hint">
          Keep this to reopen your rankings, or share{' '}
          <span className="response-code-path">{sharePath}</span>
        </p>
      ) : null}
      <form className="response-code-form" onSubmit={handleLoad}>
        <label htmlFor="ranking-code">Open a ranking code</label>
        <div className="response-code-row">
          <input
            id="ranking-code"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setFormError('');
            }}
            placeholder="Paste a code…"
            autoComplete="off"
            spellCheck="false"
            aria-invalid={error ? true : undefined}
          />
          <button type="submit" disabled={!draft.trim() || checking}>
            Open
          </button>
        </div>
        {error ? (
          <p className="response-code-error" role="alert">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
