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

export function Question5({
  onContinue,
  onBack,
  initialBackground,
  onBlockedAntarctica,
}) {
  const grewUp = initialBackground?.grewUp;
  const skippedPlace = !grewUp || grewUp.skipped;
  const languagesState = initialBackground?.languages;
  const skippedLanguages = !languagesState || languagesState.skipped;

  const [placeValue, setPlaceValue] = useState(
    skippedPlace ? '' : (grewUp.rawAnswer ?? ''),
  );
  const [placePicked, setPlacePicked] = useState(
    skippedPlace || !grewUp.canonicalId
      ? null
      : { id: grewUp.canonicalId, name: grewUp.rawAnswer },
  );
  const [languageValue, setLanguageValue] = useState('');
  const [languageItems, setLanguageItems] = useState(
    skippedLanguages ? [] : (languagesState.items ?? []),
  );

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
    <QuestionContainer questionNumber={5}>
      <h1 className="question-title">Would you mind sharing your background?</h1>
      <p className="microcopy">
        Skip either question if you’d rather not say — we’ll record “I prefer
        not to disclose.” You can also type something more specific.
      </p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="background-field">
          <label htmlFor="grew-up">In which country or region did you grow up?</label>
          <AutocompleteInput
            id="grew-up"
            value={placeValue}
            onChange={(next) => {
              setPlaceValue(next);
              setPlacePicked(null);
            }}
            onPickSuggestion={handlePlacePick}
            suggestions={placeSuggestions}
            placeholder="Country, region, or continent..."
            autoFocus={false}
          />
          <button
            className="disclose-button"
            type="button"
            onClick={() =>
              handlePlacePick({
                id: DISCLOSE_ID,
                name: 'I prefer not to disclose',
              })
            }
          >
            I prefer not to disclose
          </button>
        </div>

        <div className="background-field">
          <label htmlFor="languages-spoken">What language(s) do you speak?</label>
          {languageItems.length > 0 ? (
            <ul className="chip-list">
              {languageItems.map((entry, index) => (
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
              ))}
            </ul>
          ) : null}
          <AutocompleteInput
            id="languages-spoken"
            value={languageValue}
            onChange={setLanguageValue}
            onPickSuggestion={addLanguage}
            onCommit={addLanguage}
            suggestions={languageSuggestions}
            placeholder="Type a language, then Enter..."
            autoFocus={false}
          />
          <button
            className="disclose-button"
            type="button"
            onClick={() => addLanguage({ id: DISCLOSE_ID, name: 'I prefer not to disclose' })}
          >
            I prefer not to disclose
          </button>
        </div>

        <QuestionNav onBack={onBack} />
      </form>
    </QuestionContainer>
  );
}
