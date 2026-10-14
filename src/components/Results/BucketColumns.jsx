import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';

function formatVotes(n, t, numberLocale) {
  return `${n.toLocaleString(numberLocale)} ${n === 1 ? t('results.vote') : t('results.votes')}`;
}

function formatShare(share) {
  const pct = Math.min(100, Math.max(0, (share ?? 0) * 100));
  if (pct > 0 && pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

export function BucketColumns({ section }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const [lookupId, setLookupId] = useState('');
  const selected =
    section.lookupItems.find((item) => item.id === lookupId) ?? null;

  return (
    <>
      <div className="bucket-results">
        {section.columns.map((column) => (
          <article key={column.id} className={`bucket-card is-${column.id}`}>
            <header className="bucket-card-head">
              <p className="bucket-card-kicker">{t('results.top5')}</p>
              <h2 className="bucket-card-title">{column.title}</h2>
              {column.leader ? (
                <p className="bucket-card-summary">
                  {formatShare(column.leader.share)}
                  {column.id === 'in_between'
                    ? t('results.buckets.put')
                    : t('results.buckets.agreeIs')}
                  <strong>{column.leader.name}</strong>
                  {column.id === 'not_vegetable'
                    ? t('results.buckets.notVeg')
                    : column.id === 'in_between'
                      ? t('results.buckets.inBetween')
                      : t('results.buckets.isVeg')}
                </p>
              ) : null}
            </header>
            <ol className="bucket-list">
              {column.items.map((item) => (
                <li
                  key={item.id}
                    className={[
                      'bucket-row',
                      item.rank === 1 ? 'is-leader' : '',
                      item.isYours ? 'is-yours' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                >
                  <span className="bucket-row-rank">#{item.rank}</span>
                  <div className="bucket-row-body">
                    <div className="bucket-row-topline">
                      <strong className="bucket-row-name">{item.name}</strong>
                      {item.isYours ? (
                        <span className="bucket-row-badge">{t('results.yourVote')}</span>
                      ) : null}
                    </div>
                    <p className="bucket-row-meta">
                      {formatVotes(item.votes, t, numberLocale)} · {formatShare(item.share)}
                    </p>
                    <div className="bucket-row-meter" aria-hidden="true">
                      <span style={{ width: `${item.share * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <div className="bucket-lookup">
        <label className="bucket-lookup-label">
          <span>{t('results.buckets.lookupLabel')}</span>
          <select
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
          >
            <option value="">{t('results.buckets.chooseItem')}</option>
            {section.lookupItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {selected ? (
          <div className="bucket-lookup-card">
            <p className="bucket-lookup-lead">
              {t('results.buckets.howSorted')} <strong>{selected.name}</strong>
              {selected.userBucket ? (
                <>
                  {' '}
                  · <span className="bucket-lookup-yours">{t('results.buckets.youMarked')}{' '}
                  <strong>
                    {
                      selected.rows.find((row) => row.id === selected.userBucket)
                        ?.title
                    }
                  </strong>
                  </span>
                </>
              ) : null}
            </p>
            <table className="bucket-lookup-table">
              <thead>
                <tr>
                  <th>{t('results.buckets.category')}</th>
                  <th className="is-votes">{t('results.buckets.votesCol')}</th>
                  <th className="is-bar"> </th>
                </tr>
              </thead>
              <tbody>
                {selected.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={[
                      row.id === selected.userBucket ? 'is-yours' : '',
                      `is-${row.id}`,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined}
                  >
                    <th scope="row">{row.title}</th>
                    <td className="is-votes">{formatVotes(row.votes, t, numberLocale)}</td>
                    <td className="is-bar">
                      <span className="bucket-lookup-meter" aria-hidden="true">
                        <span style={{ width: `${row.share * 100}%` }} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  );
}
