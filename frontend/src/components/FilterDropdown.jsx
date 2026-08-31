export default function FilterDropdown({ value, onChange, options, allLabel = "All" }) {
  return (
    <div className="filter-dropdown">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
