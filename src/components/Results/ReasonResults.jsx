import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import {
  COMMENT_DISPLAY_COUNT,
  layoutCommentRows,
  rankComments,
} from '../../data/reasonResults.js';
import { useI18n } from '../../i18n/useI18n.js';
import {
  applyMyAnswerToRows,
  readMyCustomReason,
} from '../../utils/myCustomReason.js';
import { readMyResponseId } from '../../utils/myResponse.js';
import { SurveyNudge } from './SurveyGate.jsx';

const MY_VOTES_KEY = 'veg-survey-reason-votes';
const TAP_MS = 280;
const HOLD_MS = 500;
const HOLD_MOVE_PX = 10;
const MAX_LIKES = 5;
const MAX_DISLIKES = 5;
const PUFF_MS = 900;

function formatVotes(n, t, numberLocale) {
  return `${n.toLocaleString(numberLocale)} ${n === 1 ? t('results.vote') : t('results.votes')}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function votesKey(locale) {
  return `${MY_VOTES_KEY}:${locale || 'en'}`;
}

function readMyVotes(locale) {
  try {
    const raw = localStorage.getItem(votesKey(locale));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMyVotes(votes, locale) {
  try {
    localStorage.setItem(votesKey(locale), JSON.stringify(votes));
  } catch {
    // private mode
  }
}

function nextFromSingleTap(current) {
  if (current === 1 || current === -1) return 0;
  return 1;
}

function nextFromRightClick(current) {
  if (current === -1) return 0;
  return -1;
}

function nextFromDoubleTap(current) {
  if (current === -1) return 1;
  return -1;
}

function canSetVote(votes, commentId, nextValue) {
  if (nextValue === 0) return true;
  const current = votes[commentId] ?? 0;
  if (current === nextValue) return true;
  const used = Object.entries(votes).filter(
    ([id, entry]) => id !== commentId && entry === nextValue,
  ).length;
  return used < (nextValue === 1 ? MAX_LIKES : MAX_DISLIKES);
}

function netsFromScores(scores) {
  return Object.fromEntries(
    Object.entries(scores).map(([id, entry]) => [id, entry.net ?? 0]),
  );
}

function snapshotRows(pool, nets = {}, myText = '', pinMine = true) {
  const rows = layoutCommentRows(rankComments(pool, nets), COMMENT_DISPLAY_COUNT);
  return pinMine ? applyMyAnswerToRows(rows, myText) : rows;
}

function pointFromEvent(event) {
  if (typeof event?.clientX === 'number' && typeof event?.clientY === 'number') {
    return { x: event.clientX, y: event.clientY };
  }
  const box = event?.currentTarget?.getBoundingClientRect?.();
  if (box) {
    return { x: box.left + box.width / 2, y: box.top };
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

function DriftRow({ row, leading = false, myVotes, canVote, onVote, onHoldStart, onHoldMove, onHoldEnd }) {
  const { t } = useI18n();
  const loop = [...row.items, ...row.items];

  return (
    <div
      className={[
        'reason-drift-row',
        row.reverse ? 'is-reverse' : '',
        leading ? 'is-leading' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--drift-duration': row.duration }}
    >
      {loop.map((item, index) => {
        const mine = myVotes[item.id] ?? 0;
        return (
          <button
            key={`${row.id}-${item.id}-${index}`}
            type="button"
            className={[
              'reason-chip',
              mine === 1 ? 'is-liked' : '',
              mine === -1 ? 'is-disliked' : '',
              item.isMine ? 'is-mine' : '',
              canVote ? '' : 'is-locked',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={!canVote}
            data-comment-id={item.id}
            data-boosts={item.score}
            aria-pressed={mine === 1}
            aria-label={t('results.reasons.voteAria', {
              text: item.text,
              mine: item.isMine ? t('results.yourAnswerPeriod') : '',
              state:
                mine === 1
                  ? t('results.reasons.liked')
                  : mine === -1
                    ? t('results.reasons.sunk')
                    : t('results.reasons.notVoted'),
            })}
            onPointerDown={(event) => {
              if (!canVote) return;
              onHoldStart(event, item.id);
            }}
            onPointerMove={(event) => {
              if (!canVote) return;
              onHoldMove(event);
            }}
            onPointerUp={(event) => {
              if (!canVote) return;
              onHoldEnd();
              onVote(event, item.id);
            }}
            onPointerCancel={() => {
              if (!canVote) return;
              onHoldEnd();
            }}
            onContextMenu={(event) => {
              if (!canVote) return;
              onVote(event, item.id);
            }}
            onKeyDown={(event) => {
              if (!canVote) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onVote(event, item.id);
              }
            }}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}

function rateGesture(t) {
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;
  return coarse
    ? t('results.reasons.gestureCoarse')
    : t('results.reasons.gestureFine');
}

export function ReasonResults({ section, viewingOwn = true }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const responseId = useMemo(() => readMyResponseId(), []);
  const canVote = Boolean(responseId);
  const myReason = useMemo(
    () => (viewingOwn ? readMyCustomReason() : ''),
    [viewingOwn],
  );
  const pool = section.commentPool ?? [];
  const [myVotes, setMyVotes] = useState(() => readMyVotes(locale));
  const [resetDone, setResetDone] = useState(false);
  const resetFlash = useRef(0);
  const [rows, setRows] = useState(() =>
    snapshotRows(pool, {}, myReason, viewingOwn),
  );
  const tapTimer = useRef(0);
  const tapTarget = useRef(null);
  const tapPoint = useRef(null);
  const [capTip, setCapTip] = useState(null);
  const capTipTimer = useRef(0);
  const [puff, setPuff] = useState(null);
  const puffTimer = useRef(0);
  const layoutLocked = useRef(false);
  const sinkGuard = useRef({ id: null, at: 0 });
  const holdTimer = useRef(0);
  const holdFired = useRef(false);
  const holdOrigin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    layoutLocked.current = false;
    setMyVotes(readMyVotes(locale));
    setRows(snapshotRows(pool, {}, myReason, viewingOwn));

    async function loadSnapshot() {
      try {
        const result = await fetch('/api/reason-votes');
        if (!result.ok) return;
        const body = await result.json();
        if (cancelled || layoutLocked.current || !body?.scores) return;
        startTransition(() => {
          setRows(
            snapshotRows(pool, netsFromScores(body.scores), myReason, viewingOwn),
          );
        });
      } catch {
        // keep the seed snapshot
      } finally {
        if (!cancelled) layoutLocked.current = true;
      }
    }

    const idle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback(() => loadSnapshot(), { timeout: 1200 })
        : window.setTimeout(loadSnapshot, 280);
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
    };
  }, [pool, myReason, viewingOwn, locale]);

  useEffect(
    () => () => {
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      if (capTipTimer.current) window.clearTimeout(capTipTimer.current);
      if (puffTimer.current) window.clearTimeout(puffTimer.current);
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    },
    [],
  );

  function clampPoint(point, tip = false) {
    const pad = 16;
    const half = tip ? Math.min(128, (window.innerWidth - 32) / 2) : 0;
    return {
      x: Math.min(
        window.innerWidth - pad - half,
        Math.max(pad + half, point?.x ?? window.innerWidth / 2),
      ),
      y: Math.min(
        window.innerHeight - pad,
        Math.max(pad + (tip ? 64 : 0), point?.y ?? window.innerHeight / 2),
      ),
    };
  }

  function showCapTip(kind, point) {
    const { x, y } = clampPoint(point, true);
    setCapTip({ id: Date.now(), kind, x, y });
    if (capTipTimer.current) window.clearTimeout(capTipTimer.current);
    capTipTimer.current = window.setTimeout(() => setCapTip(null), 1800);
  }

  function showPuff(delta, point) {
    const { x, y } = clampPoint(point);
    setPuff({ id: Date.now(), delta, x, y });
    if (puffTimer.current) window.clearTimeout(puffTimer.current);
    puffTimer.current = window.setTimeout(() => setPuff(null), PUFF_MS);
  }

  function applyVote(commentId, nextValue, point) {
    if (!responseId) return;
    const votesNow = readMyVotes(locale);
    const previous = votesNow[commentId] ?? 0;
    if (previous === nextValue) return;
    if (!canSetVote(votesNow, commentId, nextValue)) {
      if (nextValue === 1 || nextValue === -1) {
        showCapTip(nextValue === 1 ? 'like' : 'dislike', point);
      }
      return;
    }

    const votes = { ...votesNow };
    if (nextValue === 0) delete votes[commentId];
    else votes[commentId] = nextValue;
    writeMyVotes(votes, locale);
    setMyVotes(votes);
    layoutLocked.current = true;
    if (nextValue === 1 || nextValue === -1) {
      showPuff(nextValue, point);
    }

    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentId,
        responseId,
        value: nextValue,
      }),
    }).catch(() => {
      // markings already applied locally
    });
  }

  function releaseReset(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      return;
    }
    resetVotes();
  }

  function resetVotes() {
    const votesNow = readMyVotes(locale);
    if (!Object.keys(votesNow).length) return;

    writeMyVotes({}, locale);
    setMyVotes({});
    setResetDone(true);
    window.clearTimeout(resetFlash.current);
    resetFlash.current = window.setTimeout(() => setResetDone(false), 1400);
    layoutLocked.current = true;

    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseId,
        reset: true,
        family: 'reasons',
      }),
    }).catch(() => {
      // markings already cleared locally
    });
  }

  function clearHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = 0;
  }

  function onHoldStart(event, commentId) {
    if (event.button != null && event.button !== 0) return;
    holdFired.current = false;
    clearHold();
    holdOrigin.current = {
      x: event.clientX ?? 0,
      y: event.clientY ?? 0,
    };
    const point = pointFromEvent(event);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = 0;
      holdFired.current = true;
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      applyVote(commentId, -1, point);
      sinkGuard.current = {
        id: commentId,
        at: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      };
    }, HOLD_MS);
  }

  function onHoldMove(event) {
    if (!holdTimer.current) return;
    const dx = (event.clientX ?? 0) - holdOrigin.current.x;
    const dy = (event.clientY ?? 0) - holdOrigin.current.y;
    if (dx * dx + dy * dy > HOLD_MOVE_PX * HOLD_MOVE_PX) {
      clearHold();
    }
  }

  function onHoldEnd() {
    clearHold();
  }

  function onVote(event, commentId) {
    event.preventDefault?.();
    event.stopPropagation?.();

    if (event.type === 'pointerup' && holdFired.current) {
      holdFired.current = false;
      return;
    }

    const point = pointFromEvent(event);

    if (event.type === 'keydown') {
      const current = readMyVotes(locale)[commentId] ?? 0;
      applyVote(commentId, nextFromSingleTap(current), point);
      return;
    }

    const isRightClick =
      event.type === 'contextmenu' || event.button === 2;
    if (isRightClick) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (
        sinkGuard.current.id === commentId &&
        now - sinkGuard.current.at < 400
      ) {
        return;
      }
      sinkGuard.current = { id: commentId, at: now };
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes(locale)[commentId] ?? 0;
      applyVote(commentId, nextFromRightClick(current), point);
      return;
    }

    if (event.button != null && event.button !== 0) return;

    const isSecondTap =
      tapTimer.current && tapTarget.current === commentId;

    if (isSecondTap) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes(locale)[commentId] ?? 0;
      applyVote(commentId, nextFromDoubleTap(current), point);
      return;
    }

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTarget.current = commentId;
    tapPoint.current = point;
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes(locale)[commentId] ?? 0;
      applyVote(commentId, nextFromSingleTap(current), tapPoint.current);
    }, TAP_MS);
  }

  return (
    <div className="reason-results">
      <div className="bucket-results is-single">
        <article className="bucket-card">
          <header className="bucket-card-head">
            <p className="bucket-card-kicker">{t('results.top5')}</p>
            <h2 className="bucket-card-title">{t('results.reasons.title')}</h2>
            {section.leader ? (
              <p className="bucket-card-summary">
                {formatShare(section.leader.share)}
                {t('results.reasons.marked')}
                <strong>{section.leader.name}</strong>
              </p>
            ) : null}
          </header>
          <ol className="bucket-list">
            {section.items.map((item) => (
              <li
                key={item.id}
                className={[
                  'bucket-row',
                  item.rank === 1 ? 'is-leader' : '',
                  item.isYours ? 'is-yours' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="bucket-row-rank">#{item.rank}</span>
                <div className="bucket-row-body">
                  <div className="bucket-row-topline">
                    <strong className="bucket-row-name">{item.name}</strong>
                    {item.isYours ? (
                      <span className="bucket-row-badge">{t('results.yourVote')}</span>
                    ) : null}
                    </div>
                    <p className="bucket-row-meta">
                      {formatVotes(item.votes, t, numberLocale)} · {formatShare(item.share)}
                    </p>
                  <div className="bucket-row-meter" aria-hidden="true">
                    <span style={{ width: `${item.share * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </div>

      <div className="reason-drift-wrap">
        <h2 className="reason-drift-title">
          {t('results.reasons.customTitle')}
          <span className="reason-drift-locale">
            {' '}
            {t('results.reasons.localeFlair')}
          </span>
        </h2>
        {canVote ? null : <SurveyNudge kind="vote" />}
        <div className="reason-drift" aria-label={t('results.reasons.customAria')}>
          {rows.map((row, index) => (
            <DriftRow
              key={row.id}
              row={row}
              leading={index === 0}
              myVotes={myVotes}
              canVote={canVote}
              onVote={onVote}
              onHoldStart={onHoldStart}
              onHoldMove={onHoldMove}
              onHoldEnd={onHoldEnd}
            />
          ))}
        </div>
        {canVote ? (
          <>
            <p className="reason-drift-hint">
              {t('results.reasons.hint', { gesture: rateGesture(t) })}
            </p>
            <div className="reason-reset-row">
              <button
                className={resetDone ? 'reason-reset is-cleared' : 'reason-reset'}
                type="button"
                disabled={!Object.keys(myVotes).length && !resetDone}
                onClick={resetVotes}
                onPointerUp={releaseReset}
                onContextMenu={(event) => event.preventDefault()}
              >
                {resetDone ? t('results.reasons.cleared') : t('results.reasons.reset')}
              </button>
              <p className="reason-reset-tip">{t('results.reasons.resetTip')}</p>
            </div>
          </>
        ) : null}
      </div>
      {puff ? (
        <p
          key={puff.id}
          className={`reason-puff ${puff.delta === 1 ? 'is-up' : 'is-down'}`}
          style={{ left: puff.x, top: puff.y }}
          role="status"
        >
          {puff.delta === 1 ? '+1' : '−1'}
        </p>
      ) : null}
      {capTip ? (
        <p
          key={capTip.id}
          className="reason-cap-tip"
          style={{ left: capTip.x, top: capTip.y }}
          role="status"
        >
          {capTip.kind === 'like'
            ? t('results.reasons.likeCap')
            : t('results.reasons.dislikeCap')}
        </p>
      ) : null}
    </div>
  );
}
