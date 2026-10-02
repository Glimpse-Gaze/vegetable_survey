import { useState } from 'react';
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
  initialBackground,
  onBlockedAntarctica,
  continueDisabled = false,
  continueHint,
}) {
  const grewUp = initialBackground?.grewUp;
  const languagesState = initialBackground?.languages;

  const placeWithheld = Boolean(
    grewUp && (grewUp.skipped || grewUp.canonicalId === DISCLOSE_ID),
  );
  const [placeValue, setPlaceValue] = useState(
    placeWithheld ? '' : (grewUp?.rawAnswer ?? ''),
  );
  const [placePicked, setPlacePicked] = useState(
    placeWithheld
      ? { id: DISCLOSE_ID, name: 'I prefer not to disclose' }
      : grewUp?.canonicalId
        ? { id: grewUp.canonicalId, name: grewUp.rawAnswer }
        : null,
  );
  const [languageValue, setLanguageValue] = useState('');
  const [languageItems, setLanguageItems] = useState(() => {
    if (languagesState?.skipped) {
      return [
        {
          rawAnswer: 'I prefer not to disclose',
          canonicalId: DISCLOSE_ID,
        },
      ];
    }
    return languagesState?.items ?? [];
  });

  const placeSuggestions = getLookupSuggestions(placeValue, countries, {
    featuredIds: featuredCountryIds,
    browseAll: true,
  });
  const languageSuggestions = getLookupSuggestions(languageValue, languages, {
    featuredIds: featuredLanguageIds,
    limit: 10,
  }).filter(
    (item) =>
      item.id === DISCLOSE_ID ||
      !languageItems.some((entry) => entry.canonicalId === item.id),
  );

  function handlePlacePick(item) {
    if (item.id === ANTARCTICA_ID) {
      onBlockedAntarctica?.();
      return false;
    }
    if (item.id === DISCLOSE_ID) {
      setPlaceValue('');
      setPlacePicked(item);
      return;
    }
    setPlaceValue(item.name);
    setPlacePicked(item);
  }

  function addLanguage(itemOrText) {
    const picked = typeof itemOrText === 'string' ? null : itemOrText;
    const rawAnswer = (picked?.name ?? itemOrText).trim();
    if (!rawAnswer) return;

    const canonicalId = picked?.id ?? findCanonicalMatch(rawAnswer, languages);

    if (canonicalId === DISCLOSE_ID) {
      setLanguageItems([
        {
          rawAnswer: 'I prefer not to disclose',
          canonicalId: DISCLOSE_ID,
        },
      ]);
      setLanguageValue('');
      return;
    }

    setLanguageItems((current) => {
      const withoutDisclose = current.filter(
        (entry) => entry.canonicalId !== DISCLOSE_ID,
      );
      const duplicate = withoutDisclose.some((entry) => {
        if (canonicalId && entry.canonicalId === canonicalId) return true;
        return entry.rawAnswer.toLowerCase() === rawAnswer.toLowerCase();
      });
      if (duplicate) return withoutDisclose;
      return [...withoutDisclose, { rawAnswer, canonicalId }];
    });
    setLanguageValue('');
  }

  function removeLanguage(index) {
    setLanguageItems((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const grewUp = resolveSingle(placeValue, placePicked, countries);
    if (grewUp.canonicalId === ANTARCTICA_ID) {
      onBlockedAntarctica?.();
      return;
    }

    let items = languageItems.filter(
      (entry) => entry.canonicalId !== DISCLOSE_ID,
    );
    const pending = languageValue.trim();
    if (pending) {
      const canonicalId =
        findCanonicalMatch(pending, languages) ?? null;
      if (canonicalId === DISCLOSE_ID) {
        items = [];
      } else {
        const duplicate = items.some((entry) => {
          if (canonicalId && entry.canonicalId === canonicalId) return true;
          return entry.rawAnswer.toLowerCase() === pending.toLowerCase();
        });
        if (!duplicate) {
          items = [...items, { rawAnswer: pending, canonicalId }];
        }
      }
    }

    const skippedLanguages = items.length === 0;
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
            placePicked?.id === DISCLOSE_ID
              ? 'background-field is-withheld'
              : 'background-field'
          }
        >
          <label htmlFor="grew-up">In which country or region did you grow up?</label>
          <AutocompleteInput
            id="grew-up"
            value={placeValue}
            disabled={placePicked?.id === DISCLOSE_ID}
            onChange={(next) => {
              if (placePicked?.id === DISCLOSE_ID) return;
              setPlaceValue(next);
              setPlacePicked(null);
            }}
            onPickSuggestion={handlePlacePick}
            suggestions={placePicked?.id === DISCLOSE_ID ? [] : placeSuggestions}
            placeholder="Country, region, or continent..."
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={placePicked?.id === DISCLOSE_ID}
              onChange={(event) => {
                if (event.target.checked) {
                  handlePlacePick({
                    id: DISCLOSE_ID,
                    name: 'I prefer not to disclose',
                  });
                  return;
                }
                setPlaceValue('');
                setPlacePicked(null);
              }}
            />
            <span>I prefer not to disclose</span>
          </label>
        </div>

        <div
          className={
            languageItems.length === 1 &&
            languageItems[0]?.canonicalId === DISCLOSE_ID
              ? 'background-field is-withheld'
              : 'background-field'
          }
        >
          <label htmlFor="languages-spoken">What language(s) do you speak?</label>
          {languageItems.some((entry) => entry.canonicalId !== DISCLOSE_ID) ? (
            <ul className="chip-list">
              {languageItems.map((entry, index) =>
                entry.canonicalId === DISCLOSE_ID ? null : (
                  <li key={`${entry.canonicalId ?? entry.rawAnswer}-${index}`}>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => removeLanguage(index)}
                    >
                      {entry.rawAnswer}
                      <span aria-hidden="true"> ×</span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          ) : null}
          <AutocompleteInput
            id="languages-spoken"
            value={languageValue}
            disabled={
              languageItems.length === 1 &&
              languageItems[0]?.canonicalId === DISCLOSE_ID
            }
            onChange={(next) => {
              if (
                languageItems.length === 1 &&
                languageItems[0]?.canonicalId === DISCLOSE_ID
              ) {
                return;
              }
              setLanguageValue(next);
            }}
            onPickSuggestion={addLanguage}
            onCommit={addLanguage}
            suggestions={
              languageItems.length === 1 &&
              languageItems[0]?.canonicalId === DISCLOSE_ID
                ? []
                : languageSuggestions
            }
            placeholder="Type a language..."
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={
                languageItems.length === 1 &&
                languageItems[0]?.canonicalId === DISCLOSE_ID
              }
              onChange={(event) => {
                if (event.target.checked) {
                  addLanguage({
                    id: DISCLOSE_ID,
                    name: 'I prefer not to disclose',
                  });
                  return;
                }
                setLanguageItems([]);
              }}
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
