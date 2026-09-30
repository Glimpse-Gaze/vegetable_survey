import { useState } from 'react';
import { isResponseId } from '../../utils/myResponse.js';

export function RankingCodeFill({ onLoad }) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLoad(event) {
    event.preventDefault();
    const next = draft.trim();
    if (!isResponseId(next) || loading) return;
    setLoading(true);
    setError('');
    try {
      await onLoad(next);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not load that code.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="response-code-card ranking-fill-card">
      <form className="response-code-form" onSubmit={handleLoad}>
        <label htmlFor="survey-ranking-code">Open a ranking code</label>
        <div className="response-code-row">
          <input
            id="survey-ranking-code"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste a code…"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" disabled={loading || !isResponseId(draft.trim())}>
            {loading ? 'Loading…' : 'Open'}
          </button>
        </div>
        {error ? <p className="thanks-note-error">{error}</p> : null}
      </form>
    </div>
  );
}
