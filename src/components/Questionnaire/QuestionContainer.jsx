import { useI18n } from '../../i18n/useI18n.js';

const TOTAL_QUESTIONS = 7;

export function QuestionContainer({ questionNumber, children }) {
  const { t } = useI18n();

  return (
    <section className="question-panel">
      {questionNumber ? (
        <p className="eyebrow">
          {t('progress', { number: questionNumber, total: TOTAL_QUESTIONS })}
        </p>
      ) : null}
      {children}
    </section>
  );
}
