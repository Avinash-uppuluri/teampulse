import React from "react";
import { deadlineLabel, isOverdue, priorityClass, PRIORITY_LABELS } from "../../utils/taskHelpers";

export default function DeadlineList({ tasks, onOpenTask, showDeveloper = false, developerNames = {} }) {
  const sorted = [...tasks]
    .filter((t) => t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (sorted.length === 0) {
    return <div className="empty-state small">No upcoming deadlines.</div>;
  }

  return (
    <ul className="deadline-list">
      {sorted.map((task) => (
        <li
          key={task.id}
          className={isOverdue(task) ? "deadline-item overdue" : "deadline-item"}
          onClick={() => onOpenTask(task)}
        >
          <div className="deadline-item-main">
            <span className={priorityClass(task.priority)}>{PRIORITY_LABELS[task.priority]}</span>
            <span className="deadline-item-title">{task.title}</span>
            {showDeveloper && task.assigned_to && (
              <span className="deadline-item-dev">
                {developerNames[task.assigned_to] || `User #${task.assigned_to}`}
              </span>
            )}
          </div>
          <span className="deadline-item-when">{deadlineLabel(task.due_date, task.status)}</span>
        </li>
      ))}
    </ul>
  );
}
