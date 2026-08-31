import React, { useState } from "react";
import { taskApi } from "../../api/taskApi";

export default function TaskAssignment({ task, developers, onAssigned }) {
  const [value, setValue] = useState(task.assigned_to || "");
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const nextId = e.target.value;
    setValue(nextId);
    if (!nextId) return;
    setSaving(true);
    try {
      const updated = await taskApi.assignTask(task.id, Number(nextId));
      onAssigned && onAssigned(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="task-assignment">
      <span className="field-label">
        {task.assigned_to ? "Reassign to" : "Assign to"}
      </span>
      <select value={value} onChange={handleChange} disabled={saving}>
        <option value="">Unassigned</option>
        {developers.map((dev) => (
          <option key={dev.id} value={dev.id}>
            {dev.name}
          </option>
        ))}
      </select>
    </label>
  );
}
