import { getSpectrumVegetable } from '../../data/spectrumVegetables.js';
import { SpectrumArrow } from './SpectrumArrow.jsx';

function Tile({ vegetable, onPlace, onDragStart }) {
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
  onReturnToPalette,
}) {
  function handleDragStart(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleSlotDrop(event, index) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (id) onPlace(id, index);
  }

  function handlePaletteDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (id) onReturnToPalette(id);
  }

  return (
    <div className="spectrum">
      <div className="spectrum-scale">
        <p className="spectrum-end-label">Least vegetabley</p>
        <div className="spectrum-track-row">
          <SpectrumArrow />
          <div className="spectrum-track" role="list">
          {slots.map((id, index) => {
            const vegetable = id ? getSpectrumVegetable(id) : null;
            const active = index === activeSlot;
            return (
              <div
                key={index}
                role="listitem"
                className={
                  active
                    ? 'spectrum-slot is-active'
                    : vegetable
                      ? 'spectrum-slot is-filled'
                      : 'spectrum-slot'
                }
                onClick={() => onActivateSlot(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleSlotDrop(event, index)}
              >
                <span className="spectrum-slot-index">{index + 1}</span>
                {vegetable ? (
                  <Tile
                    vegetable={vegetable}
                    onPlace={() => onPlace(vegetable.id, activeSlot)}
                    onDragStart={handleDragStart}
                  />
                ) : (
                  <span className="spectrum-tile is-empty" aria-hidden="true" />
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
          className="spectrum-palette"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handlePaletteDrop}
        >
          {palette.map((vegetable) => (
            <Tile
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
