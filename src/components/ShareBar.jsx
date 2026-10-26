import { useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import {
  CHAT_NETWORKS,
  PUBLIC_SITE_URL,
  SOCIAL_NETWORKS,
  shouldCopyFirst,
} from '../utils/shareLinks.js';
import facebook from '../assets/Socials/Facebook.svg';
import x from '../assets/Socials/X.svg';
import instagram from '../assets/Socials/Instagram.svg';
import reddit from '../assets/Socials/Reddit.svg';
import bluesky from '../assets/Socials/Bluesky.svg';
import substack from '../assets/Socials/substack.svg';
import whatsapp from '../assets/Socials/Whatsapp.svg';
import wechat from '../assets/Socials/Wechat.svg';
import messenger from '../assets/Socials/Messenger.svg';
import telegram from '../assets/Socials/Telegram.svg';

const ICONS = {
  facebook,
  x,
  instagram,
  reddit,
  bluesky,
  substack,
  whatsapp,
  wechat,
  messenger,
  telegram,
};

function Glyph({ src }) {
  return (
    <span
      className="share-bar-glyph"
      style={{
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  const { t, locale } = useI18n();
  const [copiedId, setCopiedId] = useState('');
  const pageUrl = `${PUBLIC_SITE_URL}/${locale}`;
  const text = `${t('home.title')}. ${t('home.question')}`;
  const label = labelled ? t('share.invite') : t('share.label');

  function markCopied(id) {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(''), 1600);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      markCopied('copy');
    } catch {
      // Clipboard can be blocked; the address is still on each network link.
    }
  }

  function openNetwork(event, network) {
    const href = network.href(pageUrl, text);
    if (!shouldCopyFirst(network)) return;
    event.preventDefault();
    const payload = `${text} ${pageUrl}`;
    navigator.clipboard.writeText(payload).catch(() => {});
    if (!href) {
      markCopied(network.id);
      return;
    }
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.assign(href);
  }

  function renderNetwork(network, tipKey) {
    const href = network.href(pageUrl, text);
    const className = copiedId === network.id ? 'share-bar-btn is-copied' : 'share-bar-btn';
    const icon = copiedId === network.id ? <CheckIcon /> : <Glyph src={ICONS[network.id]} />;
    const tip = t(tipKey, { name: network.name });
    if (!href) {
      return (
        <button
          key={network.id}
          className={className}
          type="button"
          data-network={network.id}
          data-tooltip={tip}
          aria-label={tip}
          onClick={(event) => openNetwork(event, network)}
        >
          {icon}
        </button>
      );
    }
    const external = href.startsWith('http');
    return (
      <a
        key={network.id}
        className={className}
        data-network={network.id}
        data-tooltip={tip}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        aria-label={tip}
        onClick={(event) => openNetwork(event, network)}
      >
        {icon}
      </a>
    );
  }

  const copyTip = copiedId === 'copy' ? t('share.copied') : t('share.copy');

  return (
    <div className={labelled ? 'share-bar is-labelled' : 'share-bar'}>
      {labelled ? <p className="share-bar-label">{label}</p> : null}
      <div className="share-bar-rows" role="group" aria-label={label}>
        <div className="share-bar-buttons">
          {SOCIAL_NETWORKS.map((network) => renderNetwork(network, 'share.on'))}
          <button
            className={copiedId === 'copy' ? 'share-bar-btn is-copied' : 'share-bar-btn'}
            type="button"
            data-network="copy"
            data-tooltip={copyTip}
            onClick={copyLink}
            aria-label={copyTip}
          >
            {copiedId === 'copy' ? <CheckIcon /> : <LinkIcon />}
          </button>
        </div>
        <div className="share-bar-buttons">
          {CHAT_NETWORKS.map((network) => renderNetwork(network, 'share.via'))}
        </div>
      </div>
    </div>
  );
}
