import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESULTS_MOCK } from '../data/resultsMock.js';
import '../styles/results.css';

const VISIBLE_LEADERS = 5;
const AUTO_PX_PER_MS = 0.038;
const RESUME_MS = 2800;
const DRAG_THRESHOLD = 6;

function formatVotes(n) {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? 'vote' : 'votes'}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function alignmentCopy(section) {
  const picked = section.items.find((item) => item.id === section.userVoteId);
  if (!picked) return null;

  const same = formatShare(picked.share);
  const itemCount = section.items.length;

  if (picked.rank === 1) {
    return {
      kicker: 'You picked the leader',
      body: `Your answer was ${picked.name}. ${same} of respondents said the same — rank #1 of ${itemCount}.`,
    };
  }

  const minority = picked.share < 0.05;
  return {
    kicker: minority
      ? `Your vote is in a ${same} minority`
      : `${same} of people answered with you`,
    body: `You said ${picked.name}. That places you at rank #${picked.rank} of ${itemCount}.`,
  };
}

function Blade({ item, isYours, leaderShare, variant }) {
  const fill = Math.max(8, (item.share / leaderShare) * 100);

  return (
    <article
      className={[
        'blade',
        variant === 'champion' ? 'is-champion' : '',
        variant === 'outlier' ? 'is-outlier' : '',
        isYours ? 'is-yours' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-blade={item.id}
    >
      <img src={item.art} alt="" draggable={false} />
      <div className="blade-scrim" />
      <div className="blade-copy">
        <div className="blade-topline">
          <span className="blade-rank">#{item.rank}</span>
          {isYours ? <span className="blade-badge">Your vote</span> : null}
        </div>
        <h3 className="blade-name">{item.name}</h3>
        <p className="blade-meta">
          {formatVotes(item.votes)} · {formatShare(item.share)}
        </p>
      </div>
      <div className="blade-meter" aria-hidden="true">
        <span style={{ width: `${fill}%` }} />
      </div>
    </article>
  );
}

function RankSection({ section, pauseAutoplay }) {
  const railRef = useRef(null);
  const stageRef = useRef(null);
  const menuPauseRef = useRef(false);
  const dragRef = useRef(null);
  const nudgePauseRef = useRef(false);
  const directionRef = useRef(1);
  const resumeTimer = useRef(0);
  const leaderShare = section.items[0]?.share ?? 1;
  const userItem = section.items.find((item) => item.id === section.userVoteId);
  const userOutsideLeaders = userItem && userItem.rank > VISIBLE_LEADERS;
  const alignment = alignmentCopy(section);

  function holdNudge() {
    nudgePauseRef.current = true;
    window.clearTimeout(resumeTimer.current);
  }

  function releaseNudge() {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      nudgePauseRef.current = false;
    }, RESUME_MS);
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
    let frame = 0;

    function tick(now) {
      const dt = Math.min(48, now - last);
      last = now;
      const dragging = dragRef.current != null;
      if (!menuPauseRef.current && !nudgePauseRef.current && !dragging) {
        const max = rail.scrollWidth - rail.clientWidth;
        if (max > 4) {
          carry += directionRef.current * AUTO_PX_PER_MS * dt;
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
    <section className="results-section" id={section.id} tabIndex={-1}>
      <header className="results-section-head">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="results-section-title">{section.title}</h2>
        <p className="results-section-prompt">{section.prompt}</p>
        {alignment ? (
          <div className="alignment-card">
            <p className="alignment-kicker">{alignment.kicker}</p>
            <p className="alignment-body">{alignment.body}</p>
          </div>
        ) : null}
      </header>

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
              leaderShare={leaderShare}
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
            leaderShare={leaderShare}
            variant="outlier"
          />
        </div>
      ) : null}
    </section>
  );
}

export function Results() {
  const [activeId, setActiveId] = useState(RESULTS_MOCK.sections[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection =
    RESULTS_MOCK.sections.find((section) => section.id === activeId) ??
    RESULTS_MOCK.sections[0];

  useEffect(() => {
    const nodes = RESULTS_MOCK.sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (nodes.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  function jumpTo(id) {
    setActiveId(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={menuOpen ? 'results-page is-menu-open' : 'results-page'}>
      <div className="results-chrome">
        <button
          className="results-now"
          type="button"
          onClick={() => setMenuOpen(true)}
        >
          {activeSection.title}
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
          Mock standings · {RESULTS_MOCK.responseCount.toLocaleString('en-GB')}{' '}
          answers
        </p>
        <nav className="results-tabs" aria-label="Results categories">
          {RESULTS_MOCK.sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={
                activeId === section.id ? 'results-tab is-active' : 'results-tab'
              }
              onClick={() => jumpTo(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>
        <Link className="results-home-link" to="/" onClick={() => setMenuOpen(false)}>
          Back to the foyer
        </Link>
      </aside>

      <div className="results-main">
        {RESULTS_MOCK.sections.map((section) => (
          <RankSection
            key={section.id}
            section={section}
            pauseAutoplay={menuOpen}
          />
        ))}
      </div>
    </div>
  );
}
