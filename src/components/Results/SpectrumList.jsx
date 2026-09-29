import { SPECTRUM_METHOD } from '../../data/spectrumVegetables.js';

function formatMean(mean) {
  return mean.toFixed(1);
}

function Spread({ item }) {
  const maxShare = Math.max(...item.slotShares, 0.0001);
  const label = item.slotShares
    .map((share, index) => `${index + 1}: ${Math.round(share * 100)}%`)
    .join(', ');

  return (
    <div className="spectrum-spread">
      <div
        className="spectrum-spread-chart"
        role="img"
        aria-label={`Share of rankings by slot. ${label}. Average place ${formatMean(item.meanRank)}.`}
      >
        {item.slotShares.map((share, index) => {
          const slot = index + 1;
          return (
            <span
              key={slot}
              className={[
                'spectrum-spread-col',
                slot === item.userSlot ? 'is-yours' : '',
                slot === Math.round(item.meanRank) ? 'is-mean' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--share': share / maxShare }}
              title={`#${slot}: ${Math.round(share * 100)}%`}
            >
              <span className="spectrum-spread-bar" />
            </span>
          );
        })}
      </div>
      <div className="spectrum-spread-ends">
        {item.slotShares.map((_, index) => {
          const slot = index + 1;
          const isYours = slot === item.userSlot;
          const showLeast = slot === 1 && !isYours;
          const showMost = slot === 10 && !isYours;

          return (
            <span key={slot} className="spectrum-spread-end">
              {showLeast ? 'Least' : null}
              {isYours ? (
                <span className="spectrum-blade-badge">Your vote</span>
              ) : null}
              {showMost ? 'Most' : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SpectrumBlade({ item, bandId }) {
  const isLeastScore = item.rank === 1;

  return (
    <article
      className={[
        'spectrum-blade',
        `is-band-${bandId}`,
        isLeastScore ? 'is-least-score' : '',
        item.userSlot ? 'is-yours' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="spectrum-blade-art">
        <img src={item.art} alt="" />
      </div>
      <div className="spectrum-blade-copy">
        <div className="spectrum-blade-topline">
          <span className="spectrum-blade-rank">#{item.rank}</span>
          <h3 className="spectrum-blade-name">{item.name}</h3>
        </div>
        <Spread item={item} />
        <p className="spectrum-blade-fact">{item.fact}</p>
        {item.note ? <p className="spectrum-blade-note">{item.note}</p> : null}
      </div>
    </article>
  );
}

export function SpectrumList({ section }) {
  return (
    <div className="spectrum-results">
      <p className="spectrum-method">{SPECTRUM_METHOD}</p>

      {section.bands.map((band) => (
        <section key={band.id} className={`spectrum-band is-${band.id}`}>
          <h2 className="spectrum-band-title">{band.title}</h2>
          <div className="spectrum-band-list">
            {band.items.map((item) => (
              <SpectrumBlade key={item.id} item={item} bandId={band.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
