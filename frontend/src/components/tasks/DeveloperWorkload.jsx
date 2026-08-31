import React, { useEffect, useState } from "react";
import { taskApi } from "../../api/taskApi";

export default function DeveloperWorkload({ teamId, refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    taskApi
      .teamWorkload(teamId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [teamId, refreshKey]);

  if (loading) return <div className="empty-state small">Loading workload…</div>;
  if (rows.length === 0) return <div className="empty-state small">No tasks assigned yet.</div>;

  return (
    <table className="workload-table">
      <thead>
        <tr>
          <th>Developer</th>
          <th>Assigned</th>
          <th>Completed</th>
          <th>In progress</th>
          <th>Blocked</th>
          <th>Overdue</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.developer_id}>
            <td>{r.developer_name}</td>
            <td>{r.assigned_tasks}</td>
            <td>{r.completed}</td>
            <td>{r.in_progress}</td>
            <td className={r.blocked > 0 ? "cell-warning" : ""}>{r.blocked}</td>
            <td className={r.overdue > 0 ? "cell-danger" : ""}>{r.overdue}</td>
            <td>
              <div className="mini-progress-track">
                <div className="mini-progress-fill" style={{ width: `${r.progress_percentage}%` }} />
              </div>
              <span className="mini-progress-value">{r.progress_percentage}%</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
