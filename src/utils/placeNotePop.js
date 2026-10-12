/** Keep an info popup inside the viewport (fixed to the trigger). */
export function placeNotePop(anchorEl, popEl, {
  pad = 12,
  gap = 10,
  maxWidthRem = 22,
} = {}) {
  if (!anchorEl || !popEl || typeof window === 'undefined') return;

  const maxWidth = Math.min(
    maxWidthRem * 16,
    window.innerWidth - pad * 2,
  );

  popEl.style.position = 'fixed';
  popEl.style.transform = 'none';
  popEl.style.right = 'auto';
  popEl.style.width = `${maxWidth}px`;
  popEl.style.maxWidth = `${window.innerWidth - pad * 2}px`;
  popEl.style.left = `${pad}px`;
  popEl.style.top = `${pad}px`;

  const anchor = anchorEl.getBoundingClientRect();
  const popW = popEl.offsetWidth;
  const popH = popEl.offsetHeight;

  let left = anchor.left;
  if (left + popW > window.innerWidth - pad) {
    left = window.innerWidth - pad - popW;
  }
  if (left < pad) left = pad;

  let top = anchor.bottom + gap;
  if (top + popH > window.innerHeight - pad) {
    top = Math.max(pad, anchor.top - gap - popH);
  }

  popEl.style.left = `${left}px`;
  popEl.style.top = `${top}px`;
}
