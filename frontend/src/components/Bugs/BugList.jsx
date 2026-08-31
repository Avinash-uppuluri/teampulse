import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import BugDetails from "./BugDetails";
import "../part4.css";

const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "FIXED", "RETEST", "CLOSED", "REJECTED", "REOPENED"];
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function BugList({ projectId, refreshKey }) {
  const [bugs, setBugs] = useState([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [selectedBugId, setSelectedBugId] = useState(null);

  const load = () => {
    api
      .getBugs({ project_id: projectId, status: status || undefined, severity: severity || undefined })
      .then(setBugs)
      .catch(console.error);
  };

  useEffect(load, [projectId, status, severity, refreshKey]);

  if (selectedBugId) {
    return (
      <BugDetails
        bugId={selectedBugId}
        onBack={() => {
          setSelectedBugId(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="p4-filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {bugs.length === 0 ? (
        <div className="p4-empty">No bugs match these filters.</div>
      ) : (
        <table className="p4-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((b) => (
              <tr key={b.id} onClick={() => setSelectedBugId(b.id)}>
                <td>{b.title}</td>
                <td><span className={`p4-badge severity-${b.severity.toLowerCase()}`}>{b.severity}</span></td>
                <td><span className={`p4-badge status-${b.status.toLowerCase()}`}>{b.status}</span></td>
                <td>{b.assigned_to_name || "Unassigned"}</td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
