import React from "react";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../utils/taskHelpers";

export default function TaskFilters({ filters, onChange, developers = [] }) {
  const set = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="task-filters">
      <input
        className="task-filters-search"
        type="text"
        placeholder="Search tasks by title or description"
        value={filters.search || ""}
        onChange={(e) => set("search", e.target.value)}
      />

      <select value={filters.status || ""} onChange={(e) => set("status", e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select value={filters.priority || ""} onChange={(e) => set("priority", e.target.value)}>
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {developers.length > 0 && (
        <select
          value={filters.developer_id || ""}
          onChange={(e) => set("developer_id", e.target.value)}
        >
          <option value="">All developers</option>
          {developers.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.name}
            </option>
          ))}
        </select>
      )}

      <input
        type="date"
        value={filters.due_before || ""}
        onChange={(e) => set("due_before", e.target.value)}
        title="Due before"
      />

      {(filters.search || filters.status || filters.priority || filters.developer_id || filters.due_before) && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onChange({})}
        >
          Clear
        </button>
      )}
    </div>
  );
}
