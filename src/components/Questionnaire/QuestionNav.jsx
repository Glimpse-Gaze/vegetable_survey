export function QuestionNav({
  onBack,
  backMode = 'enabled',
  onLockedBack,
  continueDisabled = false,
  continueHint,
  continueHintId,
}) {
  const locked = backMode !== 'enabled';

  function handleBack() {
    if (backMode === 'locked') {
      onLockedBack?.();
      return;
    }
    if (backMode === 'enabled') {
      onBack?.();
    }
  }

  return (
    <div className="question-nav">
      <button
        className={locked ? 'back-button is-disabled' : 'back-button'}
        type="button"
        aria-disabled={locked ? true : undefined}
        onClick={handleBack}
      >
        Back
      </button>
      <div className="continue-wrap">
        <button
          className="continue-button"
          type="submit"
          disabled={continueDisabled}
          aria-describedby={
            continueDisabled && continueHint ? continueHintId : undefined
          }
        >
          Continue
        </button>
        {continueDisabled && continueHint ? (
          <span className="continue-hint" role="tooltip" id={continueHintId}>
            {continueHint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
