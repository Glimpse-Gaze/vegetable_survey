import { useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import { PUBLIC_SITE_URL, SHARE_NETWORKS } from '../utils/shareLinks.js';

function Icon({ id }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  if (id === 'facebook') {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M14.2 8.4V6.9c0-.5.3-.7.7-.7h1.1V4h-2.1C11.6 4 10.6 5.3 10.6 6.9v1.5H9v2.2h1.6V20h2.6v-9.4h2l.4-2.2h-2.4z"
        />
      </svg>
    );
  }
  if (id === 'x') {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M14.7 4h2.8l-6.1 7 7.2 9h-5.6l-4.4-5.8L6.4 20H3.6l6.5-7.5L3.2 4h5.7l4 5.3L14.7 4zm-1 14.4h1.5L7.4 5.5H5.8l7.9 12.9z"
        />
      </svg>
    );
  }
  if (id === 'whatsapp') {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12.1 3.6A8.2 8.2 0 0 0 5.2 16.1L4 20.4l4.4-1.2a8.2 8.2 0 0 0 3.7.9 8.2 8.2 0 0 0 0-16.5zm0 14.9c-1.2 0-2.3-.3-3.3-.9l-.2-.1-2.6.7.7-2.5-.2-.2a6.6 6.6 0 1 1 5.6 3zm3.6-4.9c-.2-.1-1.2-.6-1.3-.6s-.3-.1-.5.1-.5.6-.7.8-.2.2-.4.1a5.4 5.4 0 0 1-2.7-2.3c-.2-.3 0-.4.1-.5l.3-.4.1-.2c0-.1 0-.2-.1-.3l-.6-1.4c-.2-.4-.3-.3-.5-.3h-.4c-.1 0-.3.1-.5.3s-.7.7-.7 1.6.7 1.9.8 2 .1.3 1.5 2.3c1 1 1.9 1.4 2.2 1.5s.5.1.7 0 .9-.4 1-.8.1-.7.1-.8-.2-.1-.4-.2z"
        />
      </svg>
    );
  }
  if (id === 'reddit') {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12 1.1A10.9 10.9 0 0 0 1.1 12 10.9 10.9 0 0 0 12 22.9 10.9 10.9 0 0 0 22.9 12 10.9 10.9 0 0 0 12 1.1zm4.55 3.32c.63 0 1.14.51 1.14 1.14a1.14 1.14 0 0 1-2.27.05l-2.36-.5-.73 3.41c1.66.06 3.17.58 4.25 1.36.28-.28.66-.45 1.1-.45.88 0 1.6.71 1.6 1.6 0 .65-.4 1.21-.92 1.47.02.15.04.32.04.47 0 2.45-2.85 4.43-6.37 4.43s-6.37-1.98-6.37-4.43c0-.17.01-.33.04-.49a1.59 1.59 0 0 1-.92-1.45c0-.88.72-1.6 1.6-1.6.42 0 .81.17 1.1.45 1.1-.8 2.62-1.3 4.32-1.36l.8-3.81a.31.31 0 0 1 .13-.18.32.32 0 0 1 .22-.04l2.64.56a1.1 1.1 0 0 1 1.01-.64zM9.4 11.7a1.14 1.14 0 1 1 0 2.28 1.14 1.14 0 0 1 0-2.28zm5.2 0a1.14 1.14 0 1 1 0 2.28 1.14 1.14 0 0 1 0-2.28zm-4.98 3.63a.3.3 0 0 0-.21.09.3.3 0 0 0 0 .42c.77.77 2.26.83 2.69.83.44 0 1.92-.05 2.7-.83a.33.33 0 0 0 .02-.42.3.3 0 0 0-.42 0c-.5.48-1.53.66-2.29.66-.75 0-1.8-.18-2.28-.66a.3.3 0 0 0-.21-.09z"
        />
      </svg>
    );
  }
  if (id === 'check') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12.5 9.2 17 19 7"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13.2a4.2 4.2 0 0 0 6.3.4l1.7-1.7a4.2 4.2 0 0 0-6-5.9L10.8 7.2"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 10.8a4.2 4.2 0 0 0-6.3-.4l-1.7 1.7a4.2 4.2 0 0 0 6 5.9l1.1-1.1"
      />
    </svg>
  );
}

export function ShareBar({ labelled = false }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const text = `${t('home.title')}. ${t('home.question')}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(PUBLIC_SITE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the address is still on each network link.
    }
  }

  return (
    <div className={labelled ? 'share-bar is-labelled' : 'share-bar'}>
      {labelled ? <p className="share-bar-label">{t('share.invite')}</p> : null}
      <div className="share-bar-buttons" role="group" aria-label={labelled ? t('share.invite') : t('share.label')}>
        {SHARE_NETWORKS.map((network) => (
          <a
            key={network.id}
            className="share-bar-btn"
            data-network={network.id}
            href={network.href(PUBLIC_SITE_URL, text)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('share.on', { name: network.name })}
          >
            <Icon id={network.id} />
          </a>
        ))}
        <button
          className={copied ? 'share-bar-btn is-copied' : 'share-bar-btn'}
          type="button"
          data-network="copy"
          onClick={copyLink}
          aria-label={copied ? t('share.copied') : t('share.copy')}
        >
          <Icon id={copied ? 'check' : 'link'} />
        </button>
      </div>
    </div>
  );
}
