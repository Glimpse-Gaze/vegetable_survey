import { useState } from 'react';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function PrivacyConsent({ onContinue }) {
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
      <h1 className="question-title">The most vegetable vegetable</h1>
      <p className="microcopy">
        A short research questionnaire about what people count as a vegetable —
        first instincts, awkward edge cases, and what feels most vegetabley.
        It takes about seven minutes. Unusual answers are welcome.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="privacy-block">
          <p className="privacy-copy">
            We store your answers for this research project. We do not ask for
            your name or email. Questions about where you grew up and which
            languages you speak are optional. The written definition is only
            shown publicly if you later tick that box; otherwise it stays in
            the research set only.
          </p>
          <label className="public-consent">
            <input
              className="criterion-input"
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>I agree to my answers being stored for this research.</span>
          </label>
        </div>

        <QuestionNav
          backMode="disabled"
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
