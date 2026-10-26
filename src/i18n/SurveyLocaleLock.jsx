import { createContext, useContext } from 'react';

const SurveyLocaleLockContext = createContext(false);

/** When true, questionnaire chrome hides the language pill (mid-survey lock). */
export function SurveyLocaleLockProvider({ locked, children }) {
  return (
    <SurveyLocaleLockContext.Provider value={Boolean(locked)}>
      {children}
    </SurveyLocaleLockContext.Provider>
  );
}

export function useSurveyLocaleLocked() {
  return useContext(SurveyLocaleLockContext);
}
