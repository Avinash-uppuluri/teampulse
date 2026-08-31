import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectsAPI, TeamsAPI, MilestonesAPI } from "../api/client";
import HealthIndicator from "../components/projects/HealthIndicator";
import DeadlineBadge from "../components/projects/DeadlineBadge";
import TeamManagement from "../components/projects/TeamManagement";
import MilestoneList from "../components/projects/MilestoneList";
import ProjectForm from "../components/projects/ProjectForm";
import TaskList from "../components/tasks/TaskList";
import TaskDetails from "../components/tasks/TaskDetails";
import QADashboard from "../components/QA/QADashboard";
import BugDashboard from "../components/Bugs/BugDashboard";

const TABS = ["Overview", "Teams", "Milestones", "Tasks", "QA & Bugs", "Activity"];

export default function ProjectDetails({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManage =
    currentUser?.role === "ADMIN" ||
    (currentUser?.role === "PROJECT_MANAGER" && project?.manager_id === currentUser.id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProjectsAPI.get(id);
      setProject(res.data);
      setTeams(res.data.teams || []);
      setMilestones(res.data.milestones || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadActivity = useCallback(async () => {
    const res = await ProjectsAPI.activity(id);
    setActivity(res.data);
  }, [id]);

  const refreshTeams = async () => {
    const res = await TeamsAPI.listForProject(id);
    setTeams(res.data);
  };

  const refreshMilestones = async () => {
    const res = await MilestonesAPI.listForProject(id);
    setMilestones(res.data);
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "Activity") loadActivity(); }, [tab, loadActivity]);

  const handleArchive = async () => {
    if (!window.confirm(`Archive "${project.name}"? It will be hidden from active views.`)) return;
    await ProjectsAPI.archive(project.id, true);
    navigate("/");
  };

  if (loading || !project) return <div className="tp-main"><div className="tp-empty-state">Loading project…</div></div>;

  return (
    <div>
      <div className="tp-detail-header">
        <div className="tp-detail-header__top">
          <div>
            <h1>{project.name}</h1>
            <span className="tp-code">{project.project_code}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <HealthIndicator health={project.health} />
            <span className={`tp-badge tp-priority--${project.priority}`}>{project.priority}</span>
            <span className="tp-status-pill">{project.status.replace("_", " ")}</span>
            {canManage && (
              <>
                <button className="tp-btn tp-btn--sm" onClick={() => setShowEdit(true)}>Edit</button>
                <button className="tp-btn tp-btn--danger tp-btn--sm" onClick={handleArchive}>Archive</button>
              </>
            )}
          </div>
        </div>

        {project.description && (
          <p style={{ color: "var(--tp-ink-soft)", marginTop: 12 }}>{project.description}</p>
        )}

        <div style={{ marginTop: 16 }}>
          <div className="tp-progress-track">
            <div className="tp-progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          <span style={{ fontSize: "var(--tp-text-xs)", color: "var(--tp-ink-soft)" }}>{project.progress}% complete</span>
        </div>

        <dl className="tp-detail-meta-grid">
          <div>
            <dt>Manager</dt>
            <dd>{project.manager?.name || "—"}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{project.client?.name || "—"}</dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>{project.start_date || "—"}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd><DeadlineBadge date={project.end_date} status={project.status} /></dd>
          </div>
          <div>
            <dt>Teams</dt>
            <dd>{project.team_count}</dd>
          </div>
          <div>
            <dt>Team members</dt>
            <dd>{project.team_member_count}</dd>
          </div>
        </dl>
      </div>

      <div className="tp-tabs">
        {TABS.map((t) => (
          <button key={t} className={`tp-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="tp-panel">
          <h3>Snapshot</h3>
          <p style={{ color: "var(--tp-ink-soft)", fontSize: "var(--tp-text-sm)" }}>
            {project.milestone_count} milestone{project.milestone_count === 1 ? "" : "s"} tracked,{" "}
            {milestones.filter((m) => m.status === "COMPLETED").length} completed.{" "}
            {project.team_count} team{project.team_count === 1 ? "" : "s"} assigned with{" "}
            {project.team_member_count} total developer{project.team_member_count === 1 ? "" : "s"}.
          </p>
          {project.category && <p style={{ fontSize: "var(--tp-text-sm)" }}>Category: {project.category}</p>}
          {project.department && <p style={{ fontSize: "var(--tp-text-sm)" }}>Department: {project.department}</p>}
          {project.budget != null && <p style={{ fontSize: "var(--tp-text-sm)" }}>Budget: ${Number(project.budget).toLocaleString()}</p>}
        </div>
      )}

      {tab === "Teams" && (
        <TeamManagement projectId={project.id} teams={teams} canManage={canManage} onChanged={refreshTeams} />
      )}

      {tab === "Milestones" && (
        <MilestoneList projectId={project.id} milestones={milestones} canManage={canManage} onChanged={refreshMilestones} />
      )}

      {/* Integration point added on merge: Part 3's task board, per Part 2's
          INTEGRATION.md ("extending the TABS array once Part 3's component
          exists"). Tasks are scoped by team, so this lists one task board
          per team on the project rather than a single flat list. */}
      {tab === "Tasks" && (
        <div className="tp-panel">
          {teams.length === 0 ? (
            <div className="tp-empty-state">Add a team first — tasks are assigned per team.</div>
          ) : (
            teams.map((t) => (
              <div key={t.id} style={{ marginBottom: "var(--tp-space-lg, 24px)" }}>
                <h3 style={{ fontSize: "var(--tp-text-sm)" }}>{t.name}</h3>
                {selectedTask ? (
                  <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} onChanged={() => setSelectedTask(null)} />
                ) : (
                  <TaskList scope={{ type: "team", id: t.id }} onOpenTask={(task) => setSelectedTask(task)} />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Integration point added on merge: Part 4's QA & bug tracking,
          scoped to this project. */}
      {tab === "QA & Bugs" && (
        <div className="tp-panel">
          <QADashboard projectId={project.id} />
          <BugDashboard projectId={project.id} />
        </div>
      )}

      {tab === "Activity" && (
        <div className="tp-panel">
          {activity.length === 0 ? (
            <div className="tp-empty-state">No activity recorded yet.</div>
          ) : (
            activity.map((a) => (
              <div className="tp-member-row" key={a.id}>
                <div>
                  <div>{a.details || a.action.replace("_", " ")}</div>
                  <span style={{ fontSize: "var(--tp-text-xs)", color: "var(--tp-ink-faint)" }}>
                    {a.user?.name || "System"} · {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showEdit && (
        <ProjectForm
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
    </div>
  );
}
