import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NOTE_PAGE_SIZE,
  notePageCount,
  pageNotes,
  rankNotes,
} from '../../data/noteResults.js';
import { applyMyNoteToPage, isMyOpenNote, readMyOpenNote } from '../../utils/myOpenNote.js';
import { readMyResponseId } from '../../utils/myResponse.js';
import { SurveyNudge } from './SurveyGate.jsx';

const MY_VOTES_KEY = 'veg-survey-note-votes';
const TAP_MS = 280;
const HOLD_MS = 500;
const HOLD_MOVE_PX = 10;
const MAX_LIKES = 5;
const MAX_DISLIKES = 5;
const PUFF_MS = 900;

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

function canSetVote(votes, noteId, nextValue) {
  if (nextValue === 0) return true;
  const current = votes[noteId] ?? 0;
  if (current === nextValue) return true;
  const used = Object.entries(votes).filter(
    ([id, entry]) => id !== noteId && entry === nextValue,
  ).length;
  return used < (nextValue === 1 ? MAX_LIKES : MAX_DISLIKES);
}

function netsFromVotes(votes) {
  return Object.fromEntries(
    Object.entries(votes).map(([id, value]) => [id, value ?? 0]),
  );
}

const PAPER_COUNT = 7;
const NOTE_TILTS = [-3.5, 0, 3.5];

