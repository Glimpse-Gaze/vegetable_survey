import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

export function Home() {
  const navigate = useNavigate();
  const [askResults, setAskResults] = useState(false);

  return (
    <div className="home-shell">
      <section className="home-panel">
        <p className="eyebrow">A folk-concept study</p>
        <h1 className="home-title">The Great Vegetable Survey</h1>
        <p className="home-lede">
          What do people count as a vegetable? Take the questionnaire, or skip
          ahead to the standings.
        </p>
        <div className="home-actions">
          <Link className="home-button home-button-primary" to="/survey">
            Take the survey
          </Link>
          <button
            className="home-button home-button-secondary"
            type="button"
            onClick={() => setAskResults(true)}
          >
            See the results
          </button>
        </div>
      </section>
      {askResults ? (
        <ConfirmDialog
          title="Before you skip ahead"
          message="Please note: it's recommended to complete the survey before displaying the results."
          onConfirm={() => navigate('/results')}
          onCancel={() => setAskResults(false)}
        />
      ) : null}
    </div>
  );
}
