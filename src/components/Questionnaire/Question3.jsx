import { useEffect, useState } from 'react';
import {
  bucketItems,
  emptyBuckets,
  placedBucketIds,
} from '../../data/bucketItems.js';
import { shuffleSpectrumVegetables } from '../../data/spectrumVegetables.js';
import { BucketBoard } from './BucketBoard.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

export function Question3({ onContinue, onBack, initialBuckets }) {
  const [paletteOrder] = useState(() =>
    shuffleSpectrumVegetables(bucketItems),
  );
  const [buckets, setBuckets] = useState(() =>
    initialBuckets?.not_vegetable ? initialBuckets : emptyBuckets(),
  );
  const [activeBucket, setActiveBucket] = useState(null);
  const placed = placedBucketIds(buckets);
  const palette = paletteOrder.filter((item) => !placed.includes(item.id));
  const canContinue = placed.length === bucketItems.length;

  useEffect(() => {
    function handlePointerDown(event) {
      if (event.target.closest('.bucket, .spectrum-tile')) return;
      setActiveBucket(null);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handlePlace(id, bucketId = activeBucket) {
    if (!bucketId) return;

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
      <h1 className="question-title">Which of these count as vegetables?</h1>
      <p className="microcopy">
        Sort each item into a bucket. Degree doesn’t matter yet — just no, yes,
        or somewhere in-between. Drag them, or click a bucket and then an item.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <BucketBoard
          palette={palette}
          buckets={buckets}
          activeBucket={activeBucket}
          onActivateBucket={setActiveBucket}
          onPlace={handlePlace}
          onReturnToPalette={handleReturnToPalette}
        />

        <QuestionNav
          onBack={onBack}
          continueDisabled={!canContinue}
          continueHint={!canContinue ? 'Sort every item' : undefined}
          continueHintId="bucket-hint"
        />
      </form>
    </QuestionContainer>
  );
}
