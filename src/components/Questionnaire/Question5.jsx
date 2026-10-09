import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import { findCanonicalMatch, getSuggestions } from '../../utils/autocomplete.js';
import { AutocompleteInput } from './AutocompleteInput.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function Question5({ onContinue, onBack, initialMostVegetable }) {
  const { t, locale } = useI18n();
  const { vegetables } = useSurveyCatalog();
  const [value, setValue] = useState(initialMostVegetable?.rawAnswer ?? '');
  const [picked, setPicked] = useState(() => {
    if (
      initialMostVegetable?.selectionMethod === 'autocomplete' &&
      initialMostVegetable.canonicalId
    ) {
      return {
        id: initialMostVegetable.canonicalId,
        name: initialMostVegetable.rawAnswer,
      };
    }
    return null;
  });
  const suggestions = getSuggestions(value, vegetables, 6, locale);
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
      mostVegetable: {
        rawAnswer,
        canonicalId: picked
          ? picked.id
          : findCanonicalMatch(rawAnswer, vegetables),
        selectionMethod: picked ? 'autocomplete' : 'free_text',
      },
    });
  }

  return (
    <QuestionContainer questionNumber={5}>
      <h1 className="question-title">{t('q5.title')}</h1>
      <p className="microcopy">{t('q5.micro')}</p>

      <form className="question-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="most-vegetable-answer">
          {t('q5.label')}
        </label>
        <AutocompleteInput
          id="most-vegetable-answer"
          value={value}
          onChange={handleChange}
          onPickSuggestion={handlePick}
          suggestions={suggestions}
          placeholder={t('q5.placeholder')}
        />
        <QuestionNav
          onBack={onBack}
          continueDisabled={!canContinue}
        />
      </form>
    </QuestionContainer>
  );
}
