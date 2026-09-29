import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrivacyConsent } from './PrivacyConsent.jsx';
import { Question1 } from './Question1.jsx';
import { Question2 } from './Question2.jsx';
import { Question3 } from './Question3.jsx';
import { Question4 } from './Question4.jsx';
import { Question5 } from './Question5.jsx';
import { Question6 } from './Question6.jsx';
import { Question7 } from './Question7.jsx';
import { ThankYou } from './ThankYou.jsx';
import { Toast } from './Toast.jsx';
import { submitResponse } from '../../utils/submitResponse.js';

const LOCK_TOAST = 'First instinct locked. No wrong answers.';
const BACK_LOCKED_TOAST =
  'Your initial intuition is locked. There are no bad answers!';
const ANTARCTICA_TOAST = "I don't believe you.";
const SPEEDRUN_TOAST = 'Dev speedrun loaded. Submit the last question to save.';

const STEPS = {
  CONSENT: 'consent',
  QUESTION_1: 'question1',
  QUESTION_2: 'question2',
  QUESTION_3: 'question3',
  QUESTION_4: 'question4',
  QUESTION_5: 'question5',
  QUESTION_6: 'question6',
  QUESTION_7: 'question7',
  THANKS: 'thanks',
};

const PREVIOUS_STEP = {
  [STEPS.QUESTION_1]: STEPS.CONSENT,
  [STEPS.QUESTION_3]: STEPS.QUESTION_2,
  [STEPS.QUESTION_4]: STEPS.QUESTION_3,
  [STEPS.QUESTION_5]: STEPS.QUESTION_4,
  [STEPS.QUESTION_6]: STEPS.QUESTION_5,
  [STEPS.QUESTION_7]: STEPS.QUESTION_6,
};

function emptyResponse() {
  return {
    responseId: null,
    timestamp: null,
    processingConsent: null,
    initialAssociation: null,
    initialCriteria: [],
    customCriterion: '',
    customCriterionPublic: false,
    sortBuckets: null,
    spectrum: null,
    mostVegetable: null,
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

export function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.CONSENT);
  const [response, setResponse] = useState(() => emptyResponse());
  const [toastMessage, setToastMessage] = useState(LOCK_TOAST);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTick, setToastTick] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.history.replaceState({ step }, '');
  }, [step]);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timeoutId = window.setTimeout(() => setToastVisible(false), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible, toastTick]);

  function persist(nextStep, nextResponse) {
    setStep(nextStep);
    setResponse(nextResponse);
  }

  function showToast(message) {
    setToastMessage(message);
    setToastVisible(true);
    setToastTick((tick) => tick + 1);
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    async function handleSpeedrun(event) {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd')) {
        return;
      }
      event.preventDefault();

      const { DEV_SPEEDRUN } = await import('../../data/devSpeedrun.js');
      const nextResponse = {
        ...emptyResponse(),
        ...DEV_SPEEDRUN,
        responseId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        processingConsent: {
          agreed: true,
          agreedAt: new Date().toISOString(),
        },
      };

      setResetKey((key) => key + 1);
      persist(STEPS.QUESTION_7, nextResponse);
      showToast(SPEEDRUN_TOAST);
    }

    window.addEventListener('keydown', handleSpeedrun);
    return () => window.removeEventListener('keydown', handleSpeedrun);
  }, []);

  function handleConsent({ processingConsent }) {
    persist(STEPS.QUESTION_1, {
      ...emptyResponse(),
      processingConsent,
    });
  }

  function handleQuestion1(initialAssociation) {
    persist(STEPS.QUESTION_2, {
      ...emptyResponse(),
      responseId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      processingConsent: response.processingConsent,
      initialAssociation,
    });
    showToast(LOCK_TOAST);
  }

  function handleQuestion2({
    initialCriteria,
    customCriterion,
    customCriterionPublic,
  }) {
    persist(STEPS.QUESTION_3, {
      ...response,
      initialCriteria,
      customCriterion,
      customCriterionPublic,
    });
  }

  function handleQuestion3({ sortBuckets }) {
    persist(STEPS.QUESTION_4, {
      ...response,
      sortBuckets,
    });
  }

  function handleQuestion4({ spectrum }) {
    persist(STEPS.QUESTION_5, {
      ...response,
      spectrum,
    });
  }

  function handleQuestion5({ mostVegetable }) {
    persist(STEPS.QUESTION_6, {
      ...response,
      mostVegetable,
    });
  }

  function handleQuestion6({ openDescription }) {
    persist(STEPS.QUESTION_7, {
      ...response,
      openDescription,
    });
  }

  async function handleQuestion7({ background }) {
    if (isSubmitting) return;

    const nextResponse = {
      ...response,
      background,
    };

    setIsSubmitting(true);
    const result = await submitResponse(nextResponse);
    setIsSubmitting(false);

    if (!result.ok) {
      showToast(result.error ?? 'Could not save your answers. Try again.');
      return;
    }

    persist(STEPS.THANKS, nextResponse);
  }

  function handleBack() {
    const previous = PREVIOUS_STEP[step];
    if (!previous) return;
    persist(previous, response);
  }

  function handleLockedBack() {
    showToast(BACK_LOCKED_TOAST);
  }

  function handleBlockedAntarctica() {
    showToast(ANTARCTICA_TOAST);
  }

  return (
    <main className="questionnaire">
      <div className="questionnaire-inner" key={`${step}-${resetKey}`}>
        {step === STEPS.CONSENT ? (
          <PrivacyConsent
            onContinue={handleConsent}
            onBack={() => navigate('/')}
          />
        ) : null}
        {step === STEPS.QUESTION_1 ? (
          <Question1 onContinue={handleQuestion1} onBack={handleBack} />
        ) : null}
        {step === STEPS.QUESTION_2 ? (
          <Question2
            rawAnswer={response.initialAssociation?.rawAnswer ?? ''}
            initialCriteria={response.initialCriteria}
            initialCustomCriterion={response.customCriterion}
            initialCustomPublic={response.customCriterionPublic}
            onContinue={handleQuestion2}
            onLockedBack={handleLockedBack}
          />
        ) : null}
        {step === STEPS.QUESTION_3 ? (
          <Question3
            initialBuckets={response.sortBuckets}
            onContinue={handleQuestion3}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_4 ? (
          <Question4
            initialSpectrum={response.spectrum}
            onContinue={handleQuestion4}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_5 ? (
          <Question5
            initialMostVegetable={response.mostVegetable}
            onContinue={handleQuestion5}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_6 ? (
          <Question6
            initialDescription={response.openDescription}
            onContinue={handleQuestion6}
            onBack={handleBack}
          />
        ) : null}
        {step === STEPS.QUESTION_7 ? (
          <Question7
            initialBackground={response.background}
            onContinue={handleQuestion7}
            onBack={handleBack}
            onBlockedAntarctica={handleBlockedAntarctica}
            continueDisabled={isSubmitting}
            continueHint={isSubmitting ? 'Saving your answers…' : undefined}
          />
        ) : null}
        {step === STEPS.THANKS ? <ThankYou /> : null}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </main>
  );
}
