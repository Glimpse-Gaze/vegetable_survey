export function QuestionNav({
  onBack,
  backMode = 'enabled',
  onLockedBack,
  backHint,
  backHintId,
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
      <div className="back-wrap">
        <button
          className={locked ? 'back-button is-disabled' : 'back-button'}
          type="button"
          aria-disabled={locked ? true : undefined}
          aria-describedby={backHint ? backHintId : undefined}
          onClick={handleBack}
        >
          Back
        </button>
        {backHint ? (
          <span className="back-hint" role="tooltip" id={backHintId}>
            {backHint}
          </span>
        ) : null}
      </div>
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
