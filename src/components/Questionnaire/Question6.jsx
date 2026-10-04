import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const MAX_LENGTH = 500;
const MIN_PUBLIC_NOTE = 3;

export function Question6({ onContinue, onBack, initialDescription }) {
  const [text, setText] = useState(initialDescription?.text ?? '');
  const [publicDisplay, setPublicDisplay] = useState(
    initialDescription?.publicDisplay ?? false,
  );
  const [askSkip, setAskSkip] = useState(false);

  function commit(nextText) {
    const trimmed = nextText.trim();
    const publish = publicDisplay && trimmed.length >= MIN_PUBLIC_NOTE;
    onContinue({
      openDescription: {
        text: publish || !publicDisplay ? trimmed : '',
        publicDisplay: publish,
      },
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setAskSkip(true);
      return;
    }
    commit(text);
  }

  return (
    <QuestionContainer questionNumber={6}>
      <h1 className="question-title">What makes something feel like a vegetable?</h1>
      <p className="microcopy">
        Which criteria did you use to rank the plants and pick the most vegetable of them all? Write
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

        <QuestionNav onBack={onBack} />
      </form>
      {askSkip ? (
        <ConfirmDialog
          title="Skip this one?"
          message="Are you sure you don't want to share your thought process?"
          onConfirm={() => commit('')}
          onCancel={() => setAskSkip(false)}
        />
      ) : null}
    </QuestionContainer>
  );
}
