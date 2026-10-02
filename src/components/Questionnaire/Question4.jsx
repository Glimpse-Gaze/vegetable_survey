import { useEffect, useState } from 'react';
import {
  emptySpectrumSlots,
  shuffleSpectrumVegetables,
  spectrumVegetables,
} from '../../data/spectrumVegetables.js';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';
import { SpectrumBoard } from './SpectrumBoard.jsx';

function nextOpenSlot(slots, fromIndex) {
  for (let index = fromIndex + 1; index < slots.length; index += 1) {
    if (slots[index] == null) return index;
  }
  let closest = null;
  let best = Infinity;
  for (let index = 0; index < fromIndex; index += 1) {
    if (slots[index] != null) continue;
    const distance = fromIndex - index;
    if (distance < best) {
      best = distance;
      closest = index;
    }
  }
  return closest;
}

export function Question4({ onContinue, onBack, onDraft, initialSpectrum }) {
  const [paletteOrder] = useState(() =>
    shuffleSpectrumVegetables(spectrumVegetables),
  );
  const [slots, setSlots] = useState(
    () => initialSpectrum ?? emptySpectrumSlots(),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [armedId, setArmedId] = useState(null);
  const remaining = slots.filter((id) => id == null).length;
  const canContinue = remaining === 0;
  const palette = paletteOrder.filter((vegetable) => !slots.includes(vegetable.id));

  useEffect(() => {
    onDraft?.(slots);
  }, [slots, onDraft]);

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
        event.target.closest(
          '.spectrum-scale, .spectrum-pool, .spectrum-tile, .spectrum-rank-button',
        )
      ) {
        return;
      }
      setActiveSlot(null);
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

  function handlePlace(id, slotIndex = activeSlot) {
    if (slotIndex == null || slotIndex < 0) {
      setArmedId((current) => (current === id ? null : id));
      return;
    }
    if (slots[slotIndex] === id) return;

    const placed = slots.map((item, index) => {
      if (index === slotIndex) return id;
      if (item === id) return slots[slotIndex] ?? null;
      return item;
    });
    setSlots(placed);
    setArmedId(null);
    setActiveSlot(nextOpenSlot(placed, slotIndex));
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
    if (armedId) {
      handlePlace(armedId, index);
      return;
    }
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
        most at the bottom.{' '}
        <span className="copy-fine">
          Drag and drop, or click a slot and then an item. Use arrows to nudge a
          placed item up or down.
        </span>
        <span className="copy-coarse">
          Tap a rank, then an item — or tap an item, then a rank. Use the arrows
          to move it, or × to put it back.
        </span>
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
          armedId={armedId}
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
