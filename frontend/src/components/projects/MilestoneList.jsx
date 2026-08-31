import React, { useState } from "react";
import { MilestonesAPI } from "../../api/client";
import DeadlineBadge from "./DeadlineBadge";
import MilestoneForm from "./MilestoneForm";

const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  DELAYED: "Delayed",
};

export default function MilestoneList({ projectId, milestones, canManage, onChanged }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleDelete = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.name}"?`)) return;
    await MilestonesAPI.remove(milestone.id);
    onChanged();
  };

  return (
    <div className="tp-panel">
      <div className="tp-panel__header">
        <h3>Milestones</h3>
        {canManage && (
          <button className="tp-btn tp-btn--primary tp-btn--sm" onClick={() => setCreating(true)}>+ New milestone</button>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="tp-empty-state">No milestones yet.</div>
      ) : (
        milestones.map((m) => (
          <div className="tp-milestone-row" key={m.id}>
            <div className="tp-milestone-row__main">
              <span className="tp-milestone-row__title">{m.name}</span>
              <div className="tp-project-card__meta">
                <span className="tp-status-pill">{STATUS_LABELS[m.status]}</span>
                <DeadlineBadge date={m.due_date} status={m.status === "COMPLETED" ? "COMPLETED" : null} />
              </div>
            </div>
            <div className="tp-milestone-row__progress">
              <div className="tp-progress-track">
                <div className="tp-progress-fill" style={{ width: `${m.progress}%` }} />
              </div>
              <span style={{ fontSize: "var(--tp-text-xs)", width: 34 }}>{m.progress}%</span>
            </div>
            {canManage && (
              <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                <button className="tp-btn tp-btn--ghost tp-btn--sm" onClick={() => setEditing(m)}>Edit</button>
                <button className="tp-btn tp-btn--ghost tp-btn--sm" onClick={() => handleDelete(m)}>Delete</button>
              </div>
            )}
          </div>
        ))
      )}

      {creating && (
        <MilestoneForm
          projectId={projectId}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); onChanged(); }}
        />
      )}
      {editing && (
        <MilestoneForm
          projectId={projectId}
          milestone={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </div>
  );
}
