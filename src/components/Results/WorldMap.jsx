import { startTransition, useEffect, useRef, useState } from 'react';
import mapMarkup from '../../assets/map/World_Equal.svg?raw';
import { LIVE_COUNTRIES, VOTE_THRESHOLD } from '../../data/resultsMock.js';
import { countryIdFromMapTitle } from '../../i18n/countryNameIndex.js';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';

const KNOWN_BY_ISO3 = Object.fromEntries(
  LIVE_COUNTRIES.map((country) => [country.iso3, country]),
);

const MIN_ZOOM = 1;
// Enough to tap most of the Balkans on a phone. Smaller states stay in the dropdown.
const MAX_ZOOM = 10;
const ZOOM_FACTOR = 1.5;
const PAN_THRESHOLD = 5;

function nextZoom(zoom, direction) {
  const raw = direction > 0 ? zoom * ZOOM_FACTOR : zoom / ZOOM_FACTOR;
  const stepped = Math.round(raw * 100) / 100;
  if (direction > 0 && stepped >= MAX_ZOOM - 0.05) return MAX_ZOOM;
  if (direction < 0 && stepped <= MIN_ZOOM + 0.05) return MIN_ZOOM;
  return clamp(stepped, MIN_ZOOM, MAX_ZOOM);
}

/** Keep the vote popup on screen. Touch places it above the finger. */
function tipOrigin(clientX, clientY, above) {
  const width = 220;
  const height = 64;
  const margin = 10;
  const left = above ? clientX - width / 2 : clientX + 14;
  const top = above ? clientY - height - 18 : clientY + 14;
  return {
    left: clamp(left, margin, Math.max(margin, window.innerWidth - width - margin)),
    top: clamp(top, margin, Math.max(margin, window.innerHeight - height - margin)),
  };
}

function countryIso3(group) {
  return [...group.classList].find(
    (token) => token.length === 3 && token === token.toUpperCase(),
  );
}

