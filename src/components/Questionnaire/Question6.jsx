import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { ConfirmDialog } from '../ConfirmDialog.jsx';
import { QuestionContainer } from './QuestionContainer.jsx';
import { QuestionNav } from './QuestionNav.jsx';

const MAX_LENGTH = 500;
const MIN_PUBLIC_NOTE = 3;

export function Question6({ onContinue, onBack, initialDescription }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === 'pl' ? 'pl-PL' : 'en';
  const [text, setText] = useState(initialDescription?.text ?? '');
  const [publicDisplay, setPublicDisplay] = useState(
    initialDescription?.publicDisplay ?? false,
  );
  const [askSkip, setAskSkip] = useState(false);

  function commit(nextText) {
    const trimmed = nextText.trim();
    const publish = publicDisplay && trimmed.length >= MIN_PUBLIC_NOTE;
    onContinue({
      openDescription: {
        text: publish || !publicDisplay ? trimmed : '',
        publicDisplay: publish,
      },
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setAskSkip(true);
      return;
    }
    commit(text);
  }

  return (
    <QuestionContainer questionNumber={6}>
      <h1 className="question-title">{t('q6.title')}</h1>
      <p className="microcopy">{t('q6.micro')}</p>

      <form className="question-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="open-description">
          {t('q6.label')}
        </label>
        <textarea
          id="open-description"
          className="open-description"
          value={text}
          maxLength={MAX_LENGTH}
          rows={8}
          onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
          placeholder={t('q6.placeholder')}
        />
        <p className="character-count">
          {text.length.toLocaleString(numberLocale)} / {MAX_LENGTH.toLocaleString(numberLocale)}
        </p>

        <label className="public-consent">
          <input
            className="criterion-input"
            type="checkbox"
            checked={publicDisplay}
            onChange={(event) => setPublicDisplay(event.target.checked)}
          />
          <span>{t('q6.publicConsent')}</span>
        </label>

        <QuestionNav onBack={onBack} />
      </form>
      {askSkip ? (
        <ConfirmDialog
          title={t('q6.skipTitle')}
          message={t('q6.skipMessage')}
          confirmLabel={t('dialog.proceed')}
          cancelLabel={t('dialog.cancel')}
          onConfirm={() => commit('')}
          onCancel={() => setAskSkip(false)}
        />
      ) : null}
    </QuestionContainer>
  );
}
