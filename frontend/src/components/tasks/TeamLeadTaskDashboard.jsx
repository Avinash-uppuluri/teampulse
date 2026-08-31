import React, { useCallback, useEffect, useState } from "react";
import TaskList from "./TaskList";
import TaskDetails from "./TaskDetails";
import TaskForm from "./TaskForm";
import DeveloperWorkload from "./DeveloperWorkload";
import DeadlineList from "./DeadlineList";
import TaskCalendar from "./TaskCalendar";
import { taskApi } from "../../api/taskApi";
import { useTaskSocket } from "../../utils/useTaskSocket";

// `projectId`, `teamId`, and `developers` ([{id, name}]) come from Part 2
// (project/team selection) - this component never fetches or creates
// projects/teams/users itself.
export default function TeamLeadTaskDashboard({ projectId, teamId, developers }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [formState, setFormState] = useState(null); // null | { mode: "create" } | { mode: "edit", task }
  const [allTasks, setAllTasks] = useState([]);
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [refreshKey, setRefreshKey] = useState(0);

  const developerNames = Object.fromEntries(developers.map((d) => [d.id, d.name]));

  const loadAllTasks = useCallback(() => {
    taskApi.teamTasks(teamId).then(setAllTasks);
  }, [teamId]);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks, refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  // Live-refresh whenever any task in this team changes elsewhere.
  useTaskSocket(teamId, bump);

  return (
    <div className="dashboard team-lead-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Team task board</h1>
          <p className="dashboard-subtitle">Assign, track, and review work across your team.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormState({ mode: "create" })}>
          New task
        </button>
      </header>

      <section className="dashboard-section">
        <h3 className="section-heading">Developer workload</h3>
        <DeveloperWorkload teamId={teamId} refreshKey={refreshKey} />
      </section>

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <div className="view-toggle">
            <button
              className={`btn btn-sm ${view === "list" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              className={`btn btn-sm ${view === "calendar" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
          </div>

          {view === "list" ? (
            <TaskList
              scope={{ type: "team", id: teamId }}
              developers={developers}
              onOpenTask={setSelectedTask}
              refreshKey={refreshKey}
            />
          ) : (
            <TaskCalendar tasks={allTasks} onOpenTask={setSelectedTask} />
          )}
        </div>

        <aside className="dashboard-side">
          <h3 className="section-heading">Upcoming deadlines</h3>
          <DeadlineList
            tasks={allTasks}
            onOpenTask={setSelectedTask}
            showDeveloper
            developerNames={developerNames}
          />
        </aside>
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          developers={developers}
          onClose={() => setSelectedTask(null)}
          onChanged={(updated) => {
            setSelectedTask(updated);
            bump();
          }}
          onEdit={(t) => {
            setSelectedTask(null);
            setFormState({ mode: "edit", task: t });
          }}
          onDelete={async (t) => {
            if (window.confirm(`Delete "${t.title}"? This cannot be undone.`)) {
              await taskApi.deleteTask(t.id);
              setSelectedTask(null);
              bump();
            }
          }}
        />
      )}

      {formState && (
        <div className="task-details-overlay">
          <div className="task-details">
            <TaskForm
              projectId={projectId}
              teamId={teamId}
              developers={developers}
              existingTasks={allTasks}
              task={formState.mode === "edit" ? formState.task : null}
              onSaved={() => {
                setFormState(null);
                bump();
              }}
              onCancel={() => setFormState(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
