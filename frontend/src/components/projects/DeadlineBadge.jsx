import React from "react";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function DeadlineBadge({ date, status }) {
  if (!date) return <span className="tp-deadline-badge">No deadline set</span>;

  const days = daysUntil(date);
  const finished = ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status);
  let cls = "tp-deadline-badge";
  let label = date;

  if (!finished && days < 0) {
    cls += " tp-deadline-badge--overdue";
    label = `${date} — ${Math.abs(days)}d overdue`;
  } else if (!finished && days <= 7) {
    cls += " tp-deadline-badge--soon";
    label = `${date} — due in ${days}d`;
  }

  return <span className={cls}>{label}</span>;
}