function mixId(id, salt) {
  let h = 2166136261 ^ salt;
  for (const ch of String(id)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function paperFor(id) {
  return mixId(id, 0x9e3779b9) % PAPER_COUNT;
}

function tiltFor(id) {
  return NOTE_TILTS[mixId(id, 0x85ebca6b) % NOTE_TILTS.length];
}

function snapshotPage(pool, votes, pageIndex, myText, pinMine) {
  const ranked = rankNotes(pool, netsFromVotes(votes));
  const { page, pages, items } = pageNotes(ranked, pageIndex);
  const marked = items.map((item) => ({
    ...item,
    isMine: isMyOpenNote(item.text, myText),
  }));
  return {
    page,
    pages,
    items:
      pinMine && myText && !marked.some((item) => item.isMine)
        ? applyMyNoteToPage(marked, myText)
        : marked,
  };
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

export function NoteResults({ section, viewingOwn = true }) {
  const responseId = useMemo(() => readMyResponseId(), []);
  const canVote = Boolean(responseId);
  const storedNote = useMemo(() => readMyOpenNote(), []);
  const myNote = viewingOwn
    ? storedNote.text || section.userNoteText || ''
    : section.userNoteText || '';
  const canPin = Boolean(viewingOwn && storedNote.text && storedNote.isPublic);
  const pool = section.notePool ?? [];
  const [myVotes, setMyVotes] = useState(readMyVotes);
  const [board, setBoard] = useState(() =>
    snapshotPage(pool, readMyVotes(), 0, myNote, canPin),
  );
  const tapTimer = useRef(0);
  const tapTarget = useRef(null);
  const tapPoint = useRef(null);
  const [capTip, setCapTip] = useState(null);
  const capTipTimer = useRef(0);
  const [puff, setPuff] = useState(null);
  const puffTimer = useRef(0);
  const sinkGuard = useRef({ id: null, at: 0 });
  const holdTimer = useRef(0);
  const holdFired = useRef(false);
  const holdOrigin = useRef({ x: 0, y: 0 });

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

  function applyVote(noteId, nextValue, point) {
    if (!responseId) return;
    const votesNow = readMyVotes();
    const previous = votesNow[noteId] ?? 0;
    if (previous === nextValue) return;
    if (!canSetVote(votesNow, noteId, nextValue)) {
      if (nextValue === 1 || nextValue === -1) {
        showCapTip(nextValue === 1 ? 'like' : 'dislike', point);
      }
      return;
    }

    const votes = { ...votesNow };
    if (nextValue === 0) delete votes[noteId];
    else votes[noteId] = nextValue;
    writeMyVotes(votes);
    setMyVotes(votes);
    if (nextValue === 1 || nextValue === -1) {
      showPuff(nextValue, point);
    }

    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentId: noteId,
        responseId,
        value: nextValue,
      }),
    }).catch(() => {
      // markings already applied locally
    });
  }

  function resetVotes() {
    if (!responseId) return;
    const votesNow = readMyVotes();
    if (!Object.keys(votesNow).length) return;
    writeMyVotes({});
    setMyVotes({});
    fetch('/api/reason-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseId,
        reset: true,
        family: 'notes',
      }),
    }).catch(() => {
      // markings already cleared locally
    });
  }

  function reshuffle() {
    const votesNow = readMyVotes();
    const ranked = rankNotes(pool, netsFromVotes(votesNow));
    const pages = notePageCount(ranked.length);
    const nextPage = (board.page + 1) % pages;
    const snapshot = snapshotPage(
      pool,
      votesNow,
      nextPage,
      myNote,
      nextPage === 0 && canPin,
    );
    setBoard(snapshot);
  }

  function clearHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = 0;
  }

  function onHoldStart(event, noteId) {
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
      applyVote(noteId, -1, point);
      sinkGuard.current = {
        id: noteId,
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

  function onVote(event, noteId) {
    event.preventDefault?.();
    event.stopPropagation?.();

    if (event.type === 'pointerup' && holdFired.current) {
      holdFired.current = false;
      return;
    }

    const point = pointFromEvent(event);

    if (event.type === 'keydown') {
      const current = readMyVotes()[noteId] ?? 0;
      applyVote(noteId, nextFromSingleTap(current), point);
      return;
    }

    const isRightClick = event.type === 'contextmenu' || event.button === 2;
    if (isRightClick) {
      const now =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (
        sinkGuard.current.id === noteId &&
        now - sinkGuard.current.at < 400
      ) {
        return;
      }
      sinkGuard.current = { id: noteId, at: now };
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[noteId] ?? 0;
      applyVote(noteId, nextFromRightClick(current), point);
      return;
    }

    if (event.button != null && event.button !== 0) return;

    const isSecondTap = tapTimer.current && tapTarget.current === noteId;

    if (isSecondTap) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[noteId] ?? 0;
      applyVote(noteId, nextFromDoubleTap(current), point);
      return;
    }

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTarget.current = noteId;
    tapPoint.current = point;
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = 0;
      tapTarget.current = null;
      const current = readMyVotes()[noteId] ?? 0;
      applyVote(noteId, nextFromSingleTap(current), tapPoint.current);
    }, TAP_MS);
  }

  return (
    <div className="note-results">
      <div className="note-board-toolbar">
        <p className="note-board-status">
          Set {board.page + 1} of {board.pages} · {NOTE_PAGE_SIZE} notes
        </p>
        <button className="note-reshuffle" type="button" onClick={reshuffle}>
          Reshuffle
        </button>
        {canVote ? null : <SurveyNudge kind="vote" />}
      </div>

      <div className="note-board" aria-label="Public written answers">
        {board.items.map((item) => {
          const mine = myVotes[item.id] ?? 0;
          return (
            <button
              key={`${board.page}-${item.id}`}
              type="button"
              className={[
                'note-card',
                `is-paper-${paperFor(item.id)}`,
                mine === 1 ? 'is-liked' : '',
                mine === -1 ? 'is-disliked' : '',
                item.isMine && viewingOwn ? 'is-mine' : '',
                canVote ? '' : 'is-locked',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--note-tilt': `${tiltFor(item.id)}deg` }}
              data-note-id={item.id}
              disabled={!canVote}
              aria-pressed={mine === 1}
              aria-label={`${item.text}. ${
                item.isMine ? 'Your answer. ' : ''
              }${
                mine === 1 ? 'Liked' : mine === -1 ? 'Sunk' : 'Not voted'
              }. Click to like, double-click, right-click, or hold to sink.`}
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
              <span className="note-card-text">{item.text}</span>
              {item.isMine && viewingOwn ? (
                <span className="note-card-flair">Your answer</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="reason-drift-hint">
        Click or tap once to like, or to clear a marked note. Double-click,
        right-click, or press and hold a clear note to sink it; double-click a
        red note to like it. You can like up to {MAX_LIKES} and sink up to{' '}
        {MAX_DISLIKES}. Reshuffle shows the next {NOTE_PAGE_SIZE}; liked notes
        can move onto the first set.
      </p>
      <div className="reason-reset-row">
        <button
          className="reason-reset"
          type="button"
          disabled={!canVote || !Object.keys(myVotes).length}
          onClick={resetVotes}
        >
          Reset input
          <span className="reason-reset-tip">
            Clears your 5 likes and 5 dislikes so you can vote on 10 answers
            again.
          </span>
        </button>
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
