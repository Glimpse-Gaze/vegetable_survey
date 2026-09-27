import { Link } from 'react-router-dom';

export function Home() {
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
          <Link className="home-button home-button-secondary" to="/results">
            See the results
          </Link>
        </div>
      </section>
    </div>
  );
}
