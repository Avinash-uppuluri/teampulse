import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function DeveloperPerformance({ userId }) {
  const [dev, setDev] = useState(null);

  useEffect(() => {
    api.getDeveloperDetail(userId).then(setDev).catch(console.error);
  }, [userId]);

  if (!dev) return <div className="p4-empty">Loading developer performance...</div>;

  return (
    <div className="p4-page">
      <h1>{dev.developer}</h1>

      <div className="p4-card-grid">
        <div className="p4-card">
          <div className="p4-card-label">Assigned Tasks</div>
          <div className="p4-card-value">{dev.assigned_tasks}</div>
        </div>
        <div className="p4-card accent-green">
          <div className="p4-card-label">Completed</div>
          <div className="p4-card-value">{dev.completed}</div>
        </div>
        <div className="p4-card accent-yellow">
          <div className="p4-card-label">In Progress</div>
          <div className="p4-card-value">{dev.in_progress}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Blocked</div>
          <div className="p4-card-value">{dev.blocked}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Overdue</div>
          <div className="p4-card-value">{dev.overdue}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Completion %</div>
          <div className="p4-card-value">{dev.completion_pct}%</div>
        </div>
        {dev.avg_completion_hours != null && (
          <div className="p4-card">
            <div className="p4-card-label">Avg Completion Time</div>
            <div className="p4-card-value">{dev.avg_completion_hours}h</div>
          </div>
        )}
      </div>
    </div>
  );
}
