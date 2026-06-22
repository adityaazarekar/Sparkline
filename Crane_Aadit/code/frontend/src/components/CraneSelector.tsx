interface Props {
  craneIds: string[];
  selected: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function CraneSelector({ craneIds, selected, onChange, disabled = false }: Props) {
  return (
    <div className="selector">
      <label className="selector__label" htmlFor="crane-select">
        Active Unit Select
      </label>
      <div className="selector__wrap">
        <select
          id="crane-select"
          className="selector__input"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {craneIds.length === 0 ? (
            <option value="">No units available</option>
          ) : (
            craneIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))
          )}
        </select>
        <span className="selector__chevron" aria-hidden="true">
          ▼
        </span>
      </div>
    </div>
  );
}
