import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import BugHistory from "./BugHistory";
import "../part4.css";

// Mirrors backend VALID_TRANSITIONS so the UI only offers legal next steps.
const TRANSITIONS = {
  OPEN: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN", "REJECTED"],
  IN_PROGRESS: ["FIXED", "ASSIGNED"],
  FIXED: ["RETEST"],
  RETEST: ["CLOSED", "REOPENED", "IN_PROGRESS"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: [],
};

export default function BugDetails({ bugId, onBack }) {
  const [bug, setBug] = useState(null);
  const [comment, setComment] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  const load = () => api.getBug(bugId).then(setBug).catch(console.error);

  useEffect(load, [bugId]);

  const transition = async (newStatus) => {
    await api.updateBugStatus(bugId, { status: newStatus, comment });
    setComment("");
    setHistoryKey((k) => k + 1);
    load();
  };

  if (!bug) return <div className="p4-empty">Loading bug...</div>;

  const nextSteps = TRANSITIONS[bug.status] || [];

  return (
    <div>
      <button className="p4-btn secondary" onClick={onBack}>← Back to list</button>

      <div className="p4-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>{bug.title}</h2>
          <span className={`p4-badge severity-${bug.severity.toLowerCase()}`}>{bug.severity}</span>
        </div>
        <p style={{ color: "var(--p4-text-muted)" }}>
          Reported by {bug.reported_by_name} · Assigned to {bug.assigned_to_name || "Unassigned"} · {bug.environment}
        </p>
        <p>{bug.description}</p>
        <span className={`p4-badge status-${bug.status.toLowerCase()}`}>{bug.status}</span>
      </div>

      {nextSteps.length > 0 && (
        <div className="p4-form" style={{ marginTop: 16 }}>
          <label>Comment (optional)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {nextSteps.map((s) => (
              <button key={s} className="p4-btn" onClick={() => transition(s)}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      <h2>History</h2>
      <BugHistory bugId={bugId} refreshKey={historyKey} />
    </div>
  );
}
