import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { isResponseId } from '../../utils/myResponse.js';

export function RankingCodeFill({ onLoad }) {
  const { t } = useI18n();
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
        caught instanceof Error ? caught.message : t('codeFill.error'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="response-code-card ranking-fill-card">
      <form className="response-code-form" onSubmit={handleLoad}>
        <label htmlFor="survey-ranking-code">{t('codeFill.label')}</label>
        <div className="response-code-row">
          <input
            id="survey-ranking-code"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('codeFill.placeholder')}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" disabled={loading || !isResponseId(draft.trim())}>
            {loading ? t('codeFill.loading') : t('codeFill.open')}
          </button>
        </div>
        {error ? <p className="thanks-note-error">{error}</p> : null}
      </form>
    </div>
  );
}
