import { LocaleSwitcher } from '../LocaleSwitcher.jsx';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyLocaleLocked } from '../../i18n/SurveyLocaleLock.jsx';

const TOTAL_QUESTIONS = 7;

export function QuestionContainer({ questionNumber, eyebrow, children }) {
  const { t } = useI18n();
  const localeLocked = useSurveyLocaleLocked();
  const label =
    eyebrow ??
    (questionNumber
      ? t('progress', { number: questionNumber, total: TOTAL_QUESTIONS })
      : null);

  return (
    <section className="question-panel">
      <div className="question-panel-head">
        {label ? (
          typeof label === 'string' ? (
            <p className="eyebrow">{label}</p>
          ) : (
            label
          )
        ) : (
          <span className="question-panel-head-spacer" aria-hidden="true" />
        )}
        {localeLocked ? null : (
          <LocaleSwitcher className="locale-switcher--inline" />
        )}
      </div>
      {children}
    </section>
  );
}
