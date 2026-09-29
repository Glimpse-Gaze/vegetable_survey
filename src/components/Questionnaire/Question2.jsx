import { useState } from 'react';
import { criteria, MAX_CUSTOM_CRITERION, shuffleCriteria } from '../../data/criteria.js';
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
  initialCustomPublic = false,
}) {
  const [orderedCriteria] = useState(() => shuffleCriteria(criteria));
  const [selectedIds, setSelectedIds] = useState(initialCriteria);
  const [customCriterion, setCustomCriterion] = useState(initialCustomCriterion);
  const [customPublic, setCustomPublic] = useState(initialCustomPublic);
  const otherSelected = selectedIds.includes('other');
  const customText = customCriterion.trim();
  const customReady = !otherSelected || customText.length > 0;
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

  function handleCustomChange(value) {
    setCustomCriterion(value.slice(0, MAX_CUSTOM_CRITERION));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;

    onContinue({
      initialCriteria: selectedIds,
      customCriterion: otherSelected ? customText : '',
      customCriterionPublic: otherSelected ? customPublic : false,
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
              onChange={(event) => handleCustomChange(event.target.value)}
              rows={3}
              maxLength={MAX_CUSTOM_CRITERION}
              placeholder="Type your own reason..."
              required
            />
            <p className="character-count">
              {customCriterion.length} / {MAX_CUSTOM_CRITERION}
            </p>
            <label className="public-consent">
              <input
                className="criterion-input"
                type="checkbox"
                checked={customPublic}
                onChange={(event) => setCustomPublic(event.target.checked)}
              />
              <span>I agree to display this answer publicly.</span>
            </label>
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
