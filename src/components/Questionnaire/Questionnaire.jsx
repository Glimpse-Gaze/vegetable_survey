import { useEffect, useState } from 'react';
import { DeveloperRecap } from './DeveloperRecap.jsx';
import { Question1 } from './Question1.jsx';
import { Question2 } from './Question2.jsx';
import { Toast } from './Toast.jsx';

const STORAGE_KEY = 'vegetable-survey-q1q2';
const TOAST_MESSAGE = 'First instinct locked. No wrong answers.';

const STEPS = {
  QUESTION_1: 'question1',
  QUESTION_2: 'question2',
  RECAP: 'recap',
};

function emptyResponse() {
  return {
    responseId: null,
    timestamp: null,
    initialAssociation: null,
    initialCriteria: [],
    customCriterion: '',
  };
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function readInitialState() {
  const stored = loadSession();
  return {
    step: stored?.step ?? STEPS.QUESTION_1,
    response: stored?.response ?? emptyResponse(),
  };
}

export function Questionnaire() {
  const [step, setStep] = useState(() => readInitialState().step);
  const [response, setResponse] = useState(() => readInitialState().response);
  const [toastVisible, setToastVisible] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    window.history.replaceState({ step }, '');
  }, [step]);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timeoutId = window.setTimeout(() => setToastVisible(false), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible]);

  function persist(nextStep, nextResponse) {
    saveSession({ step: nextStep, response: nextResponse });
    setStep(nextStep);
    setResponse(nextResponse);
  }

  function handleQuestion1(initialAssociation) {
    persist(STEPS.QUESTION_2, {
      responseId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      initialAssociation,
      initialCriteria: [],
      customCriterion: '',
    });
    setToastVisible(true);
  }

  function handleQuestion2({ initialCriteria, customCriterion }) {
    persist(STEPS.RECAP, {
      ...response,
      initialCriteria,
      customCriterion,
    });
  }

  function handleReset() {
    clearSession();
    setToastVisible(false);
    setResponse(emptyResponse());
    setStep(STEPS.QUESTION_1);
    setResetKey((key) => key + 1);
  }

  return (
    <main className="questionnaire">
      <div className="questionnaire-inner" key={`${step}-${resetKey}`}>
        {step === STEPS.QUESTION_1 ? (
          <Question1 onContinue={handleQuestion1} />
        ) : null}
        {step === STEPS.QUESTION_2 ? (
          <Question2
            rawAnswer={response.initialAssociation?.rawAnswer ?? ''}
            onContinue={handleQuestion2}
          />
        ) : null}
        {step === STEPS.RECAP ? (
          <DeveloperRecap response={response} onReset={handleReset} />
        ) : null}
      </div>

      <Toast message={TOAST_MESSAGE} visible={toastVisible} />
    </main>
  );
}
