import { useEffect, useState } from 'react';
import { featuredCountryIds } from '../../data/countries.js';
import { featuredLanguageIds } from '../../data/languages.js';
import { useI18n } from '../../i18n/useI18n.js';
import { useSurveyCatalog } from '../../i18n/useSurveyCatalog.js';
import {
  findCanonicalMatch,
  getLookupSuggestions,
} from '../../utils/autocomplete.js';
import { AutocompleteInput } from './AutocompleteInput.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const DISCLOSE_ID = 'prefer_not_to_disclose';
const ANTARCTICA_ID = 'antarctica';

function resolveSingle(raw, picked, items, discloseLabel) {
  const rawAnswer = (picked?.name ?? raw).trim();
  if (!rawAnswer) {
    return {
      rawAnswer: discloseLabel,
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
  const { t, locale } = useI18n();
  const { countries, languages } = useSurveyCatalog();
  const discloseLabel = t('q7.preferNot');
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
    locale,
  }).filter((item) => item.id !== DISCLOSE_ID);
  const languageSuggestions = getLookupSuggestions(languageValue, languages, {
    featuredIds: featuredLanguageIds,
    limit: 10,
    locale,
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
          rawAnswer: discloseLabel,
          canonicalId: DISCLOSE_ID,
          skipped: true,
          withheld: true,
          remembered: placeValue
            ? { rawAnswer: placeValue, canonicalId: placePicked?.id ?? null }
            : null,
        }
      : {
          ...resolveSingle(placeValue, placePicked, countries, discloseLabel),
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
    discloseLabel,
    countries,
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    const resolvedPlace = resolveSingle(placeValue, placePicked, countries, discloseLabel);
    if (!placeWithheld && resolvedPlace.canonicalId === ANTARCTICA_ID) {
      setDoubt(true);
      return;
    }

    const grewUp = placeWithheld
      ? {
          rawAnswer: discloseLabel,
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
            rawAnswer: discloseLabel,
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
      <h1 className="question-title">{t('q7.title')}</h1>
      <p className="microcopy">{t('q7.micro')}</p>

      <form className="question-form" onSubmit={handleSubmit}>
        <div
          className={
            placeWithheld ? 'background-field is-withheld' : 'background-field'
          }
        >
          <label htmlFor="grew-up">{t('q7.grewUp')}</label>
          {doubt ? (
            <p className="field-note" role="status">
              {t('q7.doubt')}
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
            placeholder={t('q7.grewUpPlaceholder')}
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={placeWithheld}
              onChange={(event) => setPlaceWithheld(event.target.checked)}
            />
            <span>{t('q7.preferNot')}</span>
          </label>
        </div>

        <div
          className={
            languageWithheld ? 'background-field is-withheld' : 'background-field'
          }
        >
          <label htmlFor="languages-spoken">{t('q7.language')}</label>
          {languageItems.length > 0 ? (
            <ul className="chip-list">
              {languageItems.map((entry, index) => (
                <li key={`${entry.canonicalId ?? entry.rawAnswer}-${index}`}>
                  <button
                    type="button"
                    className={languageWithheld ? 'chip is-held' : 'chip'}
                    disabled={languageWithheld}
                    aria-label={t('q7.removeLanguage', { name: entry.rawAnswer })}
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
            placeholder={t('q7.languagePlaceholder')}
            autoFocus={false}
          />
          <label className="disclose-check">
            <input
              type="checkbox"
              checked={languageWithheld}
              onChange={(event) => setLanguageWithheld(event.target.checked)}
            />
            <span>{t('q7.preferNot')}</span>
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
