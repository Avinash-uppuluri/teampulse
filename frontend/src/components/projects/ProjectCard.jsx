import React from "react";
import { useNavigate } from "react-router-dom";
import HealthIndicator from "./HealthIndicator";
import DeadlineBadge from "./DeadlineBadge";

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <div className="tp-project-card" onClick={() => navigate(`/projects/${project.id}`)} role="button" tabIndex={0}>
      <div className="tp-project-card__top">
        <div>
          <h3 className="tp-project-card__name">{project.name}</h3>
          <div className="tp-project-card__meta">
            <span className="tp-code">{project.project_code}</span>
            <span className={`tp-priority--${project.priority}`}>{project.priority}</span>
          </div>
        </div>
        <HealthIndicator health={project.health} />
      </div>

      <div>
        <div className="tp-progress-track">
          <div className="tp-progress-fill" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="tp-project-card__meta" style={{ marginTop: 6 }}>
          <span>{project.progress}% complete</span>
          <span className="tp-status-pill">{project.status.replace("_", " ")}</span>
        </div>
      </div>

      <div className="tp-project-card__footer">
        <DeadlineBadge date={project.end_date} status={project.status} />
        <div className="tp-avatar-stack">
          <span title={`${project.team_member_count} team members`}>
            {project.team_member_count}
          </span>
        </div>
      </div>
    </div>
  );
}
