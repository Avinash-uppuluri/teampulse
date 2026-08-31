export const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

export const STATUS_ORDER = ["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED"];

export const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function statusClass(status) {
  return `status-pill status-${status?.toLowerCase()}`;
}

export function priorityClass(priority) {
  return `priority-pill priority-${priority?.toLowerCase()}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(task) {
  if (!task.due_date || task.status === "COMPLETED") return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date(new Date().toDateString());
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(dateStr, status) {
  const days = daysUntil(dateStr);
  if (days === null) return "No deadline";
  if (status === "COMPLETED") return "Completed";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

// Allowed next statuses a DEVELOPER may pick from a given current status,
// mirroring backend STATUS_TRANSITIONS / DEVELOPER_ALLOWED_STATUSES.
export function developerNextStatuses(current) {
  const map = {
    NOT_STARTED: ["IN_PROGRESS"],
    IN_PROGRESS: ["IN_REVIEW", "BLOCKED"],
    IN_REVIEW: ["IN_PROGRESS"],
    BLOCKED: ["IN_PROGRESS"],
    COMPLETED: [],
  };
  return map[current] || [];
}
