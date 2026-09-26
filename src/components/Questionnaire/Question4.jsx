import { useEffect, useState } from 'react';
import {
  emptySpectrumSlots,
  shuffleSpectrumVegetables,
  spectrumVegetables,
} from '../../data/spectrumVegetables.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';
import { SpectrumBoard } from './SpectrumBoard.jsx';

export function Question4({ onContinue, onBack, initialSpectrum }) {
  const [paletteOrder] = useState(() =>
    shuffleSpectrumVegetables(spectrumVegetables),
  );
  const [slots, setSlots] = useState(
    () => initialSpectrum ?? emptySpectrumSlots(),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const remaining = slots.filter((id) => id == null).length;
  const canContinue = remaining === 0;
  const palette = paletteOrder.filter((vegetable) => !slots.includes(vegetable.id));

  useEffect(() => {
    function handlePointerDown(event) {
      if (event.target.closest('.spectrum-slot, .spectrum-tile')) return;
      setActiveSlot(null);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handlePlace(id, slotIndex = activeSlot) {
    if (slotIndex == null || slotIndex < 0) return;

    setSlots((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(id);
      if (fromIndex === slotIndex) return current;

      const displaced = next[slotIndex];
      if (fromIndex !== -1) {
        next[fromIndex] = displaced;
        next[slotIndex] = id;
      } else {
        next[slotIndex] = id;
      }
      return next;
    });

    setActiveSlot((currentActive) => {
      if (slotIndex !== currentActive && slotIndex != null) {
        return slotIndex;
      }
      return currentActive;
    });
  }

  function handleMove(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= slots.length) return;

    setSlots((current) => {
      const next = [...current];
      if (!next[index]) return current;
      const displaced = next[target];
      next[target] = next[index];
      next[index] = displaced;
      return next;
    });
    setActiveSlot(target);
  }

  function handleReturnToPalette(id) {
    setSlots((current) => current.map((item) => (item === id ? null : item)));
  }

  function handleActivateSlot(index) {
    setActiveSlot(index);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canContinue) return;
    onContinue({ spectrum: slots });
  }

  return (
    <QuestionContainer questionNumber={4}>
      <h1 className="question-title">
        How vegetabley does each of these feel to you?
      </h1>
      <p className="microcopy">
        Degree matters now. Place each item from least vegetabley at the top to
        most at the bottom. Drag and drop, or click a slot and then an item.
        Use arrows to nudge a placed item up or down.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <SpectrumBoard
          palette={palette}
          slots={slots}
          activeSlot={activeSlot}
          onActivateSlot={handleActivateSlot}
          onPlace={handlePlace}
          onMove={handleMove}
          onReturnToPalette={handleReturnToPalette}
        />

        <QuestionNav
          onBack={onBack}
          continueDisabled={!canContinue}
          continueHint={!canContinue ? 'Place all ten items' : undefined}
          continueHintId="spectrum-hint"
        />
      </form>
    </QuestionContainer>
  );
}
