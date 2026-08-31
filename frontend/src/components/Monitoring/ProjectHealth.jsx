import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function ProjectHealth({ projectId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getProjectDetail(projectId).then(setData).catch(console.error);
  }, [projectId]);

  if (!data) return <div className="p4-empty">Loading project health...</div>;

  const { project, progress, health, upcoming_deadlines } = data;

  return (
    <div className="p4-page">
      <h1>{project.name}</h1>

      <div className="p4-card" style={{ maxWidth: 420 }}>
        <div className="p4-card-label">Project Health</div>
        <div style={{ marginTop: 8 }}>
          <span className={`p4-badge status-${health.health.toLowerCase()}`} style={{ fontSize: 14, padding: "5px 12px" }}>
            {health.health}
          </span>
        </div>
        <ul style={{ marginTop: 12, fontSize: 13, color: "var(--p4-text-muted)" }}>
          {health.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>

      <h2>Progress</h2>
      <div className="p4-card-grid">
        <div className="p4-card">
          <div className="p4-card-label">Total Tasks</div>
          <div className="p4-card-value">{progress.total_tasks}</div>
        </div>
        <div className="p4-card accent-green">
          <div className="p4-card-label">Completed</div>
          <div className="p4-card-value">{progress.completed_tasks}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Completion %</div>
          <div className="p4-card-value">{progress.task_completion_pct}%</div>
        </div>
      </div>

      <h2>Upcoming Deadlines</h2>
      {upcoming_deadlines.length === 0 ? (
        <div className="p4-empty">No upcoming deadlines.</div>
      ) : (
        <table className="p4-table">
          <thead><tr><th>Task</th><th>Due</th></tr></thead>
          <tbody>
            {upcoming_deadlines.map((t) => (
              <tr key={t.id}><td>{t.title}</td><td>{new Date(t.due_date).toLocaleDateString()}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
