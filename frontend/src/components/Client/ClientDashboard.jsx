import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import ClientFeedback from "./ClientFeedback";
import "../part4.css";

// Restricted view: only shows client-safe fields returned by the backend
// (never internal comments, dev performance, or sensitive info).
export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.getClientProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="p4-page">
      <h1>My Projects</h1>

      <div className="p4-card-grid">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`p4-card accent-${p.health === "GREEN" ? "green" : p.health === "RED" ? "red" : "yellow"}`}
            style={{ cursor: "pointer" }}
            onClick={() => setSelected(p)}
          >
            <div className="p4-card-label">{p.name}</div>
            <div className="p4-card-value">{p.overall_progress_pct}%</div>
            <span className={`p4-badge status-${p.health.toLowerCase()}`}>{p.health}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div>
          <h2>{selected.name}</h2>
          <p style={{ color: "var(--p4-text-muted)" }}>
            Status: {selected.status} · Deadline: {selected.end_date ? new Date(selected.end_date).toLocaleDateString() : "TBD"}
          </p>

          <h2>Milestones</h2>
          {selected.milestones?.length ? (
            <table className="p4-table">
              <thead><tr><th>Milestone</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {selected.milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{new Date(m.due_date).toLocaleDateString()}</td>
                    <td><span className="p4-badge">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p4-empty">No milestones recorded.</div>
          )}

          <h2>High-Level Issues</h2>
          <div className="p4-card-grid">
            <div className="p4-card accent-red">
              <div className="p4-card-label">Open Issues</div>
              <div className="p4-card-value">{selected.high_level_issues.open}</div>
            </div>
            <div className="p4-card accent-red">
              <div className="p4-card-label">Critical</div>
              <div className="p4-card-value">{selected.high_level_issues.critical}</div>
            </div>
          </div>

          <ClientFeedback projectId={selected.id} />
        </div>
      )}
    </div>
  );
}
