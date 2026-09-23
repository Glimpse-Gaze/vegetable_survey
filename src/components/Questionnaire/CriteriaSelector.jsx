export function CriteriaSelector({ criteria, selectedIds, atLimit, onToggle }) {
  return (
    <ul className="criteria-list">
      {criteria.map((criterion) => {
        const selected = selectedIds.includes(criterion.id);
        const locked = atLimit && !selected;
        return (
          <li key={criterion.id}>
            <label
              className={[
                'criterion-card',
                selected ? 'is-selected' : '',
                locked ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                className="criterion-input"
                type="checkbox"
                checked={selected}
                disabled={locked}
                onChange={() => onToggle(criterion.id)}
              />
              <span className="criterion-label">{criterion.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
