const RESPONSE_ID_KEY = 'veg-survey-response-id';
const ANSWERS_KEY = 'veg-survey-my-answers';
const RESPONSE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isResponseId(value) {
  return RESPONSE_ID.test(String(value ?? ''));
}

export function snapshotAnswers(payload) {
  return {
    initialAssociation: payload?.initialAssociation ?? null,
    initialCriteria: Array.isArray(payload?.initialCriteria)
      ? payload.initialCriteria
      : [],
    customCriterion: payload?.customCriterion ?? '',
    customCriterionPublic: Boolean(payload?.customCriterionPublic),
    sortBuckets: payload?.sortBuckets ?? null,
    spectrum: Array.isArray(payload?.spectrum) ? payload.spectrum : [],
    mostVegetable: payload?.mostVegetable ?? null,
    openDescription: payload?.openDescription ?? {
      text: '',
      publicDisplay: false,
    },
  };
}

export function writeMyResponse(id, payload) {
  try {
    if (!isResponseId(id)) return;
    localStorage.setItem(RESPONSE_ID_KEY, id);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(snapshotAnswers(payload)));
  } catch {
    // private mode
  }
}

export function readMyResponseId() {
  try {
    const id = localStorage.getItem(RESPONSE_ID_KEY);
    return isResponseId(id) ? id : '';
  } catch {
    return '';
  }
}

export function readMyAnswers() {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function resultsSharePath(categoryId, code) {
  const base = `/results/${categoryId}`;
  if (!isResponseId(code)) return base;
  return `${base}?code=${encodeURIComponent(code)}`;
}
