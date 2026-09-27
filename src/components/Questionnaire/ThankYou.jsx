import { QuestionContainer } from './QuestionContainer.jsx';

export function ThankYou() {
  return (
    <QuestionContainer>
      <h1 className="question-title">That’s all — thank you.</h1>
      <p className="microcopy">
        Your answers are stored for this research. We didn’t take your name or
        email. If you agreed to show your written definition publicly, it may
        appear later on a results page; otherwise it stays in the research set
        only.
      </p>
      <p className="microcopy">You can close this tab.</p>
    </QuestionContainer>
  );
}
