import { useEffect, useRef, useState } from 'react';
import { BUCKET_IDS } from '../../data/bucketItems.js';
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

function BucketTile({
  item,
  pressed,
  dragging,
  armed,
  detached,
  locked = false,
  onPlace,
  onDragStart,
  onDragEnd,
  onRemove,
  onTouchStart,
}) {
  const { t } = useI18n();

  return (
    <div className={onRemove ? 'bucket-tile has-remove' : 'bucket-tile'}>
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
        draggable={supportsNativeDrag}
        onClick={(event) => {
          event.stopPropagation();
          if (locked) return;
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
          aria-label={t('q3.returnItem', { name: item.name })}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
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
  const { t } = useI18n();
  const { bucketById } = useSurveyCatalog();
  const [dragId, setDragId] = useState(null);
  const [overBucket, setOverBucket] = useState(null);
  const [overPalette, setOverPalette] = useState(false);
  const [pressedId, setPressedId] = useState(null);
  const [ghost, setGhost] = useState(null);
  const session = useRef(null);
  const suppressClick = useRef(false);
  const boardRef = useRef(null);

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
      detachHoldTracking(current);
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
      // Block as soon as a hold session exists so older iOS cannot steal the gesture.
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

  function ghostFrom(current, x, y) {
    return {
      x,
      y,
      name: current.name,
      width: current.width,
      height: current.height,
    };
  }

  function detach(current) {
    if (current.detached) return;
    current.detached = true;
    current.armed = true;
    suppressClick.current = true;
    window.getSelection()?.removeAllRanges();
    buzzArmed();
    setDragId(current.id);
    setGhost(ghostFrom(current, current.lastX ?? current.x, current.lastY ?? current.y));
  }

  function onTouchStart(event, item, bucketId, locked = false) {
    if (!isTouchLikePointer(event)) return;
    const previous = session.current;
    if (previous) {
      window.clearTimeout(previous.timer);
      detachHoldTracking(previous);
    }
    const box = event.currentTarget.getBoundingClientRect();
    const next = {
      id: item.id,
      name: item.name,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      width: box.width,
      height: box.height,
      armed: false,
      detached: false,
      locked,
      bucketId,
      timer: 0,
      onMove: null,
      onUp: null,
      onTouchMove: null,
      onTouchEnd: null,
    };
    next.timer = window.setTimeout(() => {
      if (session.current !== next) return;
      detach(next);
    }, HOLD_MS);

    function onMove(moveEvent) {
      const current = session.current;
      if (!current || current !== next || current.pointerId !== moveEvent.pointerId) {
        return false;
      }
      current.lastX = moveEvent.clientX;
      current.lastY = moveEvent.clientY;
      if (!current.armed) {
        if (movementExceeded(current.x, current.y, moveEvent.clientX, moveEvent.clientY, HOLD_SLOP)) {
          window.clearTimeout(current.timer);
          detachHoldTracking(current);
          session.current = null;
          setPressedId(null);
          return false;
        }
        // Still within slop: claim gesture so the page does not scroll.
        return true;
      }
      if (!current.detached) return true;
      setGhost(ghostFrom(current, moveEvent.clientX, moveEvent.clientY));
      highlightUnder(moveEvent.clientX, moveEvent.clientY);
      return true;
    }

    function onUp(endEvent) {
      const current = session.current;
      if (!current || current !== next || current.pointerId !== endEvent.pointerId) return;
      window.clearTimeout(current.timer);
      detachHoldTracking(current);
      const detached = current.detached;
      const id = current.id;
      session.current = null;
      if (!detached) {
        setPressedId(null);
        if (endEvent.type === 'pointercancel' || current.locked) return;
        suppressClick.current = true;
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 450);
        finishTap(id, current.bucketId);
        return;
      }
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 400);
      const hit = findDrop(endEvent.clientX, endEvent.clientY);
      if (hit?.bucketId) onPlace(id, hit.bucketId);
      else if (hit?.palette) onReturnToPalette(id);
      clearSession();
    }

    attachHoldTracking(next, {
      onMove,
      onUp,
      useTouch: shouldTrackWithTouch(event),
    });
    session.current = next;
    setPressedId(item.id);
  }

  function finishTap(id, bucketId) {
    setPressedId(id);
    window.setTimeout(() => {
      setPressedId((current) => (current === id ? null : current));
      onPlace(id, bucketId);
    }, 120);
  }

  function placeFromTap(id, bucketId) {
    if (suppressClick.current) {
      suppressClick.current = false;
      setPressedId(null);
      return;
    }
    finishTap(id, bucketId);
  }

  return (
    <div className="buckets" ref={boardRef}>
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
              <p className="bucket-label">{t(`buckets.${bucketId}`)}</p>
              <div className="bucket-items">
                {buckets[bucketId].map((id) => {
                  const item = bucketById.get(id);
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
                      locked
                      onTouchStart={(event) =>
                        onTouchStart(event, item, bucketId, true)
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="spectrum-pool">
        <p className="spectrum-palette-label">{t('q3.toSort')}</p>
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
              onTouchStart={(event) => onTouchStart(event, item, activeBucket)}
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
