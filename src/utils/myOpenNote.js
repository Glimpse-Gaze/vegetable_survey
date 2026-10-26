import { normalizeText } from './normalization.js';
import { isPublishableText } from './publishableText.js';

const MY_OPEN_NOTE_KEY = 'veg-survey-my-note';

export function writeMyOpenNote(text, isPublic, locale = null) {
  const trimmed = String(text ?? '').trim();
  try {
    if (!trimmed) {
      localStorage.removeItem(MY_OPEN_NOTE_KEY);
      return;
    }
    const payload = {
      text: trimmed,
      public: Boolean(isPublic),
    };
    const loc = String(locale ?? '').trim().toLowerCase();
    if (loc) payload.locale = loc;
    localStorage.setItem(MY_OPEN_NOTE_KEY, JSON.stringify(payload));
  } catch {
    // private mode
  }
}

export function readMyOpenNote() {
  try {
    const raw = localStorage.getItem(MY_OPEN_NOTE_KEY);
    if (!raw) return { text: '', isPublic: false, locale: null };
    const parsed = JSON.parse(raw);
    const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
    const storedPublic =
      parsed?.public === undefined && parsed?.isPublic === undefined
        ? Boolean(text)
        : Boolean(parsed?.public ?? parsed?.isPublic);
    const isPublic = storedPublic && isPublishableText(text);
    const locale =
      typeof parsed?.locale === 'string' ? parsed.locale.trim().toLowerCase() : null;
    return { text, isPublic, locale: locale || null };
  } catch {
    return { text: '', isPublic: false, locale: null };
  }
}

export function isMyOpenNote(text, mine) {
  if (!mine) return false;
  return normalizeText(text) === normalizeText(mine);
}

export function applyMyNoteToPage(items, myText) {
  if (!myText || !isPublishableText(myText)) return items;

  let found = false;
  const marked = items.map((item) => {
    const isMine = isMyOpenNote(item.text, myText);
    if (isMine) found = true;
    return { ...item, isMine };
  });

  if (found) return marked;

  return [
    ...marked.slice(0, Math.max(0, marked.length - 1)),
    { id: 'my-note', text: myText, score: 0, net: 0, isMine: true },
  ];
}
