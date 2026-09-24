import { useState } from 'react';
import {
  emptySpectrumSlots,
  shuffleSpectrumVegetables,
  spectrumVegetables,
} from '../../data/spectrumVegetables.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';
import { SpectrumBoard } from './SpectrumBoard.jsx';

export function Question3({ onContinue, onBack, initialSpectrum }) {
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
    <QuestionContainer questionNumber={3}>
      <h1 className="question-title">How vegetabley is each of these?</h1>
      <p className="microcopy">
        Place each of these on the scale. Click a slot, then an item — or drag
        them around.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <SpectrumBoard
          palette={palette}
          slots={slots}
          activeSlot={activeSlot}
          onActivateSlot={handleActivateSlot}
          onPlace={handlePlace}
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
