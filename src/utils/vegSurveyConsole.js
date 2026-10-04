const FLAG = 'veg-survey-open-code';
const EVENT = 'veg-survey-open-code';
const PREFILL_FLAG = 'veg-survey-prefill';
const PREFILL_EVENT = 'veg-survey-prefill';

export function requestRankingCodePanel() {
  try {
    sessionStorage.setItem(FLAG, '1');
  } catch {
    // private mode
  }
  window.dispatchEvent(new Event(EVENT));
  if (!window.location.pathname.startsWith('/survey')) {
    window.location.assign('/survey');
  }
}

export function consumeRankingCodePanelFlag() {
  try {
    if (sessionStorage.getItem(FLAG) === '1') {
      sessionStorage.removeItem(FLAG);
      return true;
    }
  } catch {
    // private mode
  }
  return false;
}

export function subscribeRankingCodePanel(onOpen) {
  function handle() {
    onOpen();
  }
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}

export function requestSurveyPrefill() {
  if (!import.meta.env.DEV) return;
  try {
    sessionStorage.setItem(PREFILL_FLAG, '1');
  } catch {
    // private mode
  }
  window.dispatchEvent(new Event(PREFILL_EVENT));
  if (!window.location.pathname.startsWith('/survey')) {
    window.location.assign('/survey');
  }
}

export function consumeSurveyPrefillFlag() {
  try {
    if (sessionStorage.getItem(PREFILL_FLAG) === '1') {
      sessionStorage.removeItem(PREFILL_FLAG);
      return true;
    }
  } catch {
    // private mode
  }
  return false;
}

export function subscribeSurveyPrefill(onPrefill) {
  function handle() {
    onPrefill();
  }
  window.addEventListener(PREFILL_EVENT, handle);
  return () => window.removeEventListener(PREFILL_EVENT, handle);
}

export function installVegSurveyConsole() {
  if (!import.meta.env.DEV) return;
  window.vegSurvey = requestSurveyPrefill;
}
