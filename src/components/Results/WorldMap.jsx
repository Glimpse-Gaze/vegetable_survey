import { startTransition, useEffect, useRef, useState } from 'react';
import mapMarkup from '../../assets/map/World_Equal.svg?raw';
import { LIVE_COUNTRIES, VOTE_THRESHOLD } from '../../data/resultsMock.js';

const LIVE_BY_ISO3 = Object.fromEntries(
  LIVE_COUNTRIES.map((country) => [country.iso3, country]),
);

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.45;
const PAN_THRESHOLD = 5;

function countryIso3(group) {
  return [...group.classList].find(
    (token) => token.length === 3 && token === token.toUpperCase(),
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseViewBox(svg) {
  const [x, y, w, h] = svg
    .getAttribute('viewBox')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return { x, y, w, h };
}

function writeViewBox(svg, box) {
  svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
}

function viewAround(base, zoom, cx, cy) {
  const w = base.w / zoom;
  const h = base.h / zoom;
  return {
    x: clamp(cx - w / 2, base.x, base.x + base.w - w),
    y: clamp(cy - h / 2, base.y, base.y + base.h - h),
    w,
    h,
  };
}

function groupFromPoint(clientX, clientY) {
  const node = document.elementFromPoint(clientX, clientY);
  return node?.closest?.('.world-map-frame .country > g') ?? null;
}

export function WorldMap({ selectedId, onSelect }) {
  const hostRef = useRef(null);
  const viewportRef = useRef(null);
  const svgRef = useRef(null);
  const groupsRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const baseRef = useRef(null);
  const viewRef = useRef(null);
  const zoomRef = useRef(1);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [tip, setTip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const tipEl = useRef(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selectedId;
  }, [onSelect, selectedId]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  function selectLiveGroup(group) {
    if (!group) return;
    const iso3 = countryIso3(group);
    const live = iso3 ? LIVE_BY_ISO3[iso3] : null;
    if (!live) return;
    const current = selectedRef.current;
    startTransition(() => {
      onSelectRef.current(live.id === current ? 'global' : live.id);
    });
  }

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    host.innerHTML = mapMarkup;
    const svg = host.querySelector('svg');
    if (!svg) return undefined;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'World map of survey responses');
    svg.querySelector(':scope > title')?.remove();
    svg.querySelector(':scope > desc')?.remove();

    svgRef.current = svg;
    const base = parseViewBox(svg);
    baseRef.current = base;
    viewRef.current = { ...base };
    zoomRef.current = 1;
    setZoom(1);

    const groups = [...svg.querySelectorAll('.country > g')];
    groupsRef.current = groups;

    const hoverTip = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;

    function onEnter(event) {
      if (!hoverTip) return;
      const group = event.currentTarget;
      const title = group.getAttribute('data-name');
      if (!title) return;
      const iso3 = countryIso3(group);
      const live = iso3 ? LIVE_BY_ISO3[iso3] : null;
      setTip({
        name: title,
        live: Boolean(live),
        votes: live?.votes ?? 0,
        x: event.clientX,
        y: event.clientY,
      });
    }

    function onMove(event) {
      const el = tipEl.current;
      if (!el) return;
      el.style.left = `${event.clientX + 14}px`;
      el.style.top = `${event.clientY + 14}px`;
    }

    function onLeave() {
      setTip(null);
    }

    function onClick(event) {
      if (zoomRef.current > 1) return;
      const group = event.target.closest?.('.country > g');
      if (group) selectLiveGroup(group);
    }

    for (const group of groups) {
      const titleNode = group.querySelector(':scope > title');
      const name = titleNode?.textContent?.trim() ?? '';
      if (name) group.setAttribute('data-name', name);
      titleNode?.remove();
      const iso3 = countryIso3(group);
      if (iso3 && LIVE_BY_ISO3[iso3]) group.classList.add('is-live');
      group.addEventListener('pointerenter', onEnter);
      group.addEventListener('pointermove', onMove);
      group.addEventListener('pointerleave', onLeave);
    }

    svg.addEventListener('click', onClick);

    svg.querySelectorAll('title').forEach((node) => node.remove());

    return () => {
      for (const group of groups) {
        group.removeEventListener('pointerenter', onEnter);
        group.removeEventListener('pointermove', onMove);
        group.removeEventListener('pointerleave', onLeave);
      }
      svg.removeEventListener('click', onClick);
      groupsRef.current = [];
      svgRef.current = null;
      host.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    for (const group of groupsRef.current) {
      const iso3 = countryIso3(group);
      const live = iso3 ? LIVE_BY_ISO3[iso3] : null;
      group.classList.toggle(
        'is-selected',
        Boolean(live && live.id === selectedId),
      );
    }
  }, [selectedId]);

  function applyZoom(nextZoom) {
    const svg = svgRef.current;
    const base = baseRef.current;
    const current = viewRef.current;
    if (!svg || !base || !current) return;
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const next =
      z === 1
        ? { ...base }
        : viewAround(base, z, current.x + current.w / 2, current.y + current.h / 2);
    viewRef.current = next;
    zoomRef.current = z;
    writeViewBox(svg, next);
    setZoom(z);
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest('button')) return;
    if (zoomRef.current <= 1) return;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view: { ...viewRef.current },
      moved: false,
    };
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    const viewport = viewportRef.current;
    const svg = svgRef.current;
    const base = baseRef.current;
    if (!drag || drag.id !== event.pointerId || !viewport || !svg || !base) {
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < PAN_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      setPanning(true);
    }
    const box = viewport.getBoundingClientRect();
    const next = {
      x: drag.view.x - dx * (drag.view.w / box.width),
      y: drag.view.y - dy * (drag.view.h / box.height),
      w: drag.view.w,
      h: drag.view.h,
    };
    next.x = clamp(next.x, base.x, base.x + base.w - next.w);
    next.y = clamp(next.y, base.y, base.y + base.h - next.h);
    viewRef.current = next;
    writeViewBox(svg, next);
  }

  function onPointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    dragRef.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = true;
    window.requestAnimationFrame(() => {
      suppressClickRef.current = false;
    });
    if (event.type === 'pointercancel') return;
    if (!moved) selectLiveGroup(groupFromPoint(event.clientX, event.clientY));
  }

  return (
    <div className="world-map">
      <div
        className={[
          'world-map-viewport',
          zoom > 1 ? 'is-zoomed' : '',
          panning ? 'is-panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="world-map-frame" ref={hostRef} />
        <div
          className="world-map-zoom-controls"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
          >
            −
          </button>
        </div>
      </div>
      {tip ? (
        <div
          ref={tipEl}
          className="world-map-tip"
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          <strong>{tip.name}</strong>
          {tip.live ? (
            <span>{tip.votes} answers · click to filter</span>
          ) : (
            <span>Fewer than {VOTE_THRESHOLD} answers</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
