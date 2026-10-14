import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import {
  emptyBuckets,
  isCompleteBuckets,
  placedBucketIds,
} from '../../data/bucketItems.js';
import { shuffleSpectrumVegetables } from '../../data/spectrumVegetables.js';
import { BucketBoard } from './BucketBoard.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function Question3({ onContinue, onBack, initialBuckets }) {
  const { t } = useI18n();
  const { bucketItems } = useSurveyCatalog();
  const [paletteOrder] = useState(() =>
    shuffleSpectrumVegetables(bucketItems),
  );
  const [buckets, setBuckets] = useState(() =>
    initialBuckets?.not_vegetable ? initialBuckets : emptyBuckets(),
  );
  const [activeBucket, setActiveBucket] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const placed = placedBucketIds(buckets);
  const palette = paletteOrder.filter((item) => !placed.includes(item.id));
  const canContinue = isCompleteBuckets(buckets);

  useEffect(() => {
    let origin = null;
    let dragged = false;

    function rememberMove(event) {
      if (!origin || origin.pointerId !== event.pointerId) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (dx * dx + dy * dy > 16) dragged = true;
    }

    function onPointerDown(event) {
      origin = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        scrollY: window.scrollY,
      };
      dragged = false;
    }

    function onScroll() {
      if (!origin) return;
      if (Math.abs(window.scrollY - origin.scrollY) > 2) dragged = true;
    }

    function onPointerUp(event) {
      if (!origin || origin.pointerId !== event.pointerId) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      const scrolled = Math.abs(window.scrollY - origin.scrollY) > 2;
      const wasDrag = dragged || scrolled || dx * dx + dy * dy > 16;
      origin = null;
      dragged = false;
      if (wasDrag) return;
      if (
        event.target instanceof Element &&
        event.target.closest('.bucket, .spectrum-tile, .spectrum-palette')
      ) {
        return;
      }
      setActiveBucket(null);
      setArmedId(null);
    }

    function onPointerCancel() {
      origin = null;
      dragged = false;
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', rememberMove);
    document.addEventListener('touchmove', rememberMove, { passive: true });
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', rememberMove);
      document.removeEventListener('touchmove', rememberMove);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
    };
  }, []);

  function handlePlace(id, bucketId = activeBucket) {
    if (!bucketId) {
      setArmedId((current) => (current === id ? null : id));
      return;
    }

    setBuckets((current) => {
      const next = {
        not_vegetable: current.not_vegetable.filter((item) => item !== id),
        in_between: current.in_between.filter((item) => item !== id),
        definitely_vegetable: current.definitely_vegetable.filter(
          (item) => item !== id,
        ),
      };
      next[bucketId] = [...next[bucketId], id];
      return next;
    });
    setActiveBucket(bucketId);
    setArmedId(null);
  }

  function handleReturnToPalette(id) {
    setBuckets((current) => ({
      not_vegetable: current.not_vegetable.filter((item) => item !== id),
      in_between: current.in_between.filter((item) => item !== id),
      definitely_vegetable: current.definitely_vegetable.filter(
        (item) => item !== id,
      ),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;
    onContinue({ sortBuckets: buckets });
  }

  return (
    <QuestionContainer questionNumber={3}>
      <h1 className="question-title">{t('q3.title')}</h1>
      <p className="microcopy">
        {t('q3.lead')}{' '}
        <span className="copy-fine">{t('q3.fine')}</span>
        <span className="copy-coarse">{t('q3.coarse')}</span>
      </p>

      <form className="question-form is-no-select" onSubmit={handleSubmit}>
        <BucketBoard
          palette={palette}
          buckets={buckets}
          activeBucket={activeBucket}
          armedId={armedId}
          onActivateBucket={(bucketId) => {
            if (armedId) {
              handlePlace(armedId, bucketId);
              return;
            }
            setActiveBucket(bucketId);
          }}
          onPlace={handlePlace}
          onReturnToPalette={handleReturnToPalette}
        />

        <QuestionNav
          onBack={onBack}
          continueDisabled={!canContinue}
          continueHint={!canContinue ? t('q3.continueHint') : undefined}
          continueHintId="bucket-hint"
        />
      </form>
    </QuestionContainer>
  );
}
