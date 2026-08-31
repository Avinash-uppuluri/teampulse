import React from "react";

export default function ProjectStats({ stats }) {
  if (!stats) return null;

  const items = [
    { label: "Total projects", value: stats.total_projects },
    { label: "Active", value: stats.active_projects, variant: "accent" },
    { label: "Completed", value: stats.completed_projects },
    { label: "Delayed", value: stats.delayed_projects, variant: "danger" },
    { label: "At risk", value: stats.projects_at_risk, variant: "warn" },
    { label: "Deadlines (14d)", value: stats.upcoming_deadlines?.length ?? 0, variant: "warn" },
  ];

  return (
    <div className="tp-stats-grid">
      {items.map((item) => (
        <div key={item.label} className={`tp-stat-card ${item.variant ? `tp-stat-card--${item.variant}` : ""}`}>
          <div className="tp-stat-card__value">{item.value}</div>
          <div className="tp-stat-card__label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
