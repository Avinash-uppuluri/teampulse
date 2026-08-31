import React, { useEffect, useState } from "react";
import { api, downloadBlob } from "../../api/api";
import ReportFilters from "./ReportFilters";
import "../part4.css";

const REPORT_TYPES = [
  { key: "project", label: "Project Progress" },
  { key: "team", label: "Team Performance" },
  { key: "developer", label: "Developer Performance" },
  { key: "tasks", label: "Task Completion" },
  { key: "bugs", label: "Bug Summary" },
  { key: "qa", label: "QA Testing" },
  { key: "milestones", label: "Milestone Progress" },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState("project");
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .getReport(activeReport, filters)
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeReport]);

  const exportCsv = async () => {
    const blob = await api.exportReportCsv(activeReport, filters);
    downloadBlob(blob, `${activeReport}_report.csv`);
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="p4-page">
      <h1>Reports</h1>

      <div className="p4-tabs">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            className={activeReport === r.key ? "active" : ""}
            onClick={() => setActiveReport(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="p4-btn" onClick={load}>Run Report</button>
        <button className="p4-btn secondary" onClick={exportCsv} disabled={rows.length === 0}>
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="p4-empty">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="p4-empty">No data for the selected filters.</div>
      ) : (
        <table className="p4-table">
          <thead>
            <tr>{columns.map((c) => <th key={c}>{c.replace(/_/g, " ")}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => <td key={c}>{String(r[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
