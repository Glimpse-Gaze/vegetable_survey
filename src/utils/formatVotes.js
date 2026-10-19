function voteLabel(n, t, locale) {
  const value = Math.abs(Math.trunc(Number(n) || 0));
  if (locale === 'pl') {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (value === 1) return t('results.vote');
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return t('results.votesFew');
    }
    return t('results.votes');
  }
  if (locale === 'fr' && value <= 1) return t('results.vote');
  return value === 1 ? t('results.vote') : t('results.votes');
}

export function formatVotes(n, t, numberLocale, locale) {
  const count = n.toLocaleString(numberLocale);
  const label = voteLabel(n, t, locale);
  const tight = numberLocale.startsWith('zh') || numberLocale.startsWith('ko');
  return tight ? `${count}${label}` : `${count} ${label}`;
}
