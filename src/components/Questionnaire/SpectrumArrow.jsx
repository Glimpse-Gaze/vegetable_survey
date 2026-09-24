export function SpectrumArrow() {
  return (
    <div className="spectrum-arrow" aria-hidden="true">
      <svg className="spectrum-arrow-head" viewBox="0 0 24 18" fill="none">
        <path
          d="M12 2.5 21.5 15.5H2.5L12 2.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <div className="spectrum-arrow-shaft" />
      <svg className="spectrum-arrow-head" viewBox="0 0 24 18">
        <path d="M12 15.5 21.5 2.5H2.5L12 15.5Z" fill="currentColor" />
      </svg>
    </div>
  );
}
