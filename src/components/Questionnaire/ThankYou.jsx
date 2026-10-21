import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandFooter } from '../BrandFooter.jsx';
import { ShareBar } from '../ShareBar.jsx';
import { numberLocale as intlLocale } from '../../i18n/locales.js';
import { useI18n } from '../../i18n/useI18n.js';
import { withLocale } from '../../i18n/paths.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { submitDeveloperMessage } from '../../utils/submitResponse.js';
import { OwnRankingCode } from '../Results/SurveyGate.jsx';
import { ResultShareCards } from '../Results/ResultShareCards.jsx';
import { readMyAnswers } from '../../utils/myResponse.js';

const MAX_DEV_MESSAGE = 1000;

export function ThankYou({ responseId, answers = null }) {
  const { t, locale } = useI18n();
  const numberLocale = intlLocale(locale);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const cardAnswers = answers ?? readMyAnswers();
  const resultsTo = withLocale(locale, '/results');

  async function sendNote(event) {
    event.preventDefault();
    if (!responseId || sending || sent) return;
    const trimmed = note.trim();
    if (!trimmed) return;

    setSending(true);
    setError('');
    const result = await submitDeveloperMessage(responseId, trimmed);
    setSending(false);
    if (!result.ok) {
      setError(result.error ?? t('thanks.sendError'));
      return;
    }
    setSent(true);
  }

  return (
    <QuestionContainer>
      <h1 className="question-title">{t('thanks.title')}</h1>

      <section className="thanks-block thanks-results-block">
        <h2 className="thanks-block-title">{t('thanks.resultsTitle')}</h2>
        <p className="microcopy">{t('thanks.resultsBody')}</p>
        <div className="thanks-results-wrap">
          <Link className="continue-button thanks-results-button" to={resultsTo}>
            {t('thanks.resultsButton')}
          </Link>
        </div>
      </section>

      {responseId ? (
        <>
          <ResultShareCards answers={cardAnswers} />
          <section className="thanks-block thanks-code-block">
            <div className="response-code-card is-rankings">
              <OwnRankingCode code={responseId} />
            </div>
          </section>
          <div className="thanks-invite">
            <ShareBar labelled />
          </div>
        </>
      ) : null}

      {responseId ? (
        <section className="thanks-block thanks-comments-block">
          <h2 className="thanks-block-title">{t('thanks.commentsTitle')}</h2>
          <p className="microcopy">{t('thanks.commentsBody')}</p>
          {sent ? (
            <p className="microcopy">{t('thanks.sent')}</p>
          ) : (
            <form className="thanks-note-form" onSubmit={sendNote}>
              <label className="sr-only" htmlFor="developer-note">
                {t('thanks.commentsLabel')}
              </label>
              <textarea
                id="developer-note"
                className="open-description"
                rows={5}
                maxLength={MAX_DEV_MESSAGE}
                value={note}
                onChange={(event) =>
                  setNote(event.target.value.slice(0, MAX_DEV_MESSAGE))
                }
                placeholder={t('thanks.placeholder')}
              />
              <p className="character-count">
                {note.length.toLocaleString(numberLocale)} /{' '}
                {MAX_DEV_MESSAGE.toLocaleString(numberLocale)}
              </p>
              {error ? <p className="thanks-note-error">{error}</p> : null}
              <button
                className="continue-button"
                type="submit"
                disabled={sending || !note.trim()}
              >
                {sending ? t('thanks.sending') : t('thanks.send')}
              </button>
            </form>
          )}
        </section>
      ) : null}
      <BrandFooter className="brand-footer--page" />
    </QuestionContainer>
  );
}
