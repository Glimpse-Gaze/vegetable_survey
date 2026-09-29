import { useState } from 'react';

function formatVotes(n) {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? 'vote' : 'votes'}`;
}

function formatShare(share) {
  const pct = share * 100;
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

export function BucketColumns({ section }) {
  const [lookupId, setLookupId] = useState('');
  const selected =
    section.lookupItems.find((item) => item.id === lookupId) ?? null;

  return (
    <>
      <div className="bucket-results">
        {section.columns.map((column) => (
          <article key={column.id} className="bucket-card">
            <header className="bucket-card-head">
              <p className="bucket-card-kicker">Top 5</p>
              <h2 className="bucket-card-title">{column.title}</h2>
              {column.leader ? (
                <p className="bucket-card-summary">
                  {formatShare(column.leader.share)} of people{' '}
                  {column.id === 'in_between' ? 'put' : 'agree that'}{' '}
                  <strong>{column.leader.name}</strong>
                  {column.id === 'not_vegetable'
                    ? ' is not a vegetable'
                    : column.id === 'in_between'
                      ? ' somewhere in-between'
                      : ' is a vegetable'}
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
                        <span className="bucket-row-badge">Your vote</span>
                      ) : null}
                    </div>
                    <p className="bucket-row-meta">
                      {formatVotes(item.votes)} · {formatShare(item.share)}
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
          <span>See the results for</span>
          <select
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
          >
            <option value="">Choose an item</option>
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
              How people sorted <strong>{selected.name}</strong>
              {selected.userBucket ? (
                <>
                  {' '}
                  · You sorted it as {' '}
                  <strong>
                    {
                      selected.rows.find((row) => row.id === selected.userBucket)
                        ?.title
                    }
                  </strong>
                </>
              ) : null}
            </p>
            <table className="bucket-lookup-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Votes</th>
                  <th>Share</th>
                  <th className="is-bar"> </th>
                </tr>
              </thead>
              <tbody>
                {selected.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.id === selected.userBucket ? 'is-yours' : undefined
                    }
                  >
                    <th scope="row">{row.title}</th>
                    <td>{formatVotes(row.votes)}</td>
                    <td>{formatShare(row.share)}</td>
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
