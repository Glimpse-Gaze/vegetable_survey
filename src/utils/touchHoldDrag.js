/** Hold-to-drag helpers tuned for older iOS Safari (pre–iPhone 15 class). */

export const HOLD_MS = 220;
/** Finger jitter / rubber-band tolerance before a hold is cancelled. */
export const HOLD_SLOP = 28;

export const supportsNativeDrag =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function isTouchLikePointer(event) {
  if (event.pointerType === 'mouse') return false;
  if (event.button != null && event.button !== 0) return false;
  return true;
}

/** Prefer Touch Events on phones — Pointer Events often get cancelled mid-hold on older iOS. */
export function shouldTrackWithTouch(event) {
  if (event.pointerType === 'touch') return true;
  if (event.pointerType === 'mouse') return false;
  return typeof window !== 'undefined' && 'ontouchstart' in window;
}

export function movementExceeded(originX, originY, x, y, slop = HOLD_SLOP) {
  const dx = x - originX;
  const dy = y - originY;
  return dx * dx + dy * dy > slop * slop;
}

export function detachHoldTracking(session) {
  if (!session) return;
  if (session.onMove) {
    window.removeEventListener('pointermove', session.onMove);
    window.removeEventListener('pointerup', session.onUp);
    window.removeEventListener('pointercancel', session.onUp);
  }
  if (session.onTouchMove) {
    window.removeEventListener('touchmove', session.onTouchMove);
    window.removeEventListener('touchend', session.onTouchEnd);
    window.removeEventListener('touchcancel', session.onTouchEnd);
  }
}

export function attachHoldTracking(session, { onMove, onUp, useTouch }) {
  session.onMove = onMove;
  session.onUp = onUp;
  if (useTouch) {
    session.onTouchMove = (touchEvent) => {
      const touch = touchEvent.touches[0];
      if (!touch) return;
      const claimed = onMove({
        pointerId: session.pointerId,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      // Claim the gesture while holding or dragging so Safari cannot scroll/cancel it.
      if (claimed) touchEvent.preventDefault();
    };
    session.onTouchEnd = (touchEvent) => {
      const touch = touchEvent.changedTouches[0];
      onUp({
        type: touchEvent.type === 'touchcancel' ? 'pointercancel' : 'pointerup',
        pointerId: session.pointerId,
        clientX: touch?.clientX ?? session.lastX,
        clientY: touch?.clientY ?? session.lastY,
      });
    };
    window.addEventListener('touchmove', session.onTouchMove, { passive: false });
    window.addEventListener('touchend', session.onTouchEnd);
    window.addEventListener('touchcancel', session.onTouchEnd);
    return;
  }
  window.addEventListener('pointermove', session.onMove);
  window.addEventListener('pointerup', session.onUp);
  window.addEventListener('pointercancel', session.onUp);
}

export function buzzArmed() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // iOS ignores vibrate; ignore failures elsewhere.
  }
}
