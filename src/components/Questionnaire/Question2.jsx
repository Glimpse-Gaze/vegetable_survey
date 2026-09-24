import { useState } from 'react';
import { criteria, shuffleCriteria } from '../../data/criteria.js';
import { CriteriaSelector } from './CriteriaSelector.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const MAX_CRITERIA = 5;

export function Question2({
  rawAnswer,
  onContinue,
  onLockedBack,
  initialCriteria = [],
  initialCustomCriterion = '',
}) {
  const [orderedCriteria] = useState(() => shuffleCriteria(criteria));
  const [selectedIds, setSelectedIds] = useState(initialCriteria);
  const [customCriterion, setCustomCriterion] = useState(initialCustomCriterion);
  const otherSelected = selectedIds.includes('other');
  const customReady = !otherSelected || customCriterion.trim().length > 0;
  const canContinue = selectedIds.length > 0 && customReady;
  const atLimit = selectedIds.length >= MAX_CRITERIA;

  function handleToggle(id) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= MAX_CRITERIA) return current;
      return [...current, id];
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;

    onContinue({
      initialCriteria: selectedIds,
      customCriterion: otherSelected ? customCriterion.trim() : '',
    });
  }

  return (
    <QuestionContainer questionNumber={2}>
      <h1 className="question-title">
        Why does “{rawAnswer}” feel vegetabley?
      </h1>
      <p className="microcopy">Please choose up to 5 criteria.</p>

      <form className="question-form" onSubmit={handleSubmit}>
        <CriteriaSelector
          criteria={orderedCriteria}
          selectedIds={selectedIds}
          atLimit={atLimit}
          onToggle={handleToggle}
        />

        {otherSelected ? (
          <div className="other-field">
            <label htmlFor="custom-criterion">What else?</label>
            <textarea
              id="custom-criterion"
              value={customCriterion}
              onChange={(event) => setCustomCriterion(event.target.value)}
              rows={3}
              placeholder="Type your own reason..."
              required
            />
          </div>
        ) : null}

        <QuestionNav
          backMode="locked"
          onLockedBack={onLockedBack}
          continueDisabled={!canContinue}
          continueHint={selectedIds.length === 0 ? 'Select at least one' : undefined}
          continueHintId="continue-hint"
        />
      </form>
    </QuestionContainer>
  );
}
