import React from "react";
import TaskProgress from "./TaskProgress";
import {
  deadlineLabel,
  isOverdue,
  priorityClass,
  statusClass,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "../../utils/taskHelpers";

export default function TaskCard({ task, onOpen, dependencyTitles = [] }) {
  const overdue = isOverdue(task);

  return (
    <button type="button" className="task-card" onClick={() => onOpen(task)}>
      <div className="task-card-top">
        <span className={priorityClass(task.priority)}>{PRIORITY_LABELS[task.priority]}</span>
        <span className={statusClass(task.status)}>{STATUS_LABELS[task.status]}</span>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {dependencyTitles.length > 0 && (
        <p className="task-card-blocked-by">Blocked by {dependencyTitles.join(", ")}</p>
      )}

      <TaskProgress progress={task.progress} />

      <div className="task-card-footer">
        <span className={overdue ? "task-card-deadline overdue" : "task-card-deadline"}>
          {deadlineLabel(task.due_date, task.status)}
        </span>
        {task.category && <span className="task-card-category">{task.category}</span>}
      </div>
    </button>
  );
}
