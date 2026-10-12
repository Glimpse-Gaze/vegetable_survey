import { useI18n } from '../../i18n/useI18n.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function WelcomeScreen({ onContinue, onBack }) {
  const { t, locale, setLocale, locales } = useI18n();

  function handleSubmit(event) {
    event.preventDefault();
    onContinue();
  }

  return (
    <QuestionContainer>
      <h1 className="eyebrow">{t('welcome.eyebrow')}</h1>
      <div className="welcome-note">
        <p>{t('welcome.intro')}</p>
        <p>{t('welcome.noBadAnswers')}</p>
      </div>

      <form className="question-form" onSubmit={handleSubmit}>
        <p className="microcopy locale-prompt" id="locale-prompt">
          {t('welcome.languagePrompt')}
        </p>
        <div
          className="locale-pills"
          role="radiogroup"
          aria-labelledby="locale-prompt"
        >
          {locales.map((item) => {
            const selected = item.id === locale;
            return (
              <label
                key={item.id}
                className={selected ? 'locale-pill is-selected' : 'locale-pill'}
              >
                <input
                  type="radio"
                  name="survey-locale"
                  value={item.id}
                  checked={selected}
                  onChange={() => setLocale(item.id)}
                />
                {item.nativeName}
              </label>
            );
          })}
        </div>

        <QuestionNav
          onBack={onBack}
          backHint={t('welcome.backHint')}
          backHintId="welcome-back-hint"
        />
      </form>
    </QuestionContainer>
  );
}
