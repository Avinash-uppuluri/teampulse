import React from "react";

const STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"];
const HEALTHS = ["GREEN", "YELLOW", "RED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function ProjectFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="tp-filters">
      <input
        type="text"
        placeholder="Search by name or code"
        value={filters.search || ""}
        onChange={(e) => set("search", e.target.value)}
      />
      <select value={filters.status || ""} onChange={(e) => set("status", e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
      <select value={filters.health || ""} onChange={(e) => set("health", e.target.value)}>
        <option value="">All health</option>
        {HEALTHS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <select value={filters.priority || ""} onChange={(e) => set("priority", e.target.value)}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
}
