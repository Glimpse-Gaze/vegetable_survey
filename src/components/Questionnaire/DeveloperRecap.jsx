import { QuestionContainer } from './QuestionContainer.jsx';

export function DeveloperRecap({ response, onReset }) {
  return (
    <QuestionContainer>
      <p className="eyebrow">Developer only</p>
      <h1 className="question-title">Response recap</h1>
      <p className="microcopy">
        This screen is not user-facing. Reset to try another first instinct.
      </p>

      <pre className="recap-json">{JSON.stringify(response, null, 2)}</pre>

      <button className="continue-button" type="button" onClick={onReset}>
        Start over
      </button>
    </QuestionContainer>
  );
}
