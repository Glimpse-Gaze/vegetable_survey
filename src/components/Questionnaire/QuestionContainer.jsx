const TOTAL_QUESTIONS = 7;

export function QuestionContainer({ questionNumber, children }) {
  return (
    <section className="question-panel">
      {questionNumber ? (
        <p className="eyebrow">
          Question {questionNumber} out of {TOTAL_QUESTIONS}
        </p>
      ) : null}
      {children}
    </section>
  );
}
