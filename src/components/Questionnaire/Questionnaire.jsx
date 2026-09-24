import { useEffect, useState } from 'react';
import { DeveloperRecap } from './DeveloperRecap.jsx';
import { Question1 } from './Question1.jsx';
import { Question2 } from './Question2.jsx';
import { Question3 } from './Question3.jsx';
import { Question4 } from './Question4.jsx';
import { Question5 } from './Question5.jsx';
import { Toast } from './Toast.jsx';

const STORAGE_KEY = 'vegetable-survey-q1q5';
const LOCK_TOAST = 'First instinct locked. No wrong answers.';
const BACK_LOCKED_TOAST =
  'Your initial intuition is locked. There are no bad answers!';
const ANTARCTICA_TOAST = "I don't believe you.";

const STEPS = {
  QUESTION_1: 'question1',
  QUESTION_2: 'question2',
  QUESTION_3: 'question3',
  QUESTION_4: 'question4',
  QUESTION_5: 'question5',
  RECAP: 'recap',
};

const PREVIOUS_STEP = {
  [STEPS.QUESTION_3]: STEPS.QUESTION_2,
  [STEPS.QUESTION_4]: STEPS.QUESTION_3,
  [STEPS.QUESTION_5]: STEPS.QUESTION_4,
};

function emptyResponse() {
  return {
    responseId: null,
    timestamp: null,
    initialAssociation: null,
    initialCriteria: [],
    customCriterion: '',
    spectrum: null,
    openDescription: {
      text: '',
      publicDisplay: false,
    },
    background: {
      grewUp: null,
      languages: null,
    },
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
  const [toastMessage, setToastMessage] = useState(LOCK_TOAST);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTick, setToastTick] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    window.history.replaceState({ step }, '');
  }, [step]);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timeoutId = window.setTimeout(() => setToastVisible(false), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible, toastTick]);

  function persist(nextStep, nextResponse) {
    saveSession({ step: nextStep, response: nextResponse });
    setStep(nextStep);
    setResponse(nextResponse);
  }

  function handleQuestion1(initialAssociation) {
    persist(STEPS.QUESTION_2, {
      ...emptyResponse(),
      responseId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      initialAssociation,
    });
    setToastMessage(LOCK_TOAST);
    setToastVisible(true);
    setToastTick((tick) => tick + 1);
  }

  function handleQuestion2({ initialCriteria, customCriterion }) {
    persist(STEPS.QUESTION_3, {
      ...response,
      initialCriteria,
      customCriterion,
    });
  }

  function handleQuestion3({ spectrum }) {
    persist(STEPS.QUESTION_4, {
      ...response,
      spectrum,
    });
  }

  function handleQuestion4({ openDescription }) {
    persist(STEPS.QUESTION_5, {
      ...response,
      openDescription,
    });
  }

  function handleQuestion5({ background }) {
    persist(STEPS.RECAP, {
      ...response,
      background,
    });
  }

  function handleBack() {
    const previous = PREVIOUS_STEP[step];
    if (!previous) return;
    persist(previous, response);
  }

  function handleLockedBack() {
    setToastMessage(BACK_LOCKED_TOAST);
    setToastVisible(true);
    setToastTick((tick) => tick + 1);
  }

  function handleBlockedAntarctica() {
    setToastMessage(ANTARCTICA_TOAST);
    setToastVisible(true);
    setToastTick((tick) => tick + 1);
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
            initialCriteria={response.initialCriteria}
            initialCustomCriterion={response.customCriterion}
            onContinue={handleQuestion2}
            onLockedBack={handleLockedBack}
          />
        ) : null}
        {step === STEPS.QUESTION_3 ? (
          <Question3
            initialSpectrum={response.spectrum}
            onContinue={handleQuestion3}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_4 ? (
          <Question4
            initialDescription={response.openDescription}
            onContinue={handleQuestion4}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_5 ? (
          <Question5
            initialBackground={response.background}
            onContinue={handleQuestion5}
            onBack={handleBack}
            onBlockedAntarctica={handleBlockedAntarctica}
          />
        ) : null}
        {step === STEPS.RECAP ? (
          <DeveloperRecap response={response} onReset={handleReset} />
        ) : null}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </main>
  );
}