/** Innermost map group with an ISO3 class (e.g. Greenland inside Denmark). */
function innermostCountryGroup(node) {
  let el = node?.nodeType === 1 ? node : null;
  while (el) {
    if (el.classList && countryIso3(el)) return el;
    el = el.parentElement;
  }
  return null;
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

export function WorldMap({
  selectedId,
  onSelect,
  liveCountries = LIVE_COUNTRIES,
  languageFiltered = false,
}) {
  const { t } = useI18n();
  const catalog = useSurveyCatalog();
  const hostRef = useRef(null);
  const viewportRef = useRef(null);
  const svgRef = useRef(null);
  const groupsRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const liveRef = useRef(liveCountries);
  const languageFilteredRef = useRef(languageFiltered);
  const countriesRef = useRef(catalog.countriesById);
  const baseRef = useRef(null);
  const viewRef = useRef(null);
  const zoomRef = useRef(1);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const pickRef = useRef(() => {});
  const [tip, setTip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const tipEl = useRef(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selectedId;
    liveRef.current = liveCountries;
    languageFilteredRef.current = languageFiltered;
    countriesRef.current = catalog.countriesById;
  }, [onSelect, selectedId, liveCountries, languageFiltered, catalog.countriesById]);

  useEffect(() => {
    setTip((prev) => {
      if (!prev?.countryId) return prev;
      const localized = countriesRef.current.get(prev.countryId)?.name;
      if (!localized || localized === prev.name) return prev;
      return { ...prev, name: localized };
    });
  }, [catalog.countriesById]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    svgRef.current?.setAttribute('aria-label', t('results.mapTip.aria'));
  }, [t]);

  function selectLiveGroup(group) {
    if (!group) return;
    const iso3 = countryIso3(group);
    const live = iso3
      ? liveRef.current.find((country) => country.iso3 === iso3)
      : null;
    // Only filterable once a region clears the vote threshold.
    if (!live || live.votes < VOTE_THRESHOLD) return;
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
    svg.setAttribute('aria-label', 'World map');
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

    function tipFromPointer(event) {
      const group =
        innermostCountryGroup(event.target) ?? event.currentTarget;
      const title = group?.getAttribute('data-name');
      if (!title) return null;
      const iso3 = countryIso3(group);
      const known = iso3 ? KNOWN_BY_ISO3[iso3] : null;
      const live = iso3
        ? liveRef.current.find((country) => country.iso3 === iso3)
        : null;
      const countryId =
        known?.id ?? countryIdFromMapTitle(title) ?? null;
      const localized = countryId
        ? countriesRef.current.get(countryId)?.name
        : null;
      return {
        name: localized || known?.name || title,
        countryId,
        iceWall: iso3 === 'ATA',
        live: Boolean(live && live.votes >= VOTE_THRESHOLD),
        emerging: Boolean(live && live.votes > 0 && live.votes < VOTE_THRESHOLD),
        hiddenLanguage: Boolean(known && !live && languageFilteredRef.current),
        votes: live?.votes ?? known?.votes ?? 0,
        ...tipOrigin(event.clientX, event.clientY, false),
      };
    }

    function showTouchTip(group, x, y) {
      if (hoverTip) return;
      if (!group) {
        setTip(null);
        return;
      }
      const next = tipFromPointer({
        target: group,
        currentTarget: group,
        clientX: x,
        clientY: y,
      });
      if (!next || next.live) {
        setTip(null);
        return;
      }
      setTip({ ...next, ...tipOrigin(x, y, true) });
    }

    function pickCountry(group, x, y) {
      if (group) {
        const iso3 = countryIso3(group);
        const live = iso3
          ? liveRef.current.find((country) => country.iso3 === iso3)
          : null;
        if (live && live.votes >= VOTE_THRESHOLD) {
          if (!hoverTip) setTip(null);
          selectLiveGroup(group);
          return;
        }
      }
      showTouchTip(group, x, y);
    }

    pickRef.current = pickCountry;

    function onEnter(event) {
      if (!hoverTip) return;
      const next = tipFromPointer(event);
      if (next) setTip(next);
    }

    function onMove(event) {
      const el = tipEl.current;
      if (el && hoverTip) {
        const origin = tipOrigin(event.clientX, event.clientY, false);
        el.style.left = `${origin.left}px`;
        el.style.top = `${origin.top}px`;
      }
      if (!hoverTip) return;
      const next = tipFromPointer(event);
      if (!next) return;
      setTip((prev) => {
        if (
          prev &&
          prev.countryId === next.countryId &&
          prev.name === next.name &&
          prev.iceWall === next.iceWall &&
          prev.live === next.live &&
          prev.emerging === next.emerging &&
          prev.votes === next.votes
        ) {
          return prev;
        }
        return next;
      });
    }

    function onLeave() {
      if (!hoverTip) return;
      setTip(null);
    }

    function onClick(event) {
      if (zoomRef.current > 1) return;
      pickCountry(
        innermostCountryGroup(event.target),
        event.clientX,
        event.clientY,
      );
    }

    for (const group of groups) {
      const labeled = [group, ...group.querySelectorAll(':scope g')];
      for (const node of labeled) {
        const titleNode = node.querySelector(':scope > title');
        const name = titleNode?.textContent?.trim() ?? '';
        if (name) node.setAttribute('data-name', name);
        titleNode?.remove();
      }
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
    const liveByIso = Object.fromEntries(
      liveCountries.map((country) => [country.iso3, country]),
    );
    for (const group of groupsRef.current) {
      const iso3 = countryIso3(group);
      const live = iso3 ? liveByIso[iso3] : null;
      const votes = live?.votes ?? 0;
      const isReady = Boolean(live && votes >= VOTE_THRESHOLD);
      const isEmerging = Boolean(live && votes > 0 && votes < VOTE_THRESHOLD);
      group.classList.toggle('is-live', isReady);
      group.classList.toggle('is-emerging', isEmerging);
      group.classList.toggle(
        'is-selected',
        Boolean(live && live.id === selectedId && isReady),
      );
    }
  }, [selectedId, liveCountries]);

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
    setTip(null);
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
      setTip(null);
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
    if (!moved) {
      pickRef.current(
        groupFromPoint(event.clientX, event.clientY),
        event.clientX,
        event.clientY,
      );
    }
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
            aria-label={t('results.mapTip.zoomIn')}
            disabled={zoom >= MAX_ZOOM}
            onClick={() => applyZoom(nextZoom(zoom, 1))}
          >
            +
          </button>
          <button
            type="button"
            aria-label={t('results.mapTip.zoomOut')}
            disabled={zoom <= MIN_ZOOM}
            onClick={() => applyZoom(nextZoom(zoom, -1))}
          >
            −
          </button>
        </div>
      </div>
      {tip ? (
        <div
          ref={tipEl}
          className="world-map-tip"
          style={{ left: tip.left, top: tip.top }}
        >
          <strong>
            {tip.iceWall ? t('results.mapTip.iceWall') : tip.name}
          </strong>
          {tip.iceWall ? (
            <span>{t('results.mapTip.iceWallHint')}</span>
          ) : tip.live ? (
            <span>{t('results.mapTip.live', { votes: tip.votes })}</span>
          ) : tip.emerging ? (
            <span>
              {t('results.mapTip.emerging', {
                votes: tip.votes,
                threshold: VOTE_THRESHOLD,
              })}
            </span>
          ) : tip.hiddenLanguage ? (
            <span>{t('results.mapTip.noLanguage')}</span>
          ) : (
            <span>
              {t('results.mapTip.few', { threshold: VOTE_THRESHOLD })}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
