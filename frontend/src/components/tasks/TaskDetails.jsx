import React, { useState } from "react";
import TaskProgress from "./TaskProgress";
import TaskAssignment from "./TaskAssignment";
import TaskComments from "./TaskComments";
import TaskSubmission from "./TaskSubmission";
import { taskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";
import {
  deadlineLabel,
  developerNextStatuses,
  formatDate,
  isOverdue,
  priorityClass,
  PRIORITY_LABELS,
  statusClass,
  STATUS_LABELS,
} from "../../utils/taskHelpers";

export default function TaskDetails({ task, developers = [], onClose, onChanged, onEdit, onDelete }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(task);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const isTeamLead = user?.role === "TEAM_LEAD";
  const isAssignedDeveloper = user?.role === "DEVELOPER" && current.assigned_to === user.id;

  const refresh = async () => {
    const fresh = await taskApi.getTask(current.id);
    setCurrent(fresh);
    onChanged && onChanged(fresh);
  };

  const changeStatus = async (nextStatus) => {
    setStatusBusy(true);
    setStatusError(null);
    try {
      const updated = await taskApi.updateStatus(current.id, nextStatus);
      setCurrent(updated);
      onChanged && onChanged(updated);
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusBusy(false);
    }
  };

  const availableStatuses = isTeamLead
    ? Object.keys(STATUS_LABELS)
    : developerNextStatuses(current.status);

  return (
    <div className="task-details-overlay" role="dialog" aria-modal="true">
      <div className="task-details">
        <div className="task-details-header">
          <div>
            <span className={priorityClass(current.priority)}>{PRIORITY_LABELS[current.priority]}</span>
            <h2>{current.title}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="task-details-meta">
          <span className={statusClass(current.status)}>{STATUS_LABELS[current.status]}</span>
          <span className={isOverdue(current) ? "task-card-deadline overdue" : "task-card-deadline"}>
            {deadlineLabel(current.due_date, current.status)}
          </span>
          <span>Start {formatDate(current.start_date)}</span>
          <span>Due {formatDate(current.due_date)}</span>
          {current.category && <span>{current.category}</span>}
          {current.estimated_hours != null && <span>{current.estimated_hours}h estimated</span>}
        </div>

        {current.description && <p className="task-details-description">{current.description}</p>}

        {current.depends_on && current.depends_on.length > 0 && (
          <p className="task-card-blocked-by">
            Depends on task IDs: {current.depends_on.join(", ")}
          </p>
        )}

        <TaskProgress
          progress={current.progress}
          editable={isTeamLead || isAssignedDeveloper}
          onChange={async (val) => {
            const updated = await taskApi.updateProgress(current.id, val);
            setCurrent(updated);
            onChanged && onChanged(updated);
          }}
        />

        {(isTeamLead || isAssignedDeveloper) && availableStatuses.length > 0 && (
          <div className="status-actions">
            <span className="field-label">Change status</span>
            <div className="status-actions-buttons">
              {availableStatuses.map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${s === current.status ? "btn-primary" : "btn-ghost"}`}
                  disabled={statusBusy || s === current.status}
                  onClick={() => changeStatus(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {statusError && <p className="form-error">{statusError}</p>}
          </div>
        )}

        {isTeamLead && (
          <div className="task-details-actions">
            <TaskAssignment
              task={current}
              developers={developers}
              onAssigned={(updated) => {
                setCurrent(updated);
                onChanged && onChanged(updated);
              }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(current)}>
              Edit task
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(current)}
            >
              Delete task
            </button>
          </div>
        )}

        <TaskSubmission
          taskId={current.id}
          canSubmit={isAssignedDeveloper}
          canReview={isTeamLead}
          onChanged={refresh}
        />

        <TaskComments taskId={current.id} />
      </div>
    </div>
  );
}
