import { useEffect, useState } from 'react';
import { countries, featuredCountryIds } from '../../data/countries.js';
import { featuredLanguageIds, languages } from '../../data/languages.js';
import {
  findCanonicalMatch,
  getLookupSuggestions,
} from '../../utils/autocomplete.js';
import { AutocompleteInput } from './AutocompleteInput.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const DISCLOSE_ID = 'prefer_not_to_disclose';
const ANTARCTICA_ID = 'antarctica';

function resolveSingle(raw, picked, items) {
  const rawAnswer = (picked?.name ?? raw).trim();
  if (!rawAnswer) {
    return {
      rawAnswer: 'I prefer not to disclose',
      canonicalId: DISCLOSE_ID,
      skipped: true,
    };
  }

  const canonicalId =
    picked?.id ?? findCanonicalMatch(rawAnswer, items) ?? null;

  return {
    rawAnswer,
    canonicalId,
    skipped: canonicalId === DISCLOSE_ID,
  };
}

export function Question7({
  onContinue,
  onBack,
  onDraft,
  initialBackground,
  continueDisabled = false,
  continueHint,
}) {
  const grewUp = initialBackground?.grewUp;
  const languagesState = initialBackground?.languages;
  const placeWithheldInitial = Boolean(grewUp?.withheld);
  const languageWithheldInitial = Boolean(languagesState?.withheld);
  const rememberedPlace = grewUp?.remembered;
  const rememberedLanguages = languagesState?.remembered;

  const [placeWithheld, setPlaceWithheld] = useState(placeWithheldInitial);
  const [placeValue, setPlaceValue] = useState(
    placeWithheldInitial
      ? (rememberedPlace?.rawAnswer ?? '')
      : (grewUp?.canonicalId === DISCLOSE_ID ? '' : (grewUp?.rawAnswer ?? '')),
  );
  const [placePicked, setPlacePicked] = useState(() => {
    if (placeWithheldInitial) {
      return rememberedPlace?.canonicalId
        ? { id: rememberedPlace.canonicalId, name: rememberedPlace.rawAnswer }
        : null;
    }
    if (!grewUp?.canonicalId || grewUp.canonicalId === DISCLOSE_ID) return null;
    return { id: grewUp.canonicalId, name: grewUp.rawAnswer };
  });
  const [languageWithheld, setLanguageWithheld] = useState(languageWithheldInitial);
  const [languageValue, setLanguageValue] = useState(languagesState?.pending ?? '');
  const [languageItems, setLanguageItems] = useState(() => {
    const source = languageWithheldInitial
      ? rememberedLanguages
      : languagesState?.items;
    return (source ?? []).filter((entry) => entry.canonicalId !== DISCLOSE_ID);
  });
  const [doubt, setDoubt] = useState(false);

  const placeSuggestions = getLookupSuggestions(placeValue, countries, {
    featuredIds: featuredCountryIds,
    browseAll: true,
  }).filter((item) => item.id !== DISCLOSE_ID);
  const languageSuggestions = getLookupSuggestions(languageValue, languages, {
    featuredIds: featuredLanguageIds,
    limit: 10,
  }).filter(
    (item) =>
      item.id !== DISCLOSE_ID &&
      !languageItems.some((entry) => entry.canonicalId === item.id),
  );

  function handlePlacePick(item) {
    if (item.id === ANTARCTICA_ID) {
      setDoubt(true);
      return false;
    }
    setDoubt(false);
    setPlaceValue(item.name);
    setPlacePicked(item);
  }

  function addLanguage(itemOrText) {
    const picked = typeof itemOrText === 'string' ? null : itemOrText;
    const rawAnswer = (picked?.name ?? itemOrText).trim();
    if (!rawAnswer || languageWithheld) return;

    const canonicalId = picked?.id ?? findCanonicalMatch(rawAnswer, languages);
    if (!canonicalId || canonicalId === DISCLOSE_ID) {
      if (canonicalId === DISCLOSE_ID) return;
    }

    setLanguageItems((current) => {
      const duplicate = current.some((entry) => {
        if (canonicalId && entry.canonicalId === canonicalId) return true;
        return entry.rawAnswer.toLowerCase() === rawAnswer.toLowerCase();
      });
      if (duplicate) return current;
      return [...current, { rawAnswer, canonicalId }];
    });
    setLanguageValue('');
  }

  function removeLanguage(index) {
    if (languageWithheld) return;
    setLanguageItems((current) => current.filter((_, i) => i !== index));
  }

  useEffect(() => {
    const grewUpAnswer = placeWithheld
      ? {
          rawAnswer: 'I prefer not to disclose',
          canonicalId: DISCLOSE_ID,
          skipped: true,
          withheld: true,
          remembered: placeValue
            ? { rawAnswer: placeValue, canonicalId: placePicked?.id ?? null }
            : null,
        }
      : {
          ...resolveSingle(placeValue, placePicked, countries),
          withheld: false,
        };

    onDraft?.({
      grewUp: grewUpAnswer,
      languages: {
        items: languageWithheld ? [] : languageItems,
        skipped: languageWithheld || languageItems.length === 0,
        withheld: languageWithheld,
        remembered: languageWithheld ? languageItems : undefined,
        pending: languageValue,
      },
    });
  }, [
    languageItems,
    languageValue,
    languageWithheld,
    onDraft,
    placePicked,
    placeValue,
    placeWithheld,
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    const resolvedPlace = resolveSingle(placeValue, placePicked, countries);
    if (!placeWithheld && resolvedPlace.canonicalId === ANTARCTICA_ID) {
      setDoubt(true);
      return;
    }

    const grewUp = placeWithheld
      ? {
          rawAnswer: 'I prefer not to disclose',
          canonicalId: DISCLOSE_ID,
          skipped: true,
        }
      : resolvedPlace;

    let items = languageItems.filter(
      (entry) => entry.canonicalId !== DISCLOSE_ID,
    );
    const pending = languageValue.trim();
    if (!languageWithheld && pending) {
      const canonicalId = findCanonicalMatch(pending, languages) ?? null;
      const duplicate = items.some((entry) => {
        if (canonicalId && entry.canonicalId === canonicalId) return true;
        return entry.rawAnswer.toLowerCase() === pending.toLowerCase();
      });
      if (!duplicate && canonicalId !== DISCLOSE_ID) {
        items = [...items, { rawAnswer: pending, canonicalId }];
      }
    }

    const skippedLanguages = languageWithheld || items.length === 0;
    const languagesAnswer = skippedLanguages
      ? [
          {
            rawAnswer: 'I prefer not to disclose',
            canonicalId: DISCLOSE_ID,
          },
        ]
      : items;

    onContinue({
      background: {
        grewUp,
        languages: {
          items: languagesAnswer,
          skipped: skippedLanguages,
        },
      },
    });
  }

  return (
    <QuestionContainer questionNumber={7}>
      <h1 className="question-title">Would you mind sharing your background?</h1>
      <p className="microcopy">
        Skip either question if you’d rather not say — we’ll record “I prefer
        not to disclose.” You can also type something more specific.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div
          className={
            placeWithheld ? 'background-field is-withheld' : 'background-field'
          }
        >
          <label htmlFor="grew-up">In which country or region did you grow up?</label>
          {doubt ? (
            <p className="field-note" role="status">
              I don't believe you.
            </p>
          ) : null}
          <AutocompleteInput
            id="grew-up"
            value={placeValue}
            disabled={placeWithheld}
            onChange={(next) => {
              if (placeWithheld) return;
              setDoubt(false);
              setPlaceValue(next);
              setPlacePicked(null);
            }}
            onPickSuggestion={handlePlacePick}
            suggestions={placeWithheld ? [] : placeSuggestions}
            placeholder="Country, region, or continent..."
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={placeWithheld}
              onChange={(event) => setPlaceWithheld(event.target.checked)}
            />
            <span>I prefer not to disclose</span>
          </label>
        </div>

        <div
          className={
            languageWithheld ? 'background-field is-withheld' : 'background-field'
          }
        >
          <label htmlFor="languages-spoken">What is your native language?</label>
          {languageItems.length > 0 ? (
            <ul className="chip-list">
              {languageItems.map((entry, index) => (
                <li key={`${entry.canonicalId ?? entry.rawAnswer}-${index}`}>
                  <button
                    type="button"
                    className={languageWithheld ? 'chip is-held' : 'chip'}
                    disabled={languageWithheld}
                    onClick={() => removeLanguage(index)}
                  >
                    {entry.rawAnswer}
                    {languageWithheld ? null : <span aria-hidden="true"> ×</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <AutocompleteInput
            id="languages-spoken"
            value={languageValue}
            disabled={languageWithheld}
            onChange={(next) => {
              if (languageWithheld) return;
              setLanguageValue(next);
            }}
            onPickSuggestion={addLanguage}
            onCommit={addLanguage}
            closeOnPick={false}
            suggestions={languageWithheld ? [] : languageSuggestions}
            placeholder="Type a native language..."
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={languageWithheld}
              onChange={(event) => setLanguageWithheld(event.target.checked)}
            />
            <span>I prefer not to disclose</span>
          </label>
        </div>

        <QuestionNav
          onBack={onBack}
          continueDisabled={continueDisabled}
          continueHint={continueHint}
          continueHintId="submit-hint"
        />
      </form>
    </QuestionContainer>
  );
}
