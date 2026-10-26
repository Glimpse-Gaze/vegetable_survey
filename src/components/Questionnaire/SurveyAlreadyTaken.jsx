import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n.js';
import { withLocale } from '../../i18n/paths.js';
import { resultsSharePath } from '../../utils/myResponse.js';
import { OwnRankingCode } from '../Results/SurveyGate.jsx';
import { BrandFooter } from '../BrandFooter.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';

export function SurveyAlreadyTaken({ code, onRetake, onBack }) {
  const { t, locale } = useI18n();
  const resultsTo = withLocale(
    locale,
    resultsSharePath('first-instincts', code),
  );

  return (
    <QuestionContainer eyebrow={<h1 className="eyebrow">{t('already.eyebrow')}</h1>}>
      <h1 className="question-title">{t('already.title')}</h1>
      <p className="microcopy">{t('already.body')}</p>

      <div className="already-code-wrap">
        <div className="response-code-card is-rankings">
          <OwnRankingCode code={code} />
        </div>
      </div>

      <div className="already-actions">
        <Link className="home-button home-button-primary" to={resultsTo}>
          {t('already.seeResults')}
        </Link>
        <button
          className="home-button home-button-secondary"
          type="button"
          onClick={onRetake}
        >
          {t('already.retake')}
        </button>
        {onBack ? (
          <button className="text-button already-back" type="button" onClick={onBack}>
            {t('already.backHome')}
          </button>
        ) : null}
      </div>

      <p className="microcopy already-hint">{t('already.retakeHint')}</p>
      <BrandFooter className="brand-footer--page" />
    </QuestionContainer>
  );
}
