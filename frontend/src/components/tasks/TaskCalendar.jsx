import React, { useMemo, useState } from "react";
import { isOverdue } from "../../utils/taskHelpers";

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function TaskCalendar({ tasks, onOpenTask }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const d = new Date(t.due_date);
      if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month) {
        const day = d.getDate();
        (map[day] = map[day] || []).push(t);
      }
    });
    return map;
  }, [tasks, cursor]);

  const cells = buildMonthGrid(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="task-calendar">
      <div className="task-calendar-header">
        <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(-1)}>
          ‹
        </button>
        <h4>{monthLabel}</h4>
        <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(1)}>
          ›
        </button>
      </div>

      <div className="task-calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="task-calendar-grid">
        {cells.map((day, idx) => {
          const dayTasks = day ? tasksByDay[day] || [] : [];
          return (
            <div key={idx} className={`task-calendar-cell ${day ? "" : "empty"}`}>
              {day && (
                <>
                  <span className="task-calendar-day">{day}</span>
                  {dayTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      className={isOverdue(t) ? "task-calendar-chip overdue" : "task-calendar-chip"}
                      onClick={() => onOpenTask(t)}
                      title={t.title}
                    >
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="task-calendar-more">+{dayTasks.length - 3} more</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
