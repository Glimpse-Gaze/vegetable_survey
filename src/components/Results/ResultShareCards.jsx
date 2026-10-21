import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import { buildResultCards } from '../../utils/resultCards.js';
import { paintResultCard } from '../../utils/paintResultCard.js';
import brandMark from '../../assets/Glimpse_general.png';
import '../../styles/results.css';

const SITE_HOST = 'vegetable.glimpsegaze.com';

const TINTS = [
  { id: 'green', color: '#2c6f3a' },
  { id: 'carrot', color: '#d1790d' },
  { id: 'tomato', color: '#cf4024' },
  { id: 'cabbage', color: '#912062' },
  { id: 'beige', color: '#f3eee3' },
];

function copyFor(card, t) {
  const shared = { survey: t('home.title'), url: SITE_HOST };
  if (card.layout === 'between') {
    return {
      ...shared,
      before: t('cards.betweenBefore'),
      after: card.tone === 'not' ? t('cards.notAfter') : t('cards.betweenAfter'),
      cta: t('cards.betweenCta'),
    };
  }
  if (card.layout === 'spectrum') {
    return {
      ...shared,
      middle: card.sense === 'less' ? t('cards.spectrumLessMiddle') : t('cards.spectrumMiddle'),
      after: card.sense === 'less' ? t('cards.spectrumLessAfter') : t('cards.spectrumAfter'),
      cta: t('cards.spectrumCta'),
    };
  }
  return {
    ...shared,
    before: card.tone === 'most' ? t('cards.mostBefore') : t('cards.instinctBefore'),
    cta: t('cards.instinctCta'),
  };
}

function captionFor(card, copy) {
  let line;
  if (card.layout === 'between') {
    line = `${copy.before} ${card.name} ${copy.after}`;
  } else if (card.layout === 'spectrum') {
    line = [card.top, copy.middle, card.bottom, copy.after].filter(Boolean).join(' ');
  } else {
    line = `${copy.before} ${card.name}`;
  }
  return copy.cta ? `${line} ${copy.cta}` : line;
}

function cardHasPhoto(card) {
  if (card.layout === 'spectrum') return Boolean(card.topArt || card.bottomArt);
  return Boolean(card.art);
}

function cardClass(card, treatment, tint) {
  const parts = ['result-card', `is-${card.layout}`];
  const photo = cardHasPhoto(card);
  const solidTint = tint && (treatment === 'solid' || (treatment === 'wash' && !photo));
  if (solidTint) parts.push('is-tint', `is-tint-${tint}`);
  else if (photo) parts.push('has-art');
  if (treatment === 'wash' && tint && photo) parts.push('is-wash', `is-wash-${tint}`);
  return parts.join(' ');
}

function CardFace({ card, copy, treatment, tint }) {
  const showPhoto = treatment !== 'solid';
  const masthead = <BrandBlock />;
  const foot = (
    <div className="result-card-foot">
      <p className="result-card-cta">{copy.cta}</p>
    </div>
  );

  if (card.layout === 'spectrum') {
    return (
      <article className={cardClass(card, treatment, tint)}>
        {showPhoto ? (
          <div className="result-card-split" aria-hidden="true">
            <div className="result-card-half">
              {card.topArt ? <img src={card.topArt} alt="" /> : <span />}
            </div>
            <div className="result-card-half">
              {card.bottomArt ? <img src={card.bottomArt} alt="" /> : <span />}
            </div>
          </div>
        ) : null}
        {showPhoto && treatment === 'wash' ? <span className="result-card-wash" aria-hidden="true" /> : null}
        {showPhoto ? <span className="result-card-shade" aria-hidden="true" /> : null}
        <div className="result-card-body">
          {masthead}
          <p className="result-card-name is-top">{card.top}</p>
          <p className="result-card-seam">
            {copy.middle ? <span>{copy.middle}</span> : null}
            {copy.after ? <span>{copy.after}</span> : null}
          </p>
          <p className="result-card-name is-bottom">{card.bottom}</p>
          {foot}
        </div>
        <CornerMark />
      </article>
    );
  }

  if (card.layout === 'between') {
    return (
      <article className={cardClass(card, treatment, tint)}>
        {showPhoto && card.art ? <img className="result-card-photo" src={card.art} alt="" /> : null}
        {showPhoto && card.art && treatment === 'wash' ? <span className="result-card-wash" aria-hidden="true" /> : null}
        {showPhoto && card.art ? <span className="result-card-shade" aria-hidden="true" /> : null}
        <div className="result-card-body">
          {masthead}
          <div className="result-card-copy">
            <p className="result-card-kicker">{copy.before}</p>
            <p className="result-card-name">{card.name}</p>
            <p className="result-card-kicker">{copy.after}</p>
          </div>
          {foot}
        </div>
        <CornerMark />
      </article>
    );
  }

  return (
    <article className={cardClass(card, treatment, tint)}>
      {showPhoto && card.art ? <img className="result-card-photo" src={card.art} alt="" /> : null}
      {showPhoto && card.art && treatment === 'wash' ? <span className="result-card-wash" aria-hidden="true" /> : null}
      {showPhoto && card.art ? <span className="result-card-shade" aria-hidden="true" /> : null}
      <div className="result-card-body">
        {masthead}
        <div className="result-card-copy">
          <div className="result-card-hero">
            <p className="result-card-kicker">{copy.before}</p>
            <p className="result-card-name">{card.name}</p>
          </div>
        </div>
        {foot}
      </div>
      <CornerMark />
    </article>
  );
}

