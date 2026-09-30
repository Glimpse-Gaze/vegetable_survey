import { useState } from 'react';
import {
  BUCKET_IDS,
  bucketLabels,
  getBucketItem,
} from '../../data/bucketItems.js';

function BucketTile({ item, onPlace, onDragStart, onDragEnd }) {
  return (
    <button
      type="button"
      className="spectrum-tile"
      draggable="true"
      onClick={(event) => {
        event.stopPropagation();
        onPlace(item.id);
      }}
      onDragStart={(event) => onDragStart(event, item.id)}
      onDragEnd={onDragEnd}
    >
      <span className="spectrum-tile-label">{item.name}</span>
    </button>
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
                      onPlace={() => onPlace(id, activeBucket ?? bucketId)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
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
              onPlace={() => onPlace(item.id, activeBucket)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
