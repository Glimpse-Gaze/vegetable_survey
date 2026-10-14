import { useI18n } from '../i18n/useI18n.js';

export function LocaleSwitcher({ className = '' }) {
  const { t, locale, setLocale, locales } = useI18n();
  const classes = ['locale-switcher', className].filter(Boolean).join(' ');
  const changeLanguage = t('home.changeLanguage');

  return (
    <label className={classes} data-tooltip={changeLanguage}>
      <span className="sr-only">{changeLanguage}</span>
      <select
        value={locale}
        aria-label={changeLanguage}
        onChange={(event) => setLocale(event.target.value)}
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
