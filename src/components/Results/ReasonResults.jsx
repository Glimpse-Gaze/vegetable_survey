import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COMMENT_DISPLAY_COUNT,
  layoutCommentRows,
  rankComments,
} from '../../data/reasonResults.js';

const VISITOR_KEY = 'veg-survey-visitor';
const MY_VOTES_KEY = 'veg-survey-reason-votes';
const TAP_MS = 280;
const MAX_LIKES = 5;
const MAX_DISLIKES = 5;

function formatVotes(n) {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? 'vote' : 'votes'}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

function readVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
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

function DriftRow({ row, myVotes, onVote }) {
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
            ]
              .filter(Boolean)
              .join(' ')}
            data-comment-id={item.id}
            data-boosts={item.score}
            aria-pressed={mine === 1}
            aria-label={`${item.text}. ${
              mine === 1
                ? 'Liked'
                : mine === -1
                  ? 'Sunk'
                  : 'Not voted'
            }. Click to like, double-click or right-click to sink.`}
            onPointerUp={(event) => onVote(event, item.id)}
            onContextMenu={(event) => onVote(event, item.id)}
            onKeyDown={(event) => {
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

export function ReasonResults({ section }) {
  const visitorId = useMemo(() => readVisitorId(), []);
  const [myVotes, setMyVotes] = useState(readMyVotes);
  const [nets, setNets] = useState({});
  const tapTimer = useRef(0);
  const tapTarget = useRef(null);
  const tapPoint = useRef(null);
  const [capTip, setCapTip] = useState(null);
  const capTipTimer = useRef(0);

  const rows = useMemo(() => {
    const ranked = rankComments(section.commentPool ?? [], nets);
    return layoutCommentRows(ranked, COMMENT_DISPLAY_COUNT);
  }, [nets, section.commentPool]);

  useEffect(() => {
    let cancelled = false;

    async function loadScores() {
      try {
        const result = await fetch('/api/reason-votes');
        if (!result.ok) return;
        const body = await result.json();
        if (!cancelled && body?.scores) {
          setNets(netsFromScores(body.scores));
        }
      } catch {
        // keep seed order
      }
    }

    loadScores();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      if (capTipTimer.current) window.clearTimeout(capTipTimer.current);
    },
    [],
  );

  function showCapTip(kind, point) {
    const pad = 16;
    const x = Math.min(
      window.innerWidth - pad,
      Math.max(pad, point?.x ?? window.innerWidth / 2),
    );
    const y = Math.min(
      window.innerHeight - pad,
      Math.max(pad, point?.y ?? window.innerHeight / 2),
    );
    setCapTip({ id: Date.now(), kind, x, y });
    if (capTipTimer.current) window.clearTimeout(capTipTimer.current);
    capTipTimer.current = window.setTimeout(() => setCapTip(null), 1800);
  }

  function applyVote(commentId, nextValue, point) {
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
    setNets((netsNow) => ({
      ...netsNow,
      [commentId]: (netsNow[commentId] ?? 0) - previous + nextValue,
    }));

    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentId,
        visitorId,
        value: nextValue,
      }),
    })
      .then((result) => (result.ok ? result.json() : null))
      .then((body) => {
        if (body?.scores) setNets(netsFromScores(body.scores));
      })
      .catch(() => {
        // local score already applied
      });
  }

  function resetVotes() {
    const votesNow = readMyVotes();
    if (!Object.keys(votesNow).length) return;

    writeMyVotes({});
    setMyVotes({});
    setNets((netsNow) => {
      const next = { ...netsNow };
      for (const [id, value] of Object.entries(votesNow)) {
        next[id] = (next[id] ?? 0) - value;
      }
      return next;
    });

    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        reset: true,
      }),
    })
      .then((result) => (result.ok ? result.json() : null))
      .then((body) => {
        if (body?.scores) setNets(netsFromScores(body.scores));
      })
      .catch(() => {
        // local reset already applied
      });
  }

  function onVote(event, commentId) {
    event.preventDefault?.();
    event.stopPropagation?.();
    const point = pointFromEvent(event);

    if (event.type === 'keydown') {
      const current = readMyVotes()[commentId] ?? 0;
      applyVote(commentId, current === 1 ? 0 : 1, point);
      return;
    }

    const isRightClick =
      event.type === 'contextmenu' || event.button === 2;
    if (isRightClick) {
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[commentId] ?? 0;
      applyVote(commentId, current === -1 ? 0 : -1, point);
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
      applyVote(commentId, current === -1 ? 0 : -1, point);
      return;
    }

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTarget.current = commentId;
    tapPoint.current = point;
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[commentId] ?? 0;
      applyVote(commentId, current === 1 ? 0 : 1, tapPoint.current);
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
        <div className="reason-drift" aria-label="Custom user answers">
          {rows.map((row) => (
            <DriftRow
              key={row.id}
              row={row}
              myVotes={myVotes}
              onVote={onVote}
            />
          ))}
        </div>
        <p className="reason-drift-hint">
          Click or tap once to like an answer — it turns green and rises for
          everyone. Double-click, tap twice, or right-click to mark it red and
          sink it. You can like up to {MAX_LIKES} and sink up to {MAX_DISLIKES}.
          The strongest lines stay in view; the rest wait in the pool.
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
      </div>
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
