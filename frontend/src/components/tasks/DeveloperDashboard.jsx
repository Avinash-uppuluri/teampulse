import React, { useCallback, useEffect, useState } from "react";
import TaskList from "./TaskList";
import TaskDetails from "./TaskDetails";
import DeadlineList from "./DeadlineList";
import { taskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";
import { useTaskSocket } from "../../utils/useTaskSocket";

const STAT_CARDS = [
  { key: "total_tasks", label: "My tasks" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "not_started", label: "Not started" },
  { key: "blocked", label: "Blocked" },
  { key: "overdue", label: "Overdue" },
];

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(() => {
    if (!user) return;
    taskApi.developerDashboard(user.id).then(setDashboard);
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  useTaskSocket(null, bump);

  if (!user) return null;

  const stats = dashboard?.stats;

  return (
    <div className="dashboard developer-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>My workspace</h1>
          <p className="dashboard-subtitle">Everything assigned to you, in one place.</p>
        </div>
        {stats && (
          <div className="progress-ring-wrap">
            <ProgressRing value={stats.progress_percentage} />
            <span className="progress-ring-label">Overall progress</span>
          </div>
        )}
      </header>

      {stats && (
        <div className="stat-card-row">
          {STAT_CARDS.map(({ key, label }) => (
            <div key={key} className={`stat-card stat-${key}`}>
              <span className="stat-value">{stats[key]}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <h3 className="section-heading">My tasks</h3>
          <TaskList
            scope={{ type: "developer", id: user.id }}
            onOpenTask={setSelectedTask}
            refreshKey={refreshKey}
          />
        </div>

        <aside className="dashboard-side">
          <h3 className="section-heading">Upcoming deadlines</h3>
          <DeadlineList
            tasks={dashboard?.upcoming_deadlines || []}
            onOpenTask={setSelectedTask}
          />
        </aside>
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onChanged={(updated) => {
            setSelectedTask(updated);
            bump();
          }}
        />
      )}
    </div>
  );
}

function ProgressRing({ value }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="progress-ring">
      <circle cx="44" cy="44" r={radius} className="progress-ring-track" strokeWidth="8" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        className="progress-ring-fill"
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" className="progress-ring-text">
        {value}%
      </text>
    </svg>
  );
}
