import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function TeamPerformance({ teamId }) {
  const [team, setTeam] = useState(null);

  useEffect(() => {
    api.getTeamDetail(teamId).then(setTeam).catch(console.error);
  }, [teamId]);

  if (!team) return <div className="p4-empty">Loading team performance...</div>;

  return (
    <div className="p4-page">
      <h1>{team.team_name}</h1>
      <p style={{ color: "var(--p4-text-muted)" }}>Lead: {team.team_lead} · {team.developers} developers</p>

      <div className="p4-card-grid">
        <div className="p4-card">
          <div className="p4-card-label">Tasks</div>
          <div className="p4-card-value">{team.tasks}</div>
        </div>
        <div className="p4-card accent-green">
          <div className="p4-card-label">Completed</div>
          <div className="p4-card-value">{team.completed}</div>
        </div>
        <div className="p4-card accent-yellow">
          <div className="p4-card-label">In Progress</div>
          <div className="p4-card-value">{team.in_progress}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Blocked</div>
          <div className="p4-card-value">{team.blocked}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Overdue</div>
          <div className="p4-card-value">{team.overdue}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Progress %</div>
          <div className="p4-card-value">{team.progress_pct}%</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Open Bugs</div>
          <div className="p4-card-value">{team.open_bugs}</div>
        </div>
      </div>
    </div>
  );
}
