import { useState } from 'react';
import { vegetables } from '../../data/vegetables.js';
import { findCanonicalMatch, getSuggestions } from '../../utils/autocomplete.js';
import { AutocompleteInput } from './AutocompleteInput.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function Question1({ onContinue }) {
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState(null);
  const suggestions = getSuggestions(value, vegetables);
  const canContinue = value.trim().length > 0;

  function handleChange(nextValue) {
    setValue(nextValue);
    setPicked(null);
  }

  function handlePick(vegetable) {
    setValue(vegetable.name);
    setPicked(vegetable);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const rawAnswer = value.trim();
    if (!rawAnswer) return;

    onContinue({
      rawAnswer,
      canonicalId: picked ? picked.id : findCanonicalMatch(rawAnswer, vegetables),
      selectionMethod: picked ? 'autocomplete' : 'free_text',
    });
  }

  return (
    <QuestionContainer questionNumber={1}>
      <h1 className="question-title">
        When you hear the word “vegetable”, what comes to your mind?
      </h1>
      <p className="microcopy">Go with your first instinct. There are no wrong answers.</p>

      <form className="question-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="vegetable-answer">
          Type what comes to mind
        </label>
        <AutocompleteInput
          id="vegetable-answer"
          value={value}
          onChange={handleChange}
          onPickSuggestion={handlePick}
          suggestions={suggestions}
          placeholder="Type what comes to mind..."
        />
        <QuestionNav backMode="disabled" continueDisabled={!canContinue} />
      </form>
    </QuestionContainer>
  );
}
