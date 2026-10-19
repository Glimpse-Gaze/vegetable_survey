import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';

let suppressTip = false;

export function LocaleSwitcher({ className = '' }) {
  const { t, locale, setLocale, locales } = useI18n();
  const labelRef = useRef(null);
  const [tipQuiet, setTipQuiet] = useState(suppressTip);
  const classes = ['locale-switcher', className, tipQuiet ? 'is-tip-quiet' : ''].filter(Boolean).join(' ');
  const changeLanguage = t('home.changeLanguage');

  useEffect(() => {
    const label = labelRef.current;
    if (!label || !suppressTip || label.matches(':hover')) return;
    suppressTip = false;
    setTipQuiet(false);
  }, []);

  function quietTip() {
    suppressTip = true;
    setTipQuiet(true);
  }

  function releaseTip() {
    suppressTip = false;
    setTipQuiet(false);
  }

  return (
    <label
      ref={labelRef}
      className={classes}
      data-tooltip={changeLanguage}
      onPointerDown={quietTip}
      onPointerLeave={releaseTip}
      onPointerCancel={releaseTip}
    >
      <span className="sr-only">{changeLanguage}</span>
      <select
        value={locale}
        aria-label={changeLanguage}
        onChange={(event) => {
          quietTip();
          setLocale(event.target.value);
        }}
      >
        {locales.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
