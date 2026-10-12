import { useI18n } from '../i18n/useI18n.js';

export function LocaleSwitcher({ className = '' }) {
  const { t, locale, setLocale, locales } = useI18n();
  const classes = ['locale-switcher', className].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <span className="sr-only">{t('home.language')}</span>
      <select
        value={locale}
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
