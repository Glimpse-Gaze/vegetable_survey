/** Public homepage. Social crawlers need this origin, not the local dev URL. */
export const PUBLIC_SITE_URL = 'https://vegetable.glimpsegaze.com';

function enc(value) {
  return encodeURIComponent(value);
}

function message(url, text) {
  return `${text} ${url}`;
}

export function isMobileShare() {
  return typeof navigator !== 'undefined'
    && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Networks that open a compose box with the survey link filled in. */
export const SOCIAL_NETWORKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    href: (url, text) => `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
  },
  {
    id: 'x',
    name: 'X',
    href: (url, text) => `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    href: (url, text) => `https://bsky.app/intent/compose?text=${enc(message(url, text))}`,
  },
  {
    id: 'substack',
    name: 'Substack',
    href: (url, text) => `https://substack.com/notes?action=compose&message=${enc(message(url, text))}`,
  },
];

/** Chat apps. Some of these can only receive a link that was copied first. */
export const CHAT_NETWORKS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    href: (url, text) => `https://wa.me/?text=${enc(message(url, text))}`,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    href: (url) => {
      const link = enc(url);
      if (isMobileShare()) return `fb-messenger://share/?link=${link}`;
      return 'https://www.messenger.com/';
    },
    copyFirst: () => !isMobileShare(),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    href: (url, text) => `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: 'wechat',
    name: 'WeChat',
    copyFirst: true,
    href: () => (isMobileShare() ? 'weixin://' : 'https://web.wechat.com/'),
  },
];

export function shouldCopyFirst(network) {
  if (typeof network.copyFirst === 'function') return network.copyFirst();
  return Boolean(network.copyFirst);
}
