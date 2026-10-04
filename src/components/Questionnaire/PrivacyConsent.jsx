import { useState } from 'react';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function PrivacyConsent({ onContinue, onBack }) {
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
    <QuestionContainer>
      <p className="eyebrow">Welcome</p>
      <h1 className="question-title">Privacy notice</h1>
      <p className="microcopy">
      This is a short survey examining what people consider to be a vegetable. It's designed to be a fun way to learn about people's thoughts and opinions. It takes about seven minutes to complete it.
      <br /><br />
        There are no bad answers. Use your intuition and feel free to submit personal opinions.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="privacy-block">
          <p className="privacy-copy">
            <strong>Privacy notice:</strong> Because of the nature of this project, your responses will be saved, and some will be made available to the public in the Results page.
            <br /><br />
            Your responses will not be linked to you personally in any way. One optional question asks about your birthplace and native language. This is only used to add nuance to the results and can be skipped.
          </p>
          <label className="public-consent">
            <input
              className="criterion-input"
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>I agree for my answers to be used in this research.</span>
          </label>
        </div>

        <QuestionNav
          onBack={onBack}
          backHint="Return to the main page"
          backHintId="consent-back-hint"
          continueDisabled={!consented}
          continueHint={
            !consented
              ? 'Please agree so we can store your answers'
              : undefined
          }
          continueHintId="consent-hint"
        />
      </form>
    </QuestionContainer>
  );
}
