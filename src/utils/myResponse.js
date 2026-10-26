import { withLocale } from '../i18n/paths.js';

const RESPONSE_ID_KEY = 'veg-survey-response-id';
const ANSWERS_KEY = 'veg-survey-my-answers';
const RESULTS_ACK_KEY = 'veg-survey-results-ack';
/** Session-only: user chose “take again” after seeing the already-taken gate. */
const RETAKE_KEY = 'veg-survey-allow-retake';
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_CODE = /^[0-9A-Za-z]{12}$/;

export function isResponseId(value) {
  const code = String(value ?? '').trim();
  return UUID.test(code) || SHORT_CODE.test(code);
}

export function snapshotAnswers(payload) {
  return {
    locale: typeof payload?.locale === 'string' ? payload.locale : null,
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

/** Survey UI locale the answers were written in (null if unknown/legacy). */
export function answersLocale(answers) {
  const raw = String(answers?.locale ?? '').trim().toLowerCase();
  if (raw) return raw;
  // Legacy snapshots omitted locale — infer from free-text when possible.
  const note = String(answers?.openDescription?.text ?? '');
  const reason = String(answers?.customCriterion ?? '');
  const sample = note || reason;
  if (!sample) return null;
  if (
    /[\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c\u0104\u0106\u0118\u0141\u0143\u00d3\u015a\u0179\u017b]/.test(
      sample,
    )
  ) {
    return 'pl';
  }
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';
  if (/[\uac00-\ud7a3]/.test(sample)) return 'ko';
  if (/[\u0e00-\u0e7f]/.test(sample)) return 'th';
  return 'en';
}

/** Free-text / custom labels belong only to that survey language pool. */
export function answersMatchUiLocale(answers, uiLocale) {
  const written = answersLocale(answers);
  if (!written) return true;
  return written === String(uiLocale ?? '').trim().toLowerCase();
}

export function writeMyResponse(id, payload) {
  try {
    if (!isResponseId(id)) return;
    localStorage.setItem(RESPONSE_ID_KEY, id);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(snapshotAnswers(payload)));
    // New completion ends a retake pass — next survey visit shows the gate again.
    sessionStorage.removeItem(RETAKE_KEY);
  } catch {
    // private mode
  }
}

export function hasAcknowledgedResults() {
  try {
    return localStorage.getItem(RESULTS_ACK_KEY) === '1';
  } catch {
    return false;
  }
}

export function acknowledgeResults() {
  try {
    localStorage.setItem(RESULTS_ACK_KEY, '1');
  } catch {
    // private mode: this visit can still continue in memory
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

/** True when this tab opted to retake despite an existing local response id. */
export function canRetakeSurvey() {
  try {
    return sessionStorage.getItem(RETAKE_KEY) === '1';
  } catch {
    return false;
  }
}

export function allowSurveyRetake() {
  try {
    sessionStorage.setItem(RETAKE_KEY, '1');
  } catch {
    // private mode: caller can still proceed in memory this visit
  }
}

export function clearSurveyRetakeAllowance() {
  try {
    sessionStorage.removeItem(RETAKE_KEY);
  } catch {
    // ignore
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

/** Absolute URL for the first-instincts board, in the viewer's language. */
export function resultsShareUrl(locale, code) {
  const path = withLocale(
    locale,
    `/results/first-instincts?code=${encodeURIComponent(code)}`,
  );
  if (typeof window === 'undefined' || !window.location?.origin) return path;
  return `${window.location.origin}${path}`;
}
