import { useRef, useState } from 'react';
import {
  BUCKET_IDS,
  bucketLabels,
  getBucketItem,
} from '../../data/bucketItems.js';

const HOLD_MS = 200;
const SLOP = 12;

const nativeDrag =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function BucketTile({
  item,
  pressed,
  dragging,
  onPlace,
  onDragStart,
  onDragEnd,
  onRemove,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) {
  return (
    <div className="bucket-tile">
      <button
        type="button"
        className={[
          'spectrum-tile',
          pressed ? 'is-pressed' : '',
          dragging ? 'is-dragging' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        draggable={nativeDrag}
        onClick={(event) => {
          event.stopPropagation();
          onPlace(item.id);
        }}
        onDragStart={(event) => onDragStart(event, item.id)}
        onDragEnd={onDragEnd}
        onPointerDown={(event) => onTouchStart(event, item)}
        onPointerMove={onTouchMove}
        onPointerUp={onTouchEnd}
        onPointerCancel={onTouchEnd}
      >
        <span className="spectrum-tile-label">{item.name}</span>
      </button>
      {onRemove ? (
        <button
          type="button"
          className="tile-remove"
          aria-label={`Return ${item.name} to the list`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}

export function BucketBoard({
  palette,
  buckets,
  activeBucket,
  onActivateBucket,
  onPlace,
  onReturnToPalette,
}) {
  const [dragId, setDragId] = useState(null);
  const [overBucket, setOverBucket] = useState(null);
  const [overPalette, setOverPalette] = useState(false);
  const [pressedId, setPressedId] = useState(null);
  const [ghost, setGhost] = useState(null);
  const session = useRef(null);
  const suppressClick = useRef(false);

  function handleDragStart(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  }

  function handleBucketDragOver(event, bucketId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overBucket !== bucketId) setOverBucket(bucketId);
    if (overPalette) setOverPalette(false);
  }

  function handleBucketDrop(event, bucketId) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || dragId;
    if (id) onPlace(id, bucketId);
    setDragId(null);
    setOverBucket(null);
    setOverPalette(false);
  }

  function handlePaletteDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (!overPalette) setOverPalette(true);
    if (overBucket) setOverBucket(null);
  }

  function handlePaletteDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || dragId;
    if (id) onReturnToPalette(id);
    setDragId(null);
    setOverBucket(null);
    setOverPalette(false);
  }

  function handleDragEnd() {
    setDragId(null);
    setOverBucket(null);
    setOverPalette(false);
  }

  function clearSession() {
    const current = session.current;
    if (current) window.clearTimeout(current.timer);
    session.current = null;
    setPressedId(null);
    setGhost(null);
    setDragId(null);
    setOverBucket(null);
    setOverPalette(false);
  }

  function highlightUnder(x, y) {
    const hit = document.elementFromPoint(x, y);
    const bucketId = hit?.closest?.('[data-bucket]')?.getAttribute('data-bucket');
    const paletteHit = Boolean(hit?.closest?.('.spectrum-palette'));
    setOverBucket(bucketId ?? null);
    setOverPalette(paletteHit && !bucketId);
  }

  function onTouchStart(event, item) {
    if (event.pointerType === 'mouse') return;
    const current = session.current;
    if (current) window.clearTimeout(current.timer);
    const next = {
      id: item.id,
      name: item.name,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      armed: false,
      target: event.currentTarget,
      timer: 0,
    };
    next.timer = window.setTimeout(() => {
      if (session.current !== next) return;
      next.armed = true;
      suppressClick.current = true;
      next.target.setPointerCapture?.(next.pointerId);
      setDragId(item.id);
      setGhost({ x: next.x, y: next.y, name: item.name });
    }, HOLD_MS);
    session.current = next;
    setPressedId(item.id);
  }

  function onTouchMove(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.armed) {
      if (dx * dx + dy * dy > SLOP * SLOP) {
        window.clearTimeout(current.timer);
        session.current = null;
        setPressedId(null);
      }
      return;
    }
    setGhost({ x: event.clientX, y: event.clientY, name: current.name });
    highlightUnder(event.clientX, event.clientY);
  }

  function onTouchEnd(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    window.clearTimeout(current.timer);
    session.current = null;
    if (!current.armed) return;

    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const bucketId = hit?.closest?.('[data-bucket]')?.getAttribute('data-bucket');
    const paletteHit = Boolean(hit?.closest?.('.spectrum-palette'));
    if (bucketId) onPlace(current.id, bucketId);
    else if (paletteHit) onReturnToPalette(current.id);
    clearSession();
  }

  function placeFromTap(id, bucketId) {
    if (suppressClick.current) {
      suppressClick.current = false;
      setPressedId(null);
      return;
    }
    setPressedId(id);
    window.setTimeout(() => {
      setPressedId((current) => (current === id ? null : current));
      onPlace(id, bucketId);
    }, 120);
  }

  return (
    <div className="buckets">
      <div className="bucket-row">
        {BUCKET_IDS.map((bucketId) => {
          const className = [
            'bucket',
            `is-${bucketId}`,
            activeBucket === bucketId ? 'is-active' : '',
            overBucket === bucketId ? 'is-over' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={bucketId}
              className={className}
              data-bucket={bucketId}
              onClick={() => onActivateBucket(bucketId)}
              onDragOver={(event) => handleBucketDragOver(event, bucketId)}
              onDrop={(event) => handleBucketDrop(event, bucketId)}
            >
              <p className="bucket-label">{bucketLabels[bucketId]}</p>
              <div className="bucket-items">
                {buckets[bucketId].map((id) => {
                  const item = getBucketItem(id);
                  if (!item) return null;
                  return (
                    <BucketTile
                      key={id}
                      item={item}
                      pressed={pressedId === id}
                      dragging={dragId === id}
                      onPlace={() => placeFromTap(id, activeBucket ?? bucketId)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onRemove={() => onReturnToPalette(id)}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="spectrum-pool">
        <p className="spectrum-palette-label">Items to sort</p>
        <div
          className={
            overPalette ? 'spectrum-palette is-over' : 'spectrum-palette'
          }
          onDragOver={handlePaletteDragOver}
          onDrop={handlePaletteDrop}
        >
          {palette.map((item) => (
            <BucketTile
              key={item.id}
              item={item}
              pressed={pressedId === item.id}
              dragging={dragId === item.id}
              onPlace={() => placeFromTap(item.id, activeBucket)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          ))}
        </div>
      </div>
      {ghost ? (
        <p className="touch-drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
          {ghost.name}
        </p>
      ) : null}
    </div>
  );
}
