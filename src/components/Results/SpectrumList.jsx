import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { placeNotePop } from '../../utils/placeNotePop.js';

function formatMean(mean) {
  return mean.toFixed(1);
}

function Spread({ item }) {
  const { t } = useI18n();
  const maxShare = Math.max(...item.slotShares, 0.0001);
  const label = item.slotShares
    .map((share, index) => `${index + 1}: ${Math.round(share * 100)}%`)
    .join(', ');

  return (
    <div className="spectrum-spread">
      <div
        className="spectrum-spread-chart"
        role="img"
        aria-label={t('results.spectrum.shareBySlot', {
          label,
          mean: formatMean(item.meanRank),
        })}
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
              {slot === item.userSlot ? (
                <span className="spectrum-blade-badge">{t('results.yourVote')}</span>
              ) : null}
            </span>
          );
        })}
      </div>
      <div className="spectrum-spread-ends">
        {item.slotShares.map((_, index) => {
          const slot = index + 1;

          return (
            <span key={slot} className="spectrum-spread-end">
              {slot === 1 ? t('results.spectrum.least') : null}
              {slot === 10 ? t('results.spectrum.most') : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FactNote({ name, fact }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function reposition() {
      placeNotePop(rootRef.current, popRef.current);
    }

    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, fact]);

  return (
    <div className="question-note is-beside" ref={rootRef}>
      <button
        className="question-note-button"
        type="button"
        aria-expanded={open}
        aria-label={t('results.spectrum.about', { name })}
        onClick={() => setOpen((value) => !value)}
      >
        i
      </button>
      {open ? (
        <p
          ref={popRef}
          className="question-note-pop"
          role="dialog"
          aria-label={t('results.spectrum.about', { name })}
        >
          {fact}
        </p>
      ) : null}
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
        <img
          src={item.art}
          alt=""
          width={390}
          height={390}
          decoding="async"
          loading={item.rank <= 3 ? 'eager' : 'lazy'}
          fetchPriority={item.rank <= 2 ? 'high' : 'auto'}
          sizes="(max-width: 720px) 42vw, 12.2rem"
        />
      </div>
      <div className="spectrum-blade-copy">
        <div className="spectrum-blade-topline">
          <span className="spectrum-blade-rank">#{item.rank}</span>
          <h3 className="spectrum-blade-name">{item.name}</h3>
          {item.fact ? <FactNote name={item.name} fact={item.fact} /> : null}
        </div>
        <Spread item={item} />
        {item.note ? <p className="spectrum-blade-note">{item.note}</p> : null}
      </div>
    </article>
  );
}

export function SpectrumList({ section }) {
  return (
    <div className="spectrum-results">
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
