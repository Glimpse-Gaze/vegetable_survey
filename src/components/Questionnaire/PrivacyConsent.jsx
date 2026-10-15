import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function PrivacyConsent({ onContinue, onBack }) {
  const { t } = useI18n();
  const [consented, setConsented] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!consented) return;

    onContinue({
      processingConsent: {
        agreed: true,
        agreedAt: new Date().toISOString(),
      },
    });
  }

  return (
    <QuestionContainer eyebrow={t('welcome.eyebrow')}>
      <h1 className="question-title">{t('privacy.title')}</h1>

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="privacy-block">
          <p className="privacy-copy">
            {t('privacy.saved')}
            <br />
            {t('privacy.unlink')}
          </p>
          <label className="public-consent">
            <input
              className="criterion-input"
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>{t('privacy.consent')}</span>
          </label>
        </div>

        <QuestionNav
          onBack={onBack}
          backHint={t('privacy.backHint')}
          backHintId="consent-back-hint"
          continueDisabled={!consented}
          continueHint={!consented ? t('privacy.continueHint') : undefined}
          continueHintId="consent-hint"
        />
      </form>
    </QuestionContainer>
  );
}
