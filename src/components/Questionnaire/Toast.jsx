export function Toast({ message, visible }) {
  return (
    <div
      className={visible ? 'toast is-visible' : 'toast'}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {message}
    </div>
  );
}
