import { lazy, Suspense, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n.js';
import { localizeResultsSection } from '../i18n/localizeResults.js';
import { withLocale } from '../i18n/paths.js';
import { useSurveyCatalog } from '../i18n/useSurveyCatalog.js';
import { BrandFooter } from '../components/BrandFooter.jsx';
import { LocaleSwitcher } from '../components/LocaleSwitcher.jsx';
import { ReportIssuesButton } from '../components/ReportIssues.jsx';
import { BucketColumns } from '../components/Results/BucketColumns.jsx';
import { ReasonResults } from '../components/Results/ReasonResults.jsx';
import { SpectrumList } from '../components/Results/SpectrumList.jsx';
import { NoteResults } from '../components/Results/NoteResults.jsx';
import { ResponseCodeCard, SurveyNudge } from '../components/Results/SurveyGate.jsx';
import {
  isResponseId,
  readMyAnswers,
  readMyResponseId,
} from '../utils/myResponse.js';
import { placeNotePop } from '../utils/placeNotePop.js';
import {
  CATEGORIES,
  getCategory,
  getSection,
  nextCategoryId,
  REGION_GROUPS,
  REGIONS,
  BLADE_BOARD_SIZE,
  VEGETABLE_LABELS,
  VEGETABLE_ART,
  ALL_LANGUAGES_ID,
  LIVE_COUNTRIES,
  VOTE_THRESHOLD,
  languagesForRegion,
  regionsForLanguage,
  nativeCount,
} from '../data/resultsMock.js';
import {
  applyLiveBlend,
  emptyLiveSummary,
  isMixingLive,
  mapCountriesFromLive,
} from '../data/blendLiveResults.js';
import { bandForRank } from '../data/spectrumVegetables.js';
import placeholder from '../content/Placeholder.jpg';
import '../styles/results.css';

const WorldMap = lazy(() =>
  import('../components/Results/WorldMap.jsx').then((mod) => ({
    default: mod.WorldMap,
  })),
);

const AUTO_PX_PER_MS = 0.048;
const DRAG_THRESHOLD = 6;
const IDLE_MS = 4000;
const NUDGE_SETTLE_MS = 450;
const WARMUP_MS = 1100;
const EDGE_PX = 110;
const EDGE_FLOOR = 0.64;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function warmupGain(elapsed) {
  const t = clamp01(elapsed / WARMUP_MS);
  return t * t * (3 - 2 * t);
}

function edgeGain(position, max, direction) {
  if (max <= 0) return 1;
  const fromStart = direction > 0 ? position : max - position;
  const toEnd = direction > 0 ? max - position : position;
  const leave =
    fromStart >= EDGE_PX
      ? 1
      : EDGE_FLOOR + (1 - EDGE_FLOOR) * (fromStart / EDGE_PX) ** 2;
  const approach =
    toEnd >= EDGE_PX
      ? 1
      : EDGE_FLOOR + (1 - EDGE_FLOOR) * (toEnd / EDGE_PX) ** 2;
  return Math.min(leave, approach);
}

function formatVotes(n, t, numberLocale) {
  return `${n.toLocaleString(numberLocale)} ${n === 1 ? t('results.vote') : t('results.votes')}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function ordinal(n, t) {
  const remainder = n % 100;
  if (remainder >= 11 && remainder <= 13) return t('results.ordinal.other', { n });
  switch (n % 10) {
    case 1:
      return t('results.ordinal.one', { n });
    case 2:
      return t('results.ordinal.two', { n });
    case 3:
      return t('results.ordinal.few', { n });
    default:
      return t('results.ordinal.other', { n });
  }
}

function placeLabel(region, t) {
  if (region.id === 'global') return t('results.worldwide');
  return t('results.inPlace', { place: region.name });
}

function audienceLabel(section, t) {
  const language = section.language?.name;
  const place =
    section.region.id === 'global'
      ? ''
      : ` ${t('results.inPlace', { place: section.region.name })}`;
  if (language) return t('results.amongSpeakers', { language, place });
  return placeLabel(section.region, t);
}

function alignmentTone(rank) {
  if (!rank) return 'lose';
  if (rank === 1) return 'win';
  return 'place';
}

function alignmentCopy(section, t) {
  const picked = section.userOnBoard ? section.userRanked : null;
  const name =
    picked?.name ??
    section.userVoteName ??
    VEGETABLE_LABELS[section.userVoteId];
  if (!name) return null;

  const place = audienceLabel(section, t);
  if (!picked) {
    const share = section.userRanked?.share ?? 0;
    const people = section.language
      ? t('results.speakers', { language: section.language.name })
      : t('results.people');
    return {
      kicker: t(share > 0 ? 'results.onlyShare' : 'results.shareVoted', {
        share: formatShare(share),
        people,
      }),
      name,
      tone: 'lose',
      connector: t('results.it'),
      outcome: t('results.placedBelow', { size: BLADE_BOARD_SIZE, place }),
    };
  }

  const people = section.language
    ? t('results.speakers', { language: section.language.name })
    : t('results.people');

  return {
    kicker: t('results.shareVoted', {
      share: formatShare(picked.share),
      people,
    }),
    name,
    tone: alignmentTone(picked.rank),
    connector: t('results.itIs'),
    outcome:
      picked.rank === 1
        ? t('results.leading', { place })
        : t('results.ordinalPlace', {
            rank: ordinal(picked.rank, t),
            place,
          }),
  };
}

function Crown() {
  return (
    <svg className="blade-crown" viewBox="0 0 32 18" aria-hidden="true">
      <path
        d="M3 16h26L26 7l-5 4L16 2l-5 9-5-4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Blade({ item, isYours, variant }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const fill = Math.max(0, item.share * 100);
  const isChampion = variant === 'champion';

  return (
    <article
      className={[
        'blade',
        isChampion ? 'is-champion' : '',
        variant === 'outlier' ? 'is-outlier' : '',
        isYours ? 'is-yours' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-blade={item.id}
    >
      {isChampion ? <Crown /> : null}
      <div className="blade-face">
        {isYours ? <span className="blade-badge">{t('results.yourVote')}</span> : null}
        <img
          src={item.art}
          alt=""
          draggable={false}
          decoding="async"
          loading="eager"
          fetchPriority={item.rank <= 2 ? 'high' : 'auto'}
        />
        <div className="blade-scrim" />
        <div className="blade-copy">
          <div className="blade-topline">
            <span className="blade-rank">#{item.rank}</span>
          </div>
          <p className="blade-name">{item.name}</p>
          <p className="blade-meta">
            {formatVotes(item.votes, t, numberLocale)} · {formatShare(item.share)}
          </p>
        </div>
        <div className="blade-meter" aria-hidden="true">
          <span style={{ width: `${fill}%` }} />
        </div>
      </div>
    </article>
  );
}

function RankRail({ section, pauseAutoplay }) {
  const { t } = useI18n();
  const prevLabel = t('results.prevVeggies');
  const nextLabel = t('results.nextVeggies');
  const railRef = useRef(null);
  const stageRef = useRef(null);
  const menuPauseRef = useRef(false);
  const edgesRef = useRef({ atStart: true, atEnd: false });
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
  const dragRef = useRef(null);
  const coastRef = useRef(0);
  const nudgePauseRef = useRef(false);
  const directionRef = useRef(1);
  const resumeTimer = useRef(0);
  const drivingRef = useRef(false);
  const drivenAt = useRef(0);
  const nudgeAnim = useRef(0);

  function holdNudge() {
    nudgePauseRef.current = true;
    window.clearTimeout(resumeTimer.current);
  }

  function releaseNudge() {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      nudgePauseRef.current = false;
    }, NUDGE_SETTLE_MS);
  }

  useEffect(() => {
    menuPauseRef.current = pauseAutoplay;
  }, [pauseAutoplay]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let carry = 0;
    let last = performance.now();
    let idleMs = 0;
    let warmupElapsed = 0;
    let frame = 0;
    let hidden = document.hidden;

    function onVisibility() {
      hidden = document.hidden;
    }

    function tick(now) {
      const dt = Math.min(48, now - last);
      last = now;
      const busy =
        hidden ||
        menuPauseRef.current ||
        nudgePauseRef.current ||
        dragRef.current != null ||
        coastRef.current !== 0;
      if (busy) {
        idleMs = 0;
        warmupElapsed = 0;
        carry = 0;
      } else {
        idleMs += dt;
      }
      if (!busy && idleMs >= IDLE_MS) {
        warmupElapsed += dt;
        const max = rail.scrollWidth - rail.clientWidth;
        if (max > 4) {
          const warmup = warmupGain(warmupElapsed);
          const edge = edgeGain(
            rail.scrollLeft,
            max,
            directionRef.current,
          );
          const speed = AUTO_PX_PER_MS * warmup * edge;
          carry += directionRef.current * speed * dt;
          const step = Math.trunc(carry);
          if (step !== 0) {
            carry -= step;
            const next = rail.scrollLeft + step;
            drivingRef.current = true;
            drivenAt.current = performance.now();
            if (next >= max) {
              rail.scrollLeft = max;
              directionRef.current = -1;
              carry = 0;
            } else if (next <= 0) {
              rail.scrollLeft = 0;
              directionRef.current = 1;
              carry = 0;
            } else {
              rail.scrollLeft = next;
            }
            drivingRef.current = false;
          }
        }
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(resumeTimer.current);
      window.cancelAnimationFrame(nudgeAnim.current);
      window.cancelAnimationFrame(coastRef.current);
    };
  }, []);

  function readEdges() {
    const rail = railRef.current;
    if (!rail) return;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const next = {
      atStart: rail.scrollLeft <= 2,
      atEnd: max <= 2 || rail.scrollLeft >= max - 2,
    };
    const prev = edgesRef.current;
    if (prev.atStart === next.atStart && prev.atEnd === next.atEnd) return;
    edgesRef.current = next;
    setEdges(next);
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    readEdges();
    const observer = new ResizeObserver(() => readEdges());
    observer.observe(rail);
    return () => observer.disconnect();
  }, [section.items]);

  function nudge(direction) {
    const rail = railRef.current;
    if (!rail) return;
    window.cancelAnimationFrame(nudgeAnim.current);
    window.cancelAnimationFrame(coastRef.current);
    coastRef.current = 0;
    holdNudge();
    const blade = rail.querySelector('.blade');
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 19;
    const stride = (blade?.getBoundingClientRect().width ?? rail.clientWidth) + gap;
    const count = rail.clientWidth > stride * 1.6 ? 2 : 1;
    const start = rail.scrollLeft;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const target = Math.max(0, Math.min(max, start + direction * stride * count));
    const distance = target - start;
    if (Math.abs(distance) < 2) {
      releaseNudge();
      return;
    }
    const duration = Math.min(560, 280 + Math.abs(distance) * 0.35);
    const began = performance.now();
    drivingRef.current = true;

    function step(now) {
      const t = Math.min(1, (now - began) / duration);
      const eased = 1 - (1 - t) ** 3;
      rail.scrollLeft = start + distance * eased;
      drivenAt.current = now;
      if (t < 1) {
        nudgeAnim.current = window.requestAnimationFrame(step);
        return;
      }
      nudgeAnim.current = 0;
      drivingRef.current = false;
      releaseNudge();
    }

    nudgeAnim.current = window.requestAnimationFrame(step);
  }

  function onPointerDown(event) {
    if (event.target.closest('.blade-arrow')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    window.cancelAnimationFrame(nudgeAnim.current);
    nudgeAnim.current = 0;
    drivingRef.current = false;
    holdNudge();
    if (event.pointerType === 'touch') return;
    const rail = railRef.current;
    if (!rail) return;
    window.cancelAnimationFrame(coastRef.current);
    coastRef.current = 0;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      scroll: rail.scrollLeft,
      moved: false,
      samples: [{ t: performance.now(), scroll: rail.scrollLeft }],
    };
    rail.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    const rail = railRef.current;
    if (!drag || drag.id !== event.pointerId || !rail) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    drag.moved = true;
    rail.scrollLeft = drag.scroll - dx;
    const now = performance.now();
    drag.samples.push({ t: now, scroll: rail.scrollLeft });
    const recent = now - 90;
    while (drag.samples.length > 2 && drag.samples[0].t < recent) {
      drag.samples.shift();
    }
    stageRef.current?.classList.add('is-dragging');
  }

  function coastFrom(velocity) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || Math.abs(velocity) < 0.18) {
      releaseNudge();
      return;
    }
    const rail = railRef.current;
    if (!rail) {
      releaseNudge();
      return;
    }
    let speed = velocity;
    let last = performance.now();
    let previous = rail.scrollLeft;

    function frame(now) {
      const current = railRef.current;
      if (!current || dragRef.current) {
        coastRef.current = 0;
        releaseNudge();
        return;
      }
      const dt = Math.min(32, now - last);
      last = now;
      speed *= Math.exp(-0.006 * dt);
      current.scrollLeft += speed * dt;
      const stuck = Math.abs(current.scrollLeft - previous) < 0.4;
      previous = current.scrollLeft;
      if (stuck || Math.abs(speed) < 0.05) {
        coastRef.current = 0;
        releaseNudge();
        return;
      }
      coastRef.current = window.requestAnimationFrame(frame);
    }

    coastRef.current = window.requestAnimationFrame(frame);
  }

  function onPointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      if (event.target.closest('.blade-arrow')) return;
      releaseNudge();
      return;
    }
    const moved = drag.moved;
    const samples = drag.samples ?? [];
    dragRef.current = null;
    stageRef.current?.classList.remove('is-dragging');
    const rail = railRef.current;
    if (rail?.hasPointerCapture(drag.id)) rail.releasePointerCapture(drag.id);
    if (!moved) {
      releaseNudge();
      return;
    }
    holdNudge();
    const first = samples[0];
    const lastSample = samples[samples.length - 1];
    const dt = lastSample && first ? lastSample.t - first.t : 0;
    const velocity = dt > 16 ? (lastSample.scroll - first.scroll) / dt : 0;
    coastFrom(velocity);
  }

  function onRailScroll() {
    readEdges();
    if (drivingRef.current || performance.now() - drivenAt.current < 40) return;
    if (coastRef.current) {
      holdNudge();
      return;
    }
    holdNudge();
    releaseNudge();
  }

  return (
    <>
      <div className="blade-stage" ref={stageRef}>
        <button
          className={
            edges.atStart ? 'blade-arrow is-prev is-edge' : 'blade-arrow is-prev'
          }
          type="button"
          aria-label={prevLabel}
          aria-hidden={edges.atStart}
          disabled={edges.atStart}
          tabIndex={edges.atStart ? -1 : 0}
          onClick={() => nudge(-1)}
        >
          ‹
        </button>
        <div
          className="blade-rail"
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onScroll={onRailScroll}
        >
          {section.items.map((item) => (
            <Blade
              key={item.id}
              item={item}
              isYours={section.userOnBoard && item.id === section.userRanked?.id}
              variant={item.rank === 1 ? 'champion' : 'field'}
            />
          ))}
        </div>
        <button
          className={
            edges.atEnd ? 'blade-arrow is-next is-edge' : 'blade-arrow is-next'
          }
          type="button"
          aria-label={nextLabel}
          aria-hidden={edges.atEnd}
          disabled={edges.atEnd}
          tabIndex={edges.atEnd ? -1 : 0}
          onClick={() => nudge(1)}
        >
          ›
        </button>
      </div>
    </>
  );
}

function QuestionNote({ note }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function reposition() {
      placeNotePop(rootRef.current, popRef.current);
    }

    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, note]);

  if (!note) return null;

  return (
    <div className="question-note" ref={rootRef}>
      <button
        className="question-note-button"
        type="button"
        aria-expanded={open}
        aria-label={t('results.whyQuestion')}
        onClick={() => setOpen((value) => !value)}
      >
        i
      </button>
      {open ? (
        <p
          ref={popRef}
          className="question-note-pop"
          role="dialog"
          aria-label={t('results.whyQuestion')}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

function filterSummary(section, t) {
  const place =
    section.region.id === 'global' ? t('results.worldRegion') : section.region.name;
  const language = section.language ? ` · ${section.language.name}` : '';
  const count = section.language ? section.responseCount : section.region.votes;
  return t('results.showing', { place, language, count });
}

function PlaceFilter({ regionId, placeIds, onRegion }) {
  const { t } = useI18n();
  const catalog = useSurveyCatalog();
  return (
    <label className="map-select">
      <span>{t('results.filterPlace')}</span>
      <select value={regionId} onChange={(event) => onRegion(event.target.value)}>
        {REGION_GROUPS.map((group) => {
          const ids = group.ids.filter((id) => placeIds.has(id));
          if (!ids.length) return null;
          return (
            <optgroup
              key={group.label}
              label={t(`results.regionGroups.${group.label}`)}
            >
              {ids.map((id) => {
                const region = REGIONS.find((item) => item.id === id);
                const name =
                  id === 'global'
                    ? t('results.worldRegion')
                    : catalog.countriesById.get(id)?.name ?? region.name;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}

function LanguageFilter({ languageId, languageOptions, onLanguage, className = 'map-select' }) {
  const { t } = useI18n();
  const catalog = useSurveyCatalog();
  return (
    <label className={className}>
      <span>{t('results.filterLanguage')}</span>
      <select value={languageId} onChange={(event) => onLanguage(event.target.value)}>
        <option value={ALL_LANGUAGES_ID}>{t('results.allLanguages')}</option>
        {languageOptions.map((language) => (
          <option key={language.id} value={language.id}>
            {catalog.languagesById.get(language.id)?.name ?? language.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Results() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const catalog = useSurveyCatalog();
  const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [regionId, setRegionId] = useState('global');
  const [languageId, setLanguageId] = useState(ALL_LANGUAGES_ID);
  const [sharedAnswers, setSharedAnswers] = useState(null);
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [liveSummary, setLiveSummary] = useState(emptyLiveSummary);
  const codeParam = searchParams.get('code');
  const myResponseId = useMemo(() => readMyResponseId(), []);
  const myAnswers = useMemo(() => readMyAnswers(), []);
  const viewingOther = isResponseId(codeParam) && codeParam !== myResponseId;
  const userAnswers = viewingOther ? sharedAnswers : myAnswers;
  const category = getCategory(categoryId);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/results-live')
      .then(async (result) => {
        if (!result.ok || cancelled) return;
        const body = await result.json();
        if (!cancelled && body && typeof body === 'object') {
          setLiveSummary({ ...emptyLiveSummary(), ...body });
        }
      })
      .catch(() => {
        // keep mock-only view
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const section = useMemo(() => {
    const raw = getSection(category.id, regionId, userAnswers, languageId);
    const blended = applyLiveBlend(raw, category.id, liveSummary, {
      artFor: (id) => VEGETABLE_ART[id] ?? placeholder,
      labelFor: (id) =>
        catalog.vegetablesById?.get(id)?.name
        ?? VEGETABLE_LABELS[id]
        ?? id,
      bandForRank,
    });
    return localizeResultsSection(blended, catalog, t, locale);
  }, [category.id, regionId, userAnswers, languageId, liveSummary, catalog, t, locale]);
  const mixingLive = isMixingLive(liveSummary);
  const languageOptions = useMemo(
    () => languagesForRegion(regionId),
    [regionId],
  );
  const placeIds = useMemo(
    () => new Set(regionsForLanguage(languageId)),
    [languageId],
  );
  const liveCountries = useMemo(() => {
    const mock = LIVE_COUNTRIES
      .filter((country) => placeIds.has(country.id))
      .map((country) => ({
        ...country,
        votes: languageId === ALL_LANGUAGES_ID
          ? country.votes
          : nativeCount(country.id, languageId),
      }));
    const merged = mapCountriesFromLive(mock, liveSummary.places);
    return merged.filter((country) => {
      if (placeIds.has(country.id)) return true;
      // Show emerging live-only countries on the world map.
      return (country.liveCount ?? country.votes ?? 0) > 0
        && (country.votes ?? 0) < VOTE_THRESHOLD;
    });
  }, [placeIds, languageId, liveSummary.places]);
  const nextId = nextCategoryId(category.id);
  const alignment =
    category.layout === 'blades' ? alignmentCopy(section, t) : null;
  const showMap =
    category.layout === 'blades' || category.layout === 'spectrum';
  const bladesRef = useRef(null);

  useEffect(() => {
    if (!isResponseId(codeParam) || codeParam === myResponseId) {
      setSharedAnswers(null);
      setCodeInvalid(false);
      return undefined;
    }
    let cancelled = false;
    fetch(`/api/responses?id=${encodeURIComponent(codeParam)}`)
      .then(async (result) => {
        if (cancelled) return;
        if (!result.ok) {
          setSharedAnswers(null);
          setCodeInvalid(result.status === 404);
          return;
        }
        const body = await result.json();
        if (cancelled) return;
        setCodeInvalid(false);
        setSharedAnswers(body);
        if (body?.id && body.id !== codeParam && isResponseId(body.id)) {
          navigate(
            withLocale(
              locale,
              `/results/${category.id}?code=${encodeURIComponent(body.id)}`,
            ),
            { replace: true },
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSharedAnswers(null);
          setCodeInvalid(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [category.id, codeParam, locale, myResponseId, navigate]);

  useEffect(() => {
    if (categoryId && categoryId !== category.id) {
      navigate(
        withLocale(
          locale,
          codeParam
            ? `/results/first-instincts?code=${encodeURIComponent(codeParam)}`
            : '/results/first-instincts',
        ),
        { replace: true },
      );
    }
  }, [category, categoryId, codeParam, locale, navigate]);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [category.id]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  function goTo(id) {
    if (id === category.id) {
      setMenuOpen(false);
      return;
    }
    const code = searchParams.get('code');
    navigate(
      withLocale(
        locale,
        code
          ? `/results/${id}?code=${encodeURIComponent(code)}`
          : `/results/${id}`,
      ),
    );
  }

  function revealBlades() {
    bladesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectRegion(id) {
    startTransition(() => {
      setRegionId(id);
      setLanguageId((current) => (
        current !== ALL_LANGUAGES_ID
        && id !== 'global'
        && nativeCount(id, current) === 0
          ? ALL_LANGUAGES_ID
          : current
      ));
    });
    revealBlades();
  }

  function selectLanguage(id) {
    startTransition(() => {
      setLanguageId(id);
    });
  }

  return (
    <div className={menuOpen ? 'results-page is-menu-open' : 'results-page'}>
      <header className={
        regionId !== 'global' || languageId !== ALL_LANGUAGES_ID
          ? 'results-topbar is-filtered'
          : 'results-topbar'
      }>
        <div className="results-chrome">
          <button
            className="results-now"
            type="button"
            onClick={() => setMenuOpen(true)}
          >
            {section.title}
          </button>
          <button
            className="results-menu-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="results-drawer"
            aria-label={menuOpen ? t('results.categories.close') : t('results.categories.open')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="results-menu-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
        {regionId !== 'global' || languageId !== ALL_LANGUAGES_ID ? (
          <p className="results-region-status">
            {filterSummary(section, t)}
            {regionId !== 'global' ? (
              <>
                {' · '}
                <button
                  className="map-clear"
                  type="button"
                  onClick={() => selectRegion('global')}
                >
                  {t('results.showWorld')}
                </button>
              </>
            ) : null}
            {languageId !== ALL_LANGUAGES_ID ? (
              <>
                {' · '}
                <button
                  className="map-clear"
                  type="button"
                  onClick={() => selectLanguage(ALL_LANGUAGES_ID)}
                >
                  {t('results.allLanguages')}
                </button>
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      {menuOpen ? (
        <button
          className="results-menu-backdrop"
          type="button"
          aria-label={t('results.categories.close')}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={menuOpen ? 'results-drawer is-open' : 'results-drawer'}
        id="results-drawer"
        inert={menuOpen ? undefined : true}
      >
        <div className="results-nav-head">
          <p className="results-nav-kicker">{t('results.categories.label')}</p>
          <LocaleSwitcher className="locale-switcher--inline" />
        </div>
        <p className="results-nav-meta">
          {t('results.categories.mockMeta', {
            count: section.responseCount.toLocaleString(numberLocale),
          })}
        </p>
        {mixingLive ? (
          <p className="results-mix-note">{t('results.mixDisclaimer')}</p>
        ) : null}
        <nav className="results-tabs" aria-label={t('results.categories.nav')}>
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === category.id ? 'results-tab is-active' : 'results-tab'
              }
              onClick={() => goTo(item.id)}
            >
              {t(`results.categories.${item.id}.title`)}
            </button>
          ))}
        </nav>
        <div className="results-menu-filters">
          {regionId !== 'global' || languageId !== ALL_LANGUAGES_ID ? (
            <p className="results-menu-status">{filterSummary(section, t)}</p>
          ) : null}
          <PlaceFilter
            regionId={regionId}
            placeIds={placeIds}
            onRegion={selectRegion}
          />
          <LanguageFilter
            languageId={languageId}
            languageOptions={languageOptions}
            onLanguage={selectLanguage}
          />
        </div>
        <Link className="results-home-link" to={withLocale(locale, '/')} onClick={() => setMenuOpen(false)}>
          {t('results.categories.backHome')}
        </Link>
        <ReportIssuesButton className="results-report-btn" variant="drawer" />
      </aside>

      <main className="results-main">
        <section className="results-section">
          <header className="results-section-head">
            <div className="eyebrow">
              {section.eyebrow}
              <QuestionNote key={category.id} note={section.designNote} />
            </div>
            <h1 className="results-section-title">{section.title}</h1>
            <p className="results-section-prompt">{section.prompt}</p>
          </header>

          {category.layout === 'buckets' ? (
            <BucketColumns section={section} />
          ) : category.layout === 'reasons' ? (
            <ReasonResults section={section} viewingOwn={!viewingOther} />
          ) : category.layout === 'spectrum' ? (
            <div className="blade-anchor" ref={bladesRef}>
              <SpectrumList
                key={`${category.id}-${regionId}-${languageId}`}
                section={section}
              />
            </div>
          ) : category.layout === 'notes' ? (
            <NoteResults section={section} viewingOwn={!viewingOther} />
          ) : (
            <div className="blade-anchor" ref={bladesRef}>
              <RankRail
                key={`${category.id}-${regionId}-${languageId}`}
                section={section}
                pauseAutoplay={menuOpen}
              />
            </div>
          )}

          {alignment ? (
            <div className="alignment-wrap">
              <div className="alignment-card">
                {alignment.kicker ? (
                  <p className={`alignment-kicker is-${alignment.tone}`}>
                    {alignment.kicker}
                  </p>
                ) : null}
                <p className="alignment-body">
                  {t('results.youVotedFor')}{' '}
                  <strong className={`alignment-var is-${alignment.tone}`}>
                    {alignment.name}
                  </strong>
                  .{alignment.connector ? ` ${alignment.connector}` : ''}{' '}
                  <strong className={`alignment-var is-${alignment.tone}`}>
                    {alignment.outcome}
                  </strong>
                  .
                </p>
              </div>
            </div>
          ) : null}

          {showMap ? (
          <div className="map-panel">
            <div className="map-panel-head">
              <div>
                <p className="eyebrow">{t('results.byPlace')}</p>
                <h2 className="map-title">{t('results.mapTitle')}</h2>
                <p className="map-copy">{t('results.mapCopy')}</p>
              </div>
              <PlaceFilter
                regionId={regionId}
                placeIds={placeIds}
                onRegion={selectRegion}
              />
            </div>
            <Suspense fallback={null}>
              <WorldMap
                selectedId={regionId}
                onSelect={selectRegion}
                liveCountries={liveCountries}
                languageFiltered={languageId !== ALL_LANGUAGES_ID}
              />
            </Suspense>
            <LanguageFilter
              className="map-select map-language"
              languageId={languageId}
              languageOptions={languageOptions}
              onLanguage={selectLanguage}
            />
            <p className="map-status">
              {t('results.mapStatus', {
                place: section.region.name,
                language: section.language ? ` · ${section.language.name}` : '',
                count: section.responseCount,
              })}
              {regionId !== 'global' ? (
                <>
                  {' · '}
                  <button
                    className="map-clear"
                    type="button"
                    onClick={() => selectRegion('global')}
                  >
                    {t('results.showWorld')}
                  </button>
                </>
              ) : null}
              {languageId !== ALL_LANGUAGES_ID ? (
                <>
                  {' · '}
                  <button
                    className="map-clear"
                    type="button"
                    onClick={() => selectLanguage(ALL_LANGUAGES_ID)}
                  >
                    {t('results.allLanguages')}
                  </button>
                </>
              ) : null}
            </p>
            {mixingLive ? (
              <p className="results-mix-note map-mix-note">
                {t('results.mixDisclaimer')}
              </p>
            ) : null}
          </div>
          ) : null}

          {nextId ? (
            <div className="results-next-wrap">
              <button
                className="results-next"
                type="button"
                onClick={() => goTo(nextId)}
              >
                {t('results.categories.next')}
              </button>
            </div>
          ) : (
            <div className="results-next-wrap results-next-stack">
              <Link className="results-next" to={withLocale(locale, '/')}>
                {t('results.categories.backHome')}
              </Link>
              <a
                className="results-next is-quiet"
                href="https://glimpsegaze.com"
                target="_blank"
                rel="noreferrer"
              >
                {t('results.categories.otherProjects')}
              </a>
            </div>
          )}

          <div className="results-survey-foot">
            {myResponseId ? null : (
              <SurveyNudge kind="vote" onThisMachine={viewingOther} />
            )}
            <ResponseCodeCard
              code={viewingOther ? codeParam : myResponseId}
              categoryId={category.id}
              viewingOther={viewingOther}
              invalid={codeInvalid}
            />
          </div>
          <BrandFooter className="brand-footer--results" />
        </section>
      </main>
      <ReportIssuesButton variant="fab" />
    </div>
  );
}