function CornerMark() {
  return <img className="result-card-logo" src={brandMark} alt="" width={26} height={26} />;
}

function BrandBlock() {
  const { t } = useI18n();
  const title = t('home.title');
  const titleRef = useRef(null);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return undefined;
    const fit = () => {
      const box = el.parentElement;
      const maxWidth = box?.clientWidth || 0;
      if (!maxWidth) return;
      el.style.width = 'max-content';
      let size = 32;
      el.style.fontSize = `${size}px`;
      while (size > 8 && el.scrollWidth > maxWidth + 0.5) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const box = el.parentElement;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [title]);

  return (
    <div className="result-card-brand">
      <p ref={titleRef} className="result-card-survey">{title}</p>
      <p className="result-card-url">{SITE_HOST}</p>
    </div>
  );
}

function CardDraft({ card, treatment = null, tint = null }) {
  const { t } = useI18n();
  const copy = copyFor(card, t);
  const [busy, setBusy] = useState(false);
  const painted = treatment ? { ...card, treatment, tint } : card;

  async function blobFor() {
    return paintResultCard(painted, copy, brandMark);
  }

  async function save() {
    setBusy(true);
    try {
      const blob = await blobFor();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const suffix = treatment === 'wash' ? `-wash-${tint}` : treatment === 'solid' ? `-${tint}` : '';
      link.download = `vegetable-survey-${card.id}${suffix}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    try {
      const blob = await blobFor();
      if (!blob) return;
      const file = new File([blob], `vegetable-survey-${card.id}.png`, { type: 'image/png' });
      const text = captionFor(card, copy);
      const payload = { files: [file], text, title: text };
      if (navigator.canShare?.(payload)) {
        await navigator.share(payload);
        return;
      }
      await save();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      await save();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="result-card-wrap">
      <CardFace card={card} copy={copy} treatment={treatment} tint={tint} />
      <div className="result-card-actions">
        <button type="button" onClick={save} disabled={busy}>{t('cards.save')}</button>
        <button type="button" onClick={share} disabled={busy}>{t('share.label')}</button>
      </div>
    </div>
  );
}

function CardGallery({ cards, onClose }) {
  const { t } = useI18n();
  const [solid, setSolid] = useState(null);
  const [wash, setWash] = useState(false);
  const [washColor, setWashColor] = useState('green');
  const activeTint = wash ? washColor : solid;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="result-cards-layer" onClick={onClose}>
      <div
        className="result-cards-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-cards-more-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="result-cards-dialog-head">
          <h2 id="result-cards-more-title">{t('cards.more')}</h2>
          <button type="button" className="result-cards-close" onClick={onClose}>
            {t('cards.close')}
          </button>
        </div>
        <div className="result-card-tints" role="group" aria-label={t('cards.more')}>
          <label className="result-card-tint-check">
            <input
              type="checkbox"
              checked={wash}
              onChange={(event) => {
                const next = event.target.checked;
                setWash(next);
                if (next) {
                  setSolid(null);
                  setWashColor('green');
                }
              }}
            />
            {t('cards.tintLabel')}
          </label>
          <button
            type="button"
            className={solid ? 'result-card-tint' : 'result-card-tint is-selected'}
            aria-pressed={!solid}
            onClick={() => setSolid(null)}
          >
            {t('cards.photo')}
          </button>
          {TINTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTint === item.id ? 'result-card-swatch is-selected' : 'result-card-swatch'}
              style={{ background: item.color }}
              aria-label={t(`cards.tint.${item.id}`)}
              aria-pressed={activeTint === item.id}
              onClick={() => {
                if (wash) setWashColor(item.id);
                else setSolid(item.id);
              }}
            />
          ))}
        </div>
        <div className="result-cards-gallery">
          {cards.map((card) => (
            <CardDraft
              key={`${card.id}-${wash ? 'wash' : 'solid'}-${activeTint || 'photo'}`}
              card={card}
              treatment={wash ? 'wash' : solid ? 'solid' : null}
              tint={activeTint}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResultShareCards({ answers }) {
  const { t } = useI18n();
  const catalog = useSurveyCatalog();
  const { featured, gallery } = useMemo(
    () => buildResultCards(answers, catalog),
    [answers, catalog],
  );
  const [open, setOpen] = useState(false);
  const closeGallery = useCallback(() => setOpen(false), []);
  if (!featured.length && !gallery.length) return null;

  return (
    <section className="result-cards" aria-label={t('cards.title')}>
      <h2 className="result-cards-title">{t('cards.title')}</h2>
      <p className="result-cards-lead">{t('cards.lead')}</p>
      <div className="result-cards-stage">
        <div className="result-cards-row">
          {featured.map((card) => <CardDraft key={card.id} card={card} />)}
        </div>
        <button type="button" className="result-cards-more" onClick={() => setOpen(true)}>
          {t('cards.more')}
        </button>
      </div>
      {open ? <CardGallery cards={gallery} onClose={closeGallery} /> : null}
    </section>
  );
}
