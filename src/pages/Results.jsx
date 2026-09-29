import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorldMap } from '../components/Results/WorldMap.jsx';
import { BucketColumns } from '../components/Results/BucketColumns.jsx';
import { ReasonResults } from '../components/Results/ReasonResults.jsx';
import { SpectrumList } from '../components/Results/SpectrumList.jsx';
import {
  CATEGORIES,
  getCategory,
  getSection,
  nextCategoryId,
  REGION_GROUPS,
  REGIONS,
  VEGETABLE_LABELS,
} from '../data/resultsMock.js';
import '../styles/results.css';

const VISIBLE_LEADERS = 5;
const AUTO_PX_PER_MS = 0.048;
const DRAG_THRESHOLD = 6;
const IDLE_MS = 5000;
const NUDGE_SETTLE_MS = 450;
const WARMUP_MS = 4000;
const EDGE_PX = 110;
const EDGE_FLOOR = 0.64;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function warmupGain(elapsed) {
  const t = clamp01(elapsed / WARMUP_MS);
  if (t <= 0.1) {
    const u = t / 0.1;
    return 0.05 * u * u * u * u;
  }
  const u = (t - 0.1) / 0.9;
  return 0.05 + 0.95 * (u * u);
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

function formatVotes(n) {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? 'vote' : 'votes'}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function ordinal(n) {
  const remainder = n % 100;
  if (remainder >= 11 && remainder <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function placeLabel(region) {
  if (region.id === 'global') return 'worldwide';
  if (region.kind === 'continent') return `in ${region.name}`;
  return `in ${region.name}`;
}

function alignmentTone(rank) {
  if (!rank) return 'lose';
  if (rank === 1) return 'win';
  return 'place';
}

function alignmentCopy(section) {
  const picked = section.items.find((item) => item.id === section.userVoteId);
  const name = picked?.name ?? VEGETABLE_LABELS[section.userVoteId];
  if (!name) return null;

  const place = placeLabel(section.region);
  if (!picked) {
    return {
      kicker: `${formatShare(0)} of people voted with you`,
      name,
      tone: 'lose',
      connector: 'It',
      outcome: `hasn't made this list ${place}`,
    };
  }

  const onTheList = picked.rank <= VISIBLE_LEADERS;
  const votedWithYou = `${formatShare(picked.share)} of people voted with you`;

  return {
    kicker: onTheList ? votedWithYou : `Only ${votedWithYou}`,
    name,
    tone: alignmentTone(picked.rank),
    connector: 'It is',
    outcome:
      picked.rank === 1
        ? `leading ${place}`
        : `${ordinal(picked.rank)} ${place}`,
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
        {isYours ? <span className="blade-badge">Your vote</span> : null}
        <img src={item.art} alt="" draggable={false} />
        <div className="blade-scrim" />
        <div className="blade-copy">
          <div className="blade-topline">
            <span className="blade-rank">#{item.rank}</span>
          </div>
          <h3 className="blade-name">{item.name}</h3>
          <p className="blade-meta">
            {formatVotes(item.votes)} · {formatShare(item.share)}
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
  const railRef = useRef(null);
  const stageRef = useRef(null);
  const menuPauseRef = useRef(false);
  const dragRef = useRef(null);
  const nudgePauseRef = useRef(false);
  const directionRef = useRef(1);
  const resumeTimer = useRef(0);
  const userItem = section.items.find((item) => item.id === section.userVoteId);
  const userOutsideLeaders = userItem && userItem.rank > VISIBLE_LEADERS;

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

    function tick(now) {
      const dt = Math.min(48, now - last);
      last = now;
      const dragging = dragRef.current != null;
      const busy =
        menuPauseRef.current || nudgePauseRef.current || dragging;
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
          }
        }
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(resumeTimer.current);
  }, []);

  function nudge(direction) {
    const rail = railRef.current;
    if (!rail) return;
    holdNudge();
    const step = Math.round(rail.clientWidth * 0.72);
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
    releaseNudge();
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.blade-arrow')) return;
    const rail = railRef.current;
    if (!rail) return;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      scroll: rail.scrollLeft,
      moved: false,
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
    stageRef.current?.classList.add('is-dragging');
  }

  function endDrag(event) {
    const drag = dragRef.current;
    const rail = railRef.current;
    if (!drag || (event && drag.id !== event.pointerId)) return;
    const moved = drag.moved;
    dragRef.current = null;
    stageRef.current?.classList.remove('is-dragging');
    if (rail?.hasPointerCapture(drag.id)) {
      rail.releasePointerCapture(drag.id);
    }
    if (moved) {
      holdNudge();
      releaseNudge();
    }
  }

  return (
    <>
      <div className="blade-stage" ref={stageRef}>
        <button
          className="blade-arrow is-prev"
          type="button"
          aria-label="Previous vegetables"
          onClick={() => nudge(-1)}
        >
          ‹
        </button>
        <div
          className="blade-rail"
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {section.items.map((item) => (
            <Blade
              key={item.id}
              item={item}
              isYours={item.id === section.userVoteId}
              variant={item.rank === 1 ? 'champion' : 'field'}
            />
          ))}
        </div>
        <button
          className="blade-arrow is-next"
          type="button"
          aria-label="Next vegetables"
          onClick={() => nudge(1)}
        >
          ›
        </button>
      </div>
      {userOutsideLeaders ? (
        <div className="outlier-row">
          <p className="outlier-label">Your pick sits outside the leading five</p>
          <Blade
            item={userItem}
            isYours
            variant="outlier"
          />
        </div>
      ) : null}
    </>
  );
}

export function Results() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [regionId, setRegionId] = useState('global');
  const category = getCategory(categoryId);
  const section = useMemo(
    () => getSection(category.id, regionId),
    [category.id, regionId],
  );
  const nextId = nextCategoryId(category.id);
  const alignment =
    category.layout === 'blades' ? alignmentCopy(section) : null;
  const showMap =
    category.layout === 'blades' || category.layout === 'spectrum';
  const bladesRef = useRef(null);

  useEffect(() => {
    if (categoryId && categoryId !== category.id) {
      navigate('/results/first-instincts', { replace: true });
    }
  }, [category, categoryId, navigate]);

  useEffect(() => {
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
    setMenuOpen(false);
    navigate(`/results/${id}`);
  }

  function revealBlades() {
    bladesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectRegion(id) {
    setRegionId(id);
    revealBlades();
  }

  return (
    <div className={menuOpen ? 'results-page is-menu-open' : 'results-page'}>
      <div className="results-chrome">
        <button
          className="results-now"
          type="button"
          onClick={() => setMenuOpen(true)}
        >
          {category.title}
        </button>
        <button
          className="results-menu-btn"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="results-drawer"
          aria-label={menuOpen ? 'Close categories' : 'Open categories'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="results-menu-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      {regionId !== 'global' ? (
        <p className="results-region-status">
          Showing {section.region.name} · {section.region.votes} answers
          {' · '}
          <button
            className="map-clear"
            type="button"
            onClick={() => selectRegion('global')}
          >
            Show the world
          </button>
        </p>
      ) : null}

      {menuOpen ? (
        <button
          className="results-menu-backdrop"
          type="button"
          aria-label="Close categories"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={menuOpen ? 'results-drawer is-open' : 'results-drawer'}
        id="results-drawer"
        aria-hidden={menuOpen ? undefined : true}
      >
        <p className="results-nav-kicker">Categories</p>
        <p className="results-nav-meta">
          Mock standings · {section.responseCount.toLocaleString('en-GB')}{' '}
          answers
        </p>
        <nav className="results-tabs" aria-label="Results categories">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === category.id ? 'results-tab is-active' : 'results-tab'
              }
              onClick={() => goTo(item.id)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <Link className="results-home-link" to="/" onClick={() => setMenuOpen(false)}>
          Back to the main page
        </Link>
      </aside>

      <div className="results-main">
        <section className="results-section">
          <header className="results-section-head">
            <p className="eyebrow">{section.eyebrow}</p>
            <h1 className="results-section-title">{section.title}</h1>
            <p className="results-section-prompt">{section.prompt}</p>
          </header>

          {category.layout === 'buckets' ? (
            <BucketColumns section={section} />
          ) : category.layout === 'reasons' ? (
            <ReasonResults section={section} />
          ) : category.layout === 'spectrum' ? (
            <div className="blade-anchor" ref={bladesRef}>
              <SpectrumList
                key={`${category.id}-${regionId}`}
                section={section}
              />
            </div>
          ) : (
            <div className="blade-anchor" ref={bladesRef}>
              <RankRail
                key={`${category.id}-${regionId}`}
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
                  You voted for{' '}
                  <strong className={`alignment-var is-${alignment.tone}`}>
                    {alignment.name}
                  </strong>
                  . {alignment.connector}{' '}
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
                <p className="eyebrow">By place</p>
                <h2 className="map-title">Where people answered from</h2>
                <p className="map-copy">
                  Default is the whole set, including people who preferred not
                  to disclose a place. Highlighted countries have at least 20
                  answers. Continent views include every country there, plus
                  people who named the continent itself.
                </p>
              </div>
              <label className="map-select">
                <span>Filter by place</span>
                <select
                  value={regionId}
                  onChange={(event) => selectRegion(event.target.value)}
                >
                  {REGION_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.ids.map((id) => {
                        const region = REGIONS.find((item) => item.id === id);
                        return (
                          <option key={id} value={id}>
                            {region.name}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
            <WorldMap selectedId={regionId} onSelect={selectRegion} />
            <p className="map-status">
              Showing {section.region.name} · {section.responseCount} answers
              {regionId !== 'global' ? (
                <>
                  {' · '}
                  <button
                    className="map-clear"
                    type="button"
                    onClick={() => selectRegion('global')}
                  >
                    Show the world
                  </button>
                </>
              ) : null}
            </p>
          </div>
          ) : null}

          {nextId ? (
            <div className="results-next-wrap">
              <button
                className="results-next"
                type="button"
                onClick={() => goTo(nextId)}
              >
                Next category
              </button>
            </div>
          ) : (
            <div className="results-next-wrap">
              <Link className="results-next is-quiet" to="/">
                Back to the main page
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
