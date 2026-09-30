import { useState } from 'react';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const MAX_LENGTH = 1000;

export function Question6({ onContinue, onBack, initialDescription }) {
  const [text, setText] = useState(initialDescription?.text ?? '');
  const [publicDisplay, setPublicDisplay] = useState(
    initialDescription?.publicDisplay ?? false,
  );
  const canContinue = text.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;

    onContinue({
      openDescription: {
        text: text.trim(),
        publicDisplay,
      },
    });
  }

  return (
    <QuestionContainer questionNumber={6}>
      <h1 className="question-title">What makes something feel vegetabley?</h1>
      <p className="microcopy">
        Which criteria did you use to pick the most vegetable vegetable? Write
        freely. There are no wrong answers.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="open-description">
          Your description
        </label>
        <textarea
          id="open-description"
          className="open-description"
          value={text}
          maxLength={MAX_LENGTH}
          rows={8}
          onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
          placeholder="Type whatever comes to mind..."
        />
        <p className="character-count">
          {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </p>

        <label className="public-consent">
          <input
            className="criterion-input"
            type="checkbox"
            checked={publicDisplay}
            onChange={(event) => setPublicDisplay(event.target.checked)}
          />
          <span>I agree to display this answer publicly.</span>
        </label>

        <QuestionNav
          onBack={onBack}
          continueDisabled={!canContinue}
          continueHint={!canContinue ? 'Write a little something' : undefined}
          continueHintId="description-hint"
        />
      </form>
    </QuestionContainer>
  );
}
