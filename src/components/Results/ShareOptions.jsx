import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import { buildResultCards } from '../../utils/resultCards.js';
import { ShareBar } from '../ShareBar.jsx';
import { AnswerCardStrip } from './ResultShareCards.jsx';
import { ResponseCodeCard } from './SurveyGate.jsx';

export function ShareOptions({
  open,
  onClose,
  onPictures,
  answers = null,
  code = '',
  categoryId,
  viewingOther = false,
  invalid = false,
}) {
  const { t } = useI18n();
  const catalog = useSurveyCatalog();
  const [compareOpen, setCompareOpen] = useState(false);
  const featured = useMemo(
    () => buildResultCards(answers, catalog).featured,
    [answers, catalog],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (viewingOther || invalid) setCompareOpen(true);
  }, [open, viewingOther, invalid]);

  if (!open) return null;

  return (
    <div className="result-cards-layer" onClick={onClose}>
      <div
        className={
          featured.length
            ? 'result-cards-dialog share-options-dialog has-pictures'
            : 'result-cards-dialog share-options-dialog'
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-options-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="result-cards-dialog-head">
          <h2 id="share-options-title">{t('results.share.options')}</h2>
          <button type="button" className="result-cards-close" onClick={onClose}>
            {t('cards.close')}
          </button>
        </div>
        <div className="share-options-list">
          <div className="share-compare">
            <p className="share-compare-hint">{t('results.share.compareHint')}</p>
            <button
              className="response-code-pill"
              type="button"
              aria-expanded={compareOpen}
              onClick={() => setCompareOpen((current) => !current)}
            >
              {t('results.gate.rankingsTitle')}
            </button>
            {compareOpen ? (
              <div className="results-share-row">
                <ResponseCodeCard
                  code={code}
                  categoryId={categoryId}
                  viewingOther={viewingOther}
                  invalid={invalid}
                  hideTitle
                />
              </div>
            ) : null}
          </div>

          <div className="share-invite">
            <strong>{t('share.invite')}</strong>
            <ShareBar />
          </div>

          {featured.length ? (
            <section className="share-pictures">
              <button type="button" className="share-pictures-open" onClick={onPictures}>
                <strong>{t('cards.title')}</strong>
                <span>{t('results.share.picturesHint')}</span>
                <em>{t('cards.more')}</em>
              </button>
              <AnswerCardStrip cards={featured} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
