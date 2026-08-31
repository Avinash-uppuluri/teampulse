import React from "react";
import "../part4.css";

export default function ReportFilters({ filters, onChange }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="p4-filters">
      <input type="date" value={filters.date_from || ""} onChange={set("date_from")} title="From date" />
      <input type="date" value={filters.date_to || ""} onChange={set("date_to")} title="To date" />
      <input
        placeholder="Project ID"
        value={filters.project || ""}
        onChange={set("project")}
        style={{ width: 100 }}
      />
      <input
        placeholder="Team ID"
        value={filters.team || ""}
        onChange={set("team")}
        style={{ width: 90 }}
      />
      <input
        placeholder="Developer ID"
        value={filters.developer || ""}
        onChange={set("developer")}
        style={{ width: 110 }}
      />
      <select value={filters.status || ""} onChange={set("status")}>
        <option value="">Any status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="CLOSED">Closed</option>
      </select>
      <select value={filters.priority || ""} onChange={set("priority")}>
        <option value="">Any priority</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  );
}
