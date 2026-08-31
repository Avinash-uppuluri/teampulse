import React, { useEffect, useState, useCallback } from "react";
import { ProjectsAPI } from "../api/client";
import ProjectStats from "../components/projects/ProjectStats";
import ProjectFilters from "../components/projects/ProjectFilters";
import ProjectList from "../components/projects/ProjectList";
import ProjectForm from "../components/projects/ProjectForm";

export default function ProjectDashboard({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = currentUser?.role === "PROJECT_MANAGER" || currentUser?.role === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        ProjectsAPI.dashboard(),
        ProjectsAPI.list(filters),
      ]);
      setStats(statsRes.data);
      setProjects(projectsRes.data.items);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="tp-page-header">
        <div>
          <h1>Projects</h1>
          <p>Portfolio health, progress and upcoming deadlines across your projects.</p>
        </div>
        {canCreate && (
          <button className="tp-btn tp-btn--primary" onClick={() => setShowCreate(true)}>+ New project</button>
        )}
      </div>

      <ProjectStats stats={stats} />
      <ProjectFilters filters={filters} onChange={setFilters} />

      <ProjectList projects={projects} loading={loading} />

      {showCreate && (
        <ProjectForm
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
