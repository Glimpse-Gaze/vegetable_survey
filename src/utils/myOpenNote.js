import { normalizeText } from './normalization.js';

const MY_OPEN_NOTE_KEY = 'veg-survey-my-note';

export function writeMyOpenNote(text, isPublic) {
  const trimmed = String(text ?? '').trim();
  try {
    if (!trimmed) {
      localStorage.removeItem(MY_OPEN_NOTE_KEY);
      return;
    }
    localStorage.setItem(
      MY_OPEN_NOTE_KEY,
      JSON.stringify({
        text: trimmed,
        public: Boolean(isPublic),
      }),
    );
  } catch {
    // private mode
  }
}

export function readMyOpenNote() {
  try {
    const raw = localStorage.getItem(MY_OPEN_NOTE_KEY);
    if (!raw) return { text: '', isPublic: false };
    const parsed = JSON.parse(raw);
    const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
    const isPublic =
      parsed?.public === undefined && parsed?.isPublic === undefined
        ? Boolean(text)
        : Boolean(parsed?.public ?? parsed?.isPublic);
    return { text, isPublic };
  } catch {
    return { text: '', isPublic: false };
  }
}

export function isMyOpenNote(text, mine) {
  if (!mine) return false;
  return normalizeText(text) === normalizeText(mine);
}

export function applyMyNoteToPage(items, myText) {
  if (!myText) return items;

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
