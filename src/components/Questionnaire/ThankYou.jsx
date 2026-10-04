import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuestionContainer } from './QuestionContainer.jsx';
import { submitDeveloperMessage } from '../../utils/submitResponse.js';

const MAX_DEV_MESSAGE = 1000;

export function ThankYou({ responseId }) {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const resultsTo = responseId
    ? `/results?code=${encodeURIComponent(responseId)}`
    : '/results';

  async function copyCode() {
    if (!responseId) return;
    try {
      await navigator.clipboard.writeText(responseId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  async function sendNote(event) {
    event.preventDefault();
    if (!responseId || sending || sent) return;
    const trimmed = note.trim();
    if (!trimmed) return;

    setSending(true);
    setError('');
    const result = await submitDeveloperMessage(responseId, trimmed);
    setSending(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not send the note.');
      return;
    }
    setSent(true);
  }

  return (
    <QuestionContainer>
      <h1 className="question-title">That’s all — thank you.</h1>

      <section className="thanks-block thanks-results-block">
        <h2 className="thanks-block-title">Interactive results</h2>
        <p className="microcopy">
          On the results pages you can see where your answers sit, and rate
          other people’s comments. The board is more fun after you have a code.
        </p>
        <div className="thanks-results-wrap">
          <Link className="continue-button thanks-results-button" to={resultsTo}>
            See the results
          </Link>
        </div>
      </section>

      {responseId ? (
        <section className="thanks-block thanks-code-block">
          <h2 className="thanks-block-title">Your ranking code</h2>
          <p className="microcopy">
            Keep this code if you want to reopen your rankings later, or send it
            to someone so they can see how you voted.
          </p>
          <p className="thanks-code-row">
            <code className="response-code">{responseId}</code>
            <button
              className={
                copied
                  ? 'response-code-copy is-copied'
                  : 'response-code-copy'
              }
              type="button"
              onClick={copyCode}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </p>
        </section>
      ) : null}

      {responseId ? (
        <section className="thanks-block thanks-comments-block">
          <h2 className="thanks-block-title">Do you have any comments?</h2>
          <p className="microcopy">
            Optional note for the developer. Just for user feedback, it won’t be
            shown publicly and won’t be used in the research.
          </p>
          {sent ? (
            <p className="microcopy">Sent. Thank you.</p>
          ) : (
            <form className="thanks-note-form" onSubmit={sendNote}>
              <label className="sr-only" htmlFor="developer-note">
                Comments for the developer
              </label>
              <textarea
                id="developer-note"
                className="open-description"
                rows={5}
                maxLength={MAX_DEV_MESSAGE}
                value={note}
                onChange={(event) =>
                  setNote(event.target.value.slice(0, MAX_DEV_MESSAGE))
                }
                placeholder="A bug, a thought, a vegetable grievance…"
              />
              <p className="character-count">
                {note.length.toLocaleString()} / {MAX_DEV_MESSAGE.toLocaleString()}
              </p>
              {error ? <p className="thanks-note-error">{error}</p> : null}
              <button
                className="continue-button"
                type="submit"
                disabled={sending || !note.trim()}
              >
                {sending ? 'Sending…' : 'Send note'}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </QuestionContainer>
  );
}
