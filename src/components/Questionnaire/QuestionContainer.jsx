import { LocaleSwitcher } from '../LocaleSwitcher.jsx';
import { useI18n } from '../../i18n/useI18n.js';

const TOTAL_QUESTIONS = 7;

export function QuestionContainer({ questionNumber, eyebrow, children }) {
  const { t } = useI18n();
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
        <LocaleSwitcher className="locale-switcher--inline" />
      </div>
      {children}
    </section>
  );
}
