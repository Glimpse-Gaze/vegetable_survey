export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="confirm-layer">
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button
            className="home-button home-button-primary"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            className="home-button home-button-secondary"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
