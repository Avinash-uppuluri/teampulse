import React from "react";
import ProjectCard from "./ProjectCard";

export default function ProjectList({ projects, loading }) {
  if (loading) return <div className="tp-empty-state">Loading projects…</div>;
  if (!projects.length) return <div className="tp-empty-state">No projects match these filters.</div>;

  return (
    <div className="tp-project-grid">
      {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
