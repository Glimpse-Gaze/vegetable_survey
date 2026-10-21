/** Public homepage. Social crawlers need this origin, not the local dev URL. */
export const PUBLIC_SITE_URL = 'https://vegetable.glimpsegaze.com';

function enc(value) {
  return encodeURIComponent(value);
}

export const SHARE_NETWORKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: 'x',
    name: 'X',
    href: (url, text) =>
      `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    href: (url, text) => `https://wa.me/?text=${enc(`${text} ${url}`)}`,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    href: (url, text) =>
      `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
  },
];
