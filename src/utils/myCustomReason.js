import { normalizeText } from './normalization.js';
import { isPublishableText } from './publishableText.js';

const MY_CUSTOM_REASON_KEY = 'veg-survey-my-reason';

export function writeMyCustomReason(text, isPublic, locale = null) {
  const trimmed = String(text ?? '').trim();
  const publish = Boolean(isPublic) && isPublishableText(trimmed);
  try {
    if (!trimmed || !publish) {
      localStorage.removeItem(MY_CUSTOM_REASON_KEY);
      return;
    }
    const payload = { text: trimmed };
    const loc = String(locale ?? '').trim().toLowerCase();
    if (loc) payload.locale = loc;
    localStorage.setItem(MY_CUSTOM_REASON_KEY, JSON.stringify(payload));
  } catch {
    // private mode
  }
}

export function readMyCustomReason() {
  try {
    const raw = localStorage.getItem(MY_CUSTOM_REASON_KEY);
    if (!raw) return { text: '', locale: null };
    const parsed = JSON.parse(raw);
    const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
    const locale =
      typeof parsed?.locale === 'string' ? parsed.locale.trim().toLowerCase() : null;
    if (!isPublishableText(text)) return { text: '', locale: null };
    return { text, locale: locale || null };
  } catch {
    return { text: '', locale: null };
  }
}

export function isMyCustomReason(text, mine) {
  if (!mine) return false;
  return normalizeText(text) === normalizeText(mine);
}

export function applyMyAnswerToRows(rows, myText) {
  if (!myText || !isPublishableText(myText)) return rows;

  let found = false;
  const marked = rows.map((row) => ({
    ...row,
    items: row.items.map((item) => {
      const isMine = isMyCustomReason(item.text, myText);
      if (isMine) found = true;
      return { ...item, isMine };
    }),
  }));

  if (found || marked.length === 0) return marked;

  const lastIndex = marked.length - 1;
  return marked.map((row, index) =>
    index === lastIndex
      ? {
          ...row,
          items: [
            ...row.items,
            { id: 'my-reason', text: myText, score: 0, isMine: true },
          ],
        }
      : row,
  );
}
