import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isResponseId, resultsSharePath } from '../../utils/myResponse.js';

export function SurveyNudge({ kind = 'compare' }) {
  return (
    <p className="survey-nudge">
      <Link to="/survey">Complete the survey</Link>
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
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const sharePath = resultsSharePath(categoryId, code);

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

  function handleLoad(event) {
    event.preventDefault();
    const next = draft.trim();
    if (!isResponseId(next)) return;
    navigate(resultsSharePath(categoryId, next));
    setDraft('');
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
      {viewingOther && code ? (
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
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste a code…"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" disabled={!isResponseId(draft.trim())}>
            Open
          </button>
        </div>
      </form>
    </div>
  );
}
