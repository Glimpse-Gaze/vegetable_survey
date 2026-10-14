import { useI18n } from '../i18n/useI18n.js';
import brandMark from '../assets/Glimpse_general.png';

const BRAND_URL = 'https://glimpsegaze.com';

export function BrandFooter({ className = '' }) {
  const { t } = useI18n();
  const classes = ['brand-footer', className].filter(Boolean).join(' ');

  return (
    <p className={classes}>
      <img
        className="brand-footer-mark"
        src={brandMark}
        alt=""
        width={36}
        height={36}
        aria-hidden="true"
      />
      <span>
        {t('brand.createdPrefix')}{' '}
        <a href={BRAND_URL} target="_blank" rel="noreferrer">
          {t('brand.name')}
        </a>
      </span>
    </p>
  );
}
