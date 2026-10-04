import { useRef, useState } from 'react';
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

function PaletteTile({ vegetable, armed, onPlace, onDragStart, onHoldStart }) {
  return (
    <button
      type="button"
      className={armed ? 'spectrum-tile is-armed' : 'spectrum-tile'}
      draggable="true"
      onClick={(event) => {
        event.stopPropagation();
        onPlace(vegetable.id);
      }}
      onDragStart={(event) => onDragStart(event, vegetable.id)}
      onPointerDown={(event) => onHoldStart(event, vegetable)}
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
  armedId = null,
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

  const session = useRef(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState(null);

  function unlisten(current) {
    if (!current?.onMove) return;
    window.removeEventListener('pointermove', current.onMove);
    window.removeEventListener('pointerup', current.onUp);
    window.removeEventListener('pointercancel', current.onUp);
    window.removeEventListener('touchmove', current.onTouchMove);
    window.removeEventListener('touchend', current.onTouchEnd);
    window.removeEventListener('touchcancel', current.onTouchEnd);
  }

  function findTouchDrop(x, y) {
    for (const node of document.elementsFromPoint(x, y)) {
      if (!(node instanceof Element)) continue;
      if (node.closest('.touch-drag-ghost')) continue;
      const slot = node.closest('.spectrum-slot');
      if (slot?.dataset.index != null) return { index: Number(slot.dataset.index) };
      if (node.closest('.spectrum-palette')) return { palette: true };
    }
    return null;
  }

  function onHoldStart(event, vegetable) {
    if (event.pointerType === 'mouse') return;
    if (event.button != null && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('.spectrum-rank-button')) {
      return;
    }
    const previous = session.current;
    if (previous) {
      window.clearTimeout(previous.timer);
      unlisten(previous);
    }
    const box = event.currentTarget.getBoundingClientRect();
    const next = {
      id: vegetable.id,
      name: vegetable.name,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      width: Math.max(box.width, 96),
      height: Math.max(box.height, 44),
      armed: false,
      timer: 0,
    };
    next.timer = window.setTimeout(() => {
      if (session.current !== next) return;
      next.armed = true;
      suppressClick.current = true;
      setDragId(next.id);
      setGhost({
        x: next.lastX,
        y: next.lastY,
        name: next.name,
        width: next.width,
        height: next.height,
      });
    }, 300);
    next.onMove = (moveEvent) => {
      if (session.current !== next || next.pointerId !== moveEvent.pointerId) return;
      next.lastX = moveEvent.clientX;
      next.lastY = moveEvent.clientY;
      const dx = moveEvent.clientX - next.x;
      const dy = moveEvent.clientY - next.y;
      if (!next.armed) {
        if (dx * dx + dy * dy > 144) {
          window.clearTimeout(next.timer);
          unlisten(next);
          session.current = null;
        }
        return;
      }
      setGhost({
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        name: next.name,
        width: next.width,
        height: next.height,
      });
      const hit = findTouchDrop(moveEvent.clientX, moveEvent.clientY);
      setOverIndex(hit?.index ?? null);
      setOverPalette(Boolean(hit?.palette));
    };
    next.onUp = (endEvent) => {
      if (session.current !== next || next.pointerId !== endEvent.pointerId) return;
      window.clearTimeout(next.timer);
      unlisten(next);
      const armed = next.armed;
      session.current = null;
      if (!armed || endEvent.type === 'pointercancel') {
        setGhost(null);
        setDragId(null);
        setOverIndex(null);
        setOverPalette(false);
        return;
      }
      const hit = findTouchDrop(endEvent.clientX, endEvent.clientY);
      if (hit?.index != null) onPlace(next.id, hit.index);
      else if (hit?.palette) onReturnToPalette(next.id);
      setGhost(null);
      setDragId(null);
      setOverIndex(null);
      setOverPalette(false);
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 400);
    };
    next.onTouchMove = (touchEvent) => {
      const touch = touchEvent.touches[0];
      if (!touch) return;
      next.onMove({
        pointerId: next.pointerId,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      if (session.current?.armed) touchEvent.preventDefault();
    };
    next.onTouchEnd = (touchEvent) => {
      const touch = touchEvent.changedTouches[0];
      next.onUp({
        type: touchEvent.type === 'touchcancel' ? 'pointercancel' : 'pointerup',
        pointerId: next.pointerId,
        clientX: touch?.clientX ?? next.lastX,
        clientY: touch?.clientY ?? next.lastY,
      });
    };
    if (event.pointerType === 'touch') {
      window.addEventListener('touchmove', next.onTouchMove, { passive: false });
      window.addEventListener('touchend', next.onTouchEnd);
      window.addEventListener('touchcancel', next.onTouchEnd);
    } else {
      window.addEventListener('pointermove', next.onMove);
      window.addEventListener('pointerup', next.onUp);
      window.addEventListener('pointercancel', next.onUp);
    }
    session.current = next;
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
                  data-index={index}
                  draggable={Boolean(vegetable)}
                  onPointerDown={
                    vegetable
                      ? (event) => {
                          if (event.target.closest('.spectrum-grip')) {
                            onHoldStart(event, vegetable);
                          }
                        }
                      : undefined
                  }
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
                          <span aria-hidden="true">
                            <svg viewBox="0 0 16 16">
                              <path
                                d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
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
              armed={armedId === vegetable.id}
              onPlace={(id) => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onPlace(id, activeSlot);
              }}
              onDragStart={handleDragStart}
              onHoldStart={onHoldStart}
            />
          ))}
        </div>
      </div>
      {ghost ? (
        <div
          className="touch-drag-ghost spectrum-tile"
          style={{
            left: ghost.x,
            top: ghost.y,
            width: ghost.width,
            height: ghost.height,
          }}
        >
          <span className="spectrum-tile-label">{ghost.name}</span>
        </div>
      ) : null}
    </div>
  );
}
