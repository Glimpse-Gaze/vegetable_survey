import { Link } from 'react-router-dom';

export function Results() {
  return (
    <div className="home-shell">
      <section className="home-panel">
        <p className="eyebrow">Results</p>
        <h1 className="home-title">The standings</h1>
        <p className="home-lede">
          The campaign board will live here — vote totals, filters, and other
          cuts of the answers. Nothing to show yet.
        </p>
        <div className="home-actions">
          <Link className="home-button home-button-secondary" to="/">
            Back to the foyer
          </Link>
        </div>
      </section>
    </div>
  );
}
