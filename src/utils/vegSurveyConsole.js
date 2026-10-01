const FLAG = 'veg-survey-open-code';
const EVENT = 'veg-survey-open-code';

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

export function installVegSurveyConsole() {
  window.vegSurvey = requestRankingCodePanel;
}
