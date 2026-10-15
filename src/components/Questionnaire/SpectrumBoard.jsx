import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import {
  HOLD_MS,
  HOLD_SLOP,
  attachHoldTracking,
  buzzArmed,
  detachHoldTracking,
  isTouchLikePointer,
  movementExceeded,
  shouldTrackWithTouch,
  supportsNativeDrag,
} from '../../utils/touchHoldDrag.js';
import { MarqueeLabel } from './MarqueeLabel.jsx';
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

function PaletteTile({
  vegetable,
  armed,
  pressed,
  dragging,
  detached,
  onPlace,
  onDragStart,
  onHoldStart,
}) {
  return (
    <button
      type="button"
      className={[
        'spectrum-tile',
        armed ? 'is-armed' : '',
        pressed ? 'is-pressed' : '',
        dragging ? 'is-dragging' : '',
        detached ? 'is-detached' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={supportsNativeDrag}
      onClick={(event) => {
        event.stopPropagation();
        onPlace(vegetable.id);
      }}
      onContextMenu={(event) => event.preventDefault()}
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
  const { t } = useI18n();
  const { spectrumById } = useSurveyCatalog();
  const [dragId, setDragId] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [overPalette, setOverPalette] = useState(false);
  const [pressedId, setPressedId] = useState(null);
  const [ghost, setGhost] = useState(null);
  const session = useRef(null);
  const suppressClick = useRef(false);

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

  useEffect(() => {
    function blockScroll(event) {
      if (session.current) event.preventDefault();
    }

    function blockCallout(event) {
      if (!session.current) return;
      event.preventDefault();
      window.getSelection()?.removeAllRanges();
    }

    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('selectstart', blockCallout);
    document.addEventListener('contextmenu', blockCallout);
    return () => {
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('selectstart', blockCallout);
      document.removeEventListener('contextmenu', blockCallout);
    };
  }, []);

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
    if (!isTouchLikePointer(event)) return;
    if (
      event.target instanceof Element &&
      event.target.closest('.spectrum-rank-button')
    ) {
      return;
    }
    const previous = session.current;
    if (previous) {
      window.clearTimeout(previous.timer);
      detachHoldTracking(previous);
    }
    const target =
      event.currentTarget instanceof Element ? event.currentTarget : null;
    const box = target?.getBoundingClientRect?.() ?? {
      width: 96,
      height: 44,
    };
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
      onMove: null,
      onUp: null,
      onTouchMove: null,
      onTouchEnd: null,
    };
    next.timer = window.setTimeout(() => {
      if (session.current !== next) return;
      next.armed = true;
      suppressClick.current = true;
      window.getSelection()?.removeAllRanges();
      buzzArmed();
      setDragId(next.id);
      setGhost({
        x: next.lastX,
        y: next.lastY,
        name: next.name,
        width: next.width,
        height: next.height,
      });
    }, HOLD_MS);

    function onMove(moveEvent) {
      if (session.current !== next || next.pointerId !== moveEvent.pointerId) {
        return false;
      }
      next.lastX = moveEvent.clientX;
      next.lastY = moveEvent.clientY;
      if (!next.armed) {
        if (
          movementExceeded(
            next.x,
            next.y,
            moveEvent.clientX,
            moveEvent.clientY,
            HOLD_SLOP,
          )
        ) {
          window.clearTimeout(next.timer);
          detachHoldTracking(next);
          session.current = null;
          setPressedId(null);
          return false;
        }
        return true;
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
      return true;
    }

    function onUp(endEvent) {
      if (session.current !== next || next.pointerId !== endEvent.pointerId) return;
      window.clearTimeout(next.timer);
      detachHoldTracking(next);
      const armed = next.armed;
      session.current = null;
      setPressedId(null);
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
    }

    attachHoldTracking(next, {
      onMove,
      onUp,
      useTouch: shouldTrackWithTouch(event),
    });
    session.current = next;
    setPressedId(vegetable.id);
  }

  return (
    <div className="spectrum">
      <div className="spectrum-scale">
        <p className="spectrum-end-label">{t('q4.least')}</p>
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
              const vegetable = id ? spectrumById.get(id) ?? null : null;
              const active = !vegetable && index === activeSlot;
              const className = [
                'spectrum-slot',
                active ? 'is-active' : '',
                vegetable ? 'is-filled' : '',
                dragId && dragId === id ? 'is-dragging' : '',
                pressedId === id ? 'is-pressed' : '',
                overIndex === index && dragId !== id ? 'is-over' : '',
                Boolean(ghost) && dragId === id ? 'is-detached' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={index}
                  role="listitem"
                  className={className}
                  data-index={index}
                  draggable={Boolean(vegetable) && supportsNativeDrag}
                  onPointerDown={
                    vegetable
                      ? (event) => onHoldStart(event, vegetable)
                      : undefined
                  }
                  onClick={
                    vegetable ? undefined : () => onActivateSlot(index)
                  }
                  onContextMenu={(event) => event.preventDefault()}
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
                      <MarqueeLabel
                        className="spectrum-rank-label"
                        text={vegetable.name}
                      />
                      <div className="spectrum-rank-controls">
                        <button
                          type="button"
                          className="spectrum-rank-button"
                          disabled={index === 0}
                          aria-label={t('q4.moveUp', { name: vegetable.name })}
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
                          aria-label={t('q4.moveDown', { name: vegetable.name })}
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
                          aria-label={t('q4.returnItem', { name: vegetable.name })}
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
        <p className="spectrum-end-label">{t('q4.most')}</p>
      </div>

      <div className="spectrum-pool">
        <p className="spectrum-palette-label">{t('q4.toPlace')}</p>
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
              pressed={pressedId === vegetable.id}
              dragging={dragId === vegetable.id}
              detached={Boolean(ghost) && dragId === vegetable.id}
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
