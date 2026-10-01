import { useState } from 'react';
import { getSpectrumVegetable } from '../../data/spectrumVegetables.js';
import { SpectrumArrow } from './SpectrumArrow.jsx';

// Kept in code; hide until the scale arrow earns its place again.
const SHOW_SPECTRUM_ARROW = false;

function GripIcon() {
  return (
    <svg className="spectrum-grip-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 10 8 6l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6 8 10l4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaletteTile({ vegetable, onPlace, onDragStart }) {
  return (
    <button
      type="button"
      className="spectrum-tile"
      draggable="true"
      onClick={(event) => {
        event.stopPropagation();
        onPlace(vegetable.id);
      }}
      onDragStart={(event) => onDragStart(event, vegetable.id)}
    >
      <span className="spectrum-tile-label">{vegetable.name}</span>
    </button>
  );
}

export function SpectrumBoard({
  palette,
  slots,
  activeSlot,
  onActivateSlot,
  onPlace,
  onMove,
  onReturnToPalette,
}) {
  const [dragId, setDragId] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [overPalette, setOverPalette] = useState(false);

  function handleDragStart(event, id) {
    if (event.target.closest('.spectrum-rank-button')) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  }

  function handleSlotDragOver(event, index) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
    if (overPalette) setOverPalette(false);
  }

  function handleSlotDrop(event, index) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || dragId;
    if (id) onPlace(id, index);
    setDragId(null);
    setOverIndex(null);
    setOverPalette(false);
  }

  function handlePaletteDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (!overPalette) setOverPalette(true);
    if (overIndex !== null) setOverIndex(null);
  }

  function handlePaletteDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || dragId;
    if (id) onReturnToPalette(id);
    setDragId(null);
    setOverIndex(null);
    setOverPalette(false);
  }

  function handleDragEnd() {
    setDragId(null);
    setOverIndex(null);
    setOverPalette(false);
  }

  return (
    <div className="spectrum">
      <div className="spectrum-scale">
        <p className="spectrum-end-label">Least vegetabley</p>
        <div className="spectrum-track-row">
          {SHOW_SPECTRUM_ARROW ? <SpectrumArrow /> : null}
          <ol className="spectrum-index-col" aria-hidden="true">
            {slots.map((_, index) => (
              <li key={index} className="spectrum-slot-index">
                {index + 1}
              </li>
            ))}
          </ol>
          <div className="spectrum-track" role="list">
            {slots.map((id, index) => {
              const vegetable = id ? getSpectrumVegetable(id) : null;
              const active = index === activeSlot;
              const className = [
                'spectrum-slot',
                active ? 'is-active' : '',
                vegetable ? 'is-filled' : '',
                dragId && dragId === id ? 'is-dragging' : '',
                overIndex === index && dragId !== id ? 'is-over' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={index}
                  role="listitem"
                  className={className}
                  draggable={Boolean(vegetable)}
                  onClick={() => onActivateSlot(index)}
                  onDragStart={
                    vegetable
                      ? (event) => handleDragStart(event, vegetable.id)
                      : undefined
                  }
                  onDragOver={(event) => handleSlotDragOver(event, index)}
                  onDrop={(event) => handleSlotDrop(event, index)}
                  onDragEnd={handleDragEnd}
                >
                  {vegetable ? (
                    <>
                      <span className="spectrum-grip" aria-hidden="true">
                        <GripIcon />
                      </span>
                      <span className="spectrum-rank-label">{vegetable.name}</span>
                      <div className="spectrum-rank-controls">
                        <button
                          type="button"
                          className="spectrum-rank-button"
                          disabled={index === 0}
                          aria-label={`Move ${vegetable.name} up`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMove(index, -1);
                          }}
                        >
                          <ChevronUpIcon />
                        </button>
                        <button
                          type="button"
                          className="spectrum-rank-button"
                          disabled={index === slots.length - 1}
                          aria-label={`Move ${vegetable.name} down`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMove(index, 1);
                          }}
                        >
                          <ChevronDownIcon />
                        </button>
                        <button
                          type="button"
                          className="spectrum-rank-button is-remove"
                          aria-label={`Return ${vegetable.name} to the list`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onReturnToPalette(vegetable.id);
                          }}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="spectrum-slot-empty" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <p className="spectrum-end-label">Most vegetabley</p>
      </div>

      <div className="spectrum-pool">
        <p className="spectrum-palette-label">Items to place</p>
        <div
          className={overPalette ? 'spectrum-palette is-over' : 'spectrum-palette'}
          onDragOver={handlePaletteDragOver}
          onDrop={handlePaletteDrop}
        >
          {palette.map((vegetable) => (
            <PaletteTile
              key={vegetable.id}
              vegetable={vegetable}
              onPlace={() => onPlace(vegetable.id, activeSlot)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
