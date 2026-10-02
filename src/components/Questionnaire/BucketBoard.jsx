import { useEffect, useRef, useState } from 'react';
import {
  BUCKET_IDS,
  bucketLabels,
  getBucketItem,
} from '../../data/bucketItems.js';

const ARM_MS = 180;
const DETACH_MS = 500;
const SLOP = 12;

const nativeDrag =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function BucketTile({
  item,
  pressed,
  dragging,
  armed,
  detached,
  onPlace,
  onDragStart,
  onDragEnd,
  onRemove,
  onTouchStart,
}) {
  return (
    <div className="bucket-tile">
      <button
        type="button"
        className={[
          'spectrum-tile',
          pressed ? 'is-pressed' : '',
          armed ? 'is-armed' : '',
          dragging ? 'is-dragging' : '',
          detached ? 'is-detached' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        draggable={nativeDrag}
        onClick={(event) => {
          event.stopPropagation();
          onPlace(item.id);
        }}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => onDragStart(event, item.id)}
        onDragEnd={onDragEnd}
        onPointerDown={(event) => onTouchStart(event, item)}
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
  armedId,
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
    if (current) {
      window.clearTimeout(current.timer);
      window.clearTimeout(current.detachTimer);
      unlisten(current);
    }
    session.current = null;
    setPressedId(null);
    setGhost(null);
    setDragId(null);
    setOverBucket(null);
    setOverPalette(false);
  }

  useEffect(() => {
    function blockScroll(event) {
      if (session.current?.armed) event.preventDefault();
    }
    document.addEventListener('touchmove', blockScroll, { passive: false });
    return () => document.removeEventListener('touchmove', blockScroll);
  }, []);

  function findDrop(x, y) {
    for (const node of document.elementsFromPoint(x, y)) {
      if (!(node instanceof Element)) continue;
      if (node.closest('.touch-drag-ghost')) continue;
      const bucketId = node.closest('[data-bucket]')?.getAttribute('data-bucket');
      if (bucketId) return { bucketId };
      if (node.closest('.spectrum-palette')) return { palette: true };
    }
    return null;
  }

  function highlightUnder(x, y) {
    const hit = findDrop(x, y);
    setOverBucket(hit?.bucketId ?? null);
    setOverPalette(Boolean(hit?.palette));
  }

  function detach(current) {
    if (current.detached) return;
    current.detached = true;
    suppressClick.current = true;
    setDragId(current.id);
    setGhost({
      x: current.lastX ?? current.x,
      y: current.lastY ?? current.y,
      name: current.name,
    });
  }

  function unlisten(current) {
    if (!current?.onMove) return;
    window.removeEventListener('pointermove', current.onMove);
    window.removeEventListener('pointerup', current.onUp);
    window.removeEventListener('pointercancel', current.onUp);
  }

  function onTouchStart(event, item) {
    if (event.pointerType === 'mouse') return;
    if (event.button != null && event.button !== 0) return;
    const previous = session.current;
    if (previous) {
      window.clearTimeout(previous.timer);
      window.clearTimeout(previous.detachTimer);
      unlisten(previous);
    }
    const next = {
      id: item.id,
      name: item.name,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      armed: false,
      detached: false,
      timer: 0,
      detachTimer: 0,
      onMove: null,
      onUp: null,
    };
    next.timer = window.setTimeout(() => {
      if (session.current !== next) return;
      next.armed = true;
    }, ARM_MS);
    next.detachTimer = window.setTimeout(() => {
      if (session.current !== next || !next.armed) return;
      detach(next);
    }, DETACH_MS);
    next.onMove = (moveEvent) => onTouchMove(moveEvent);
    next.onUp = (endEvent) => onTouchEnd(endEvent);
    window.addEventListener('pointermove', next.onMove);
    window.addEventListener('pointerup', next.onUp);
    window.addEventListener('pointercancel', next.onUp);
    session.current = next;
    setPressedId(item.id);
  }

  function onTouchMove(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.lastX = event.clientX;
    current.lastY = event.clientY;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.armed) {
      if (dx * dx + dy * dy > SLOP * SLOP) {
        window.clearTimeout(current.timer);
        window.clearTimeout(current.detachTimer);
        unlisten(current);
        session.current = null;
        setPressedId(null);
      }
      return;
    }
    if (dx * dx + dy * dy > SLOP * SLOP) detach(current);
    if (!current.detached) return;
    setGhost({ x: event.clientX, y: event.clientY, name: current.name });
    highlightUnder(event.clientX, event.clientY);
  }

  function onTouchEnd(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    window.clearTimeout(current.timer);
    window.clearTimeout(current.detachTimer);
    unlisten(current);
    const detached = current.detached;
    const id = current.id;
    session.current = null;
    if (!detached) {
      setPressedId(null);
      return;
    }
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 400);
    const hit = findDrop(event.clientX, event.clientY);
    if (hit?.bucketId) onPlace(id, hit.bucketId);
    else if (hit?.palette) onReturnToPalette(id);
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
                      armed={armedId === id}
                      dragging={dragId === id}
                      detached={Boolean(ghost) && dragId === id}
                      onPlace={() => placeFromTap(id, activeBucket ?? bucketId)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onRemove={() => onReturnToPalette(id)}
                      onTouchStart={onTouchStart}
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
              armed={armedId === item.id}
              dragging={dragId === item.id}
              detached={Boolean(ghost) && dragId === item.id}
              onPlace={() => placeFromTap(item.id, activeBucket)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTouchStart={onTouchStart}
            />
          ))}
        </div>
      </div>
      {ghost ? (
        <div
          className="touch-drag-ghost spectrum-tile"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <span className="spectrum-tile-label">{ghost.name}</span>
        </div>
      ) : null}
    </div>
  );
}
