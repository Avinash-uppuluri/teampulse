import React, { useEffect, useMemo, useState } from "react";
import TaskCard from "./TaskCard";
import TaskFilters from "./TaskFilters";
import { taskApi } from "../../api/taskApi";

export default function TaskList({
  scope,      // { type: "team", id } | { type: "developer", id } | { type: "all" }
  developers = [],
  onOpenTask,
  refreshKey = 0,
}) {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher =
      scope.type === "team"
        ? taskApi.teamTasks(scope.id, filters)
        : scope.type === "developer"
        ? taskApi.developerTasks(scope.id, filters)
        : taskApi.listTasks(filters).then((res) => res.tasks);

    fetcher
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.type, scope.id, JSON.stringify(filters), refreshKey]);

  const tasksById = useMemo(() => {
    const map = {};
    tasks.forEach((t) => (map[t.id] = t));
    return map;
  }, [tasks]);

  if (loading) return <div className="empty-state">Loading tasks…</div>;
  if (error) return <div className="empty-state error">{error}</div>;

  return (
    <div className="task-list">
      <TaskFilters filters={filters} onChange={setFilters} developers={developers} />

      {tasks.length === 0 ? (
        <div className="empty-state">No tasks match these filters.</div>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              dependencyTitles={(task.depends_on || [])
                .map((depId) => tasksById[depId]?.title)
                .filter(Boolean)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
