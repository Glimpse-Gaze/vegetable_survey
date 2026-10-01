import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COMMENT_DISPLAY_COUNT,
  layoutCommentRows,
  rankComments,
} from '../../data/reasonResults.js';
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

function formatVotes(n) {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? 'vote' : 'votes'}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function readMyVotes() {
  try {
    const raw = localStorage.getItem(MY_VOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMyVotes(votes) {
  try {
    localStorage.setItem(MY_VOTES_KEY, JSON.stringify(votes));
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

function DriftRow({ row, myVotes, canVote, onVote, onHoldStart, onHoldMove, onHoldEnd }) {
  const loop = [...row.items, ...row.items];

  return (
    <div
      className={row.reverse ? 'reason-drift-row is-reverse' : 'reason-drift-row'}
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
            aria-label={`${item.text}. ${
              item.isMine ? 'Your answer. ' : ''
            }${
              mine === 1 ? 'Liked' : mine === -1 ? 'Sunk' : 'Not voted'
            }. Tap or click to like. Double-tap, hold, or right-click to sink.`}
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
            {item.isMine ? (
              <span className="reason-chip-flair">Your answer</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ReasonResults({ section, viewingOwn = true }) {
  const responseId = useMemo(() => readMyResponseId(), []);
  const canVote = Boolean(responseId);
  const myReason = useMemo(
    () => (viewingOwn ? readMyCustomReason() : ''),
    [viewingOwn],
  );
  const pool = section.commentPool ?? [];
  const [myVotes, setMyVotes] = useState(readMyVotes);
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

    async function loadSnapshot() {
      try {
        const result = await fetch('/api/reason-votes');
        if (!result.ok) return;
        const body = await result.json();
        if (cancelled || layoutLocked.current || !body?.scores) return;
        setRows(snapshotRows(pool, netsFromScores(body.scores), myReason, viewingOwn));
      } catch {
        // keep the seed snapshot
      } finally {
        if (!cancelled) layoutLocked.current = true;
      }
    }

    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [pool, myReason, viewingOwn]);

  useEffect(
    () => () => {
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      if (capTipTimer.current) window.clearTimeout(capTipTimer.current);
      if (puffTimer.current) window.clearTimeout(puffTimer.current);
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    },
    [],
  );

  function clampPoint(point) {
    const pad = 16;
    return {
      x: Math.min(
        window.innerWidth - pad,
        Math.max(pad, point?.x ?? window.innerWidth / 2),
      ),
      y: Math.min(
        window.innerHeight - pad,
        Math.max(pad, point?.y ?? window.innerHeight / 2),
      ),
    };
  }

  function showCapTip(kind, point) {
    const { x, y } = clampPoint(point);
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
    const votesNow = readMyVotes();
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
    writeMyVotes(votes);
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

  function resetVotes() {
    const votesNow = readMyVotes();
    if (!Object.keys(votesNow).length) return;

    writeMyVotes({});
    setMyVotes({});
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
      const current = readMyVotes()[commentId] ?? 0;
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
      const current = readMyVotes()[commentId] ?? 0;
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
      const current = readMyVotes()[commentId] ?? 0;
      applyVote(commentId, nextFromDoubleTap(current), point);
      return;
    }

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTarget.current = commentId;
    tapPoint.current = point;
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[commentId] ?? 0;
      applyVote(commentId, nextFromSingleTap(current), tapPoint.current);
    }, TAP_MS);
  }

  return (
    <div className="reason-results">
      <div className="bucket-results is-single">
        <article className="bucket-card">
          <header className="bucket-card-head">
            <p className="bucket-card-kicker">Top 5</p>
            <h2 className="bucket-card-title">Why it feels vegetabley</h2>
            {section.leader ? (
              <p className="bucket-card-summary">
                {formatShare(section.leader.share)} of people marked{' '}
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
                      <span className="bucket-row-badge">Your vote</span>
                    ) : null}
                  </div>
                  <p className="bucket-row-meta">
                    {formatVotes(item.votes)} · {formatShare(item.share)}
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
        <h2 className="reason-drift-title">Custom user answers</h2>
        {canVote ? null : <SurveyNudge kind="vote" />}
        <div className="reason-drift" aria-label="Custom user answers">
          {rows.map((row) => (
            <DriftRow
              key={row.id}
              row={row}
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
              Click or tap once to like, or to clear a marked pill. Double-click,
              right-click, or press and hold a clear pill to sink it; double-click a
              red pill to like it. You can like up to {MAX_LIKES} and sink up to{' '}
              {MAX_DISLIKES}. The ribbons keep this snapshot until the page is
              refreshed.
            </p>
            <div className="reason-reset-row">
              <button
                className="reason-reset"
                type="button"
                disabled={!Object.keys(myVotes).length}
                onClick={resetVotes}
              >
                Reset input
                <span className="reason-reset-tip">
                  Clears your 5 likes and 5 dislikes so you can vote on 10 answers
                  again.
                </span>
              </button>
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
            ? 'You can like only 5 answers!'
            : 'You can dislike only 5 answers!'}
        </p>
      ) : null}
    </div>
  );
}
