import { normalizeText } from './normalization.js';

const MY_CUSTOM_REASON_KEY = 'veg-survey-my-reason';

export function writeMyCustomReason(text, isPublic) {
  const trimmed = String(text ?? '').trim();
  try {
    if (!trimmed || !isPublic) {
      localStorage.removeItem(MY_CUSTOM_REASON_KEY);
      return;
    }
    localStorage.setItem(
      MY_CUSTOM_REASON_KEY,
      JSON.stringify({ text: trimmed }),
    );
  } catch {
    // private mode
  }
}

export function readMyCustomReason() {
  try {
    const raw = localStorage.getItem(MY_CUSTOM_REASON_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return typeof parsed?.text === 'string' ? parsed.text.trim() : '';
  } catch {
    return '';
  }
}

export function isMyCustomReason(text, mine) {
  if (!mine) return false;
  return normalizeText(text) === normalizeText(mine);
}

export function applyMyAnswerToRows(rows, myText) {
  if (!myText) return rows;

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
