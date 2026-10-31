import { useI18n } from '../i18n/useI18n.js';
import brandMark from '../assets/Glimpse_general.png';

const BRAND_URL = 'https://glimpsegaze.com';
export const SUPPORT_URL = 'https://buymeacoffee.com/glimpsegaze';

export function BrandFooter({ className = '', version }) {
  const { locale, t } = useI18n();
  const classes = ['brand-footer', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <img
        className="brand-footer-mark"
        src={brandMark}
        alt=""
        width={36}
        height={36}
        aria-hidden="true"
      />
      <p className="brand-footer-credit">
        {locale === 'zh' || locale === 'zh-hant' ? (
          <>
            <a href={BRAND_URL} target="_blank" rel="noreferrer">
              {t('brand.name')}
            </a>{' '}
            {t('brand.createdPrefix')}
          </>
        ) : (
          <>
            {t('brand.createdPrefix')}{' '}
            <a href={BRAND_URL} target="_blank" rel="noreferrer">
              {t('brand.name')}
            </a>
          </>
        )}
      </p>
      <p className="brand-footer-support">
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          {t('brand.support')}
        </a>
      </p>
      {version ? <p className="brand-footer-version">{version}</p> : null}
    </div>
  );
}
