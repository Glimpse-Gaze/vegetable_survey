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
        This is a short questionnaire about what people count as a vegetable. It's designed to be a fun way to learn about people's thoughts and opinions. It takes about seven minutes to complete it.
        <br /><br />
        There are no bad answers. Use your intuition and first instincts, and feel free to submit personal opinions.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="privacy-block">
          <p className="privacy-copy">
            Due to the nature of this project, your answers will be stored, and part of them will be accessible to the public. 
            One question includes a free-form written answer. It will only shown publicly if you agree to it through a checkbox; otherwise it stays in
            the research set only.
            The last, optional question, asks about your region and language. This is only used to add nuance to the results and is entirely optional.
            We do not ask about your name, email, and we don't collect your IP address with your answers. We may briefly count requests so the vote buttons cannot be flooded. Your answers will be stored anonymously and will not be linked to you in any way.
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
