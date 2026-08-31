import React, { useState } from "react";
import { taskApi } from "../../api/taskApi";
import { PRIORITY_LABELS } from "../../utils/taskHelpers";

const emptyForm = {
  title: "",
  description: "",
  assigned_to: "",
  priority: "MEDIUM",
  category: "",
  start_date: "",
  due_date: "",
  estimated_hours: "",
  depends_on: [],
};

export default function TaskForm({ projectId, teamId, developers, existingTasks = [], task, onSaved, onCancel }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(
    isEdit
      ? {
          ...emptyForm,
          ...task,
          assigned_to: task.assigned_to || "",
          start_date: task.start_date || "",
          due_date: task.due_date || "",
          estimated_hours: task.estimated_hours ?? "",
          depends_on: task.depends_on || [],
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleDependency = (id) => {
    setForm((f) => ({
      ...f,
      depends_on: f.depends_on.includes(id)
        ? f.depends_on.filter((d) => d !== id)
        : [...f.depends_on, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        project_id: projectId,
        team_id: teamId,
        assigned_to: form.assigned_to || null,
        estimated_hours: form.estimated_hours === "" ? null : Number(form.estimated_hours),
      };
      const saved = isEdit ? await taskApi.updateTask(task.id, payload) : await taskApi.createTask(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <h3 className="section-heading">{isEdit ? "Edit task" : "New task"}</h3>
      {error && <p className="form-error">{error}</p>}

      <label className="field">
        <span className="field-label">Title</span>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Build the login form"
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What needs to be done, and any context the developer needs"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Assign to</span>
          <select value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}>
            <option value="">Unassigned</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Priority</span>
          <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Category</span>
          <input
            type="text"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Backend, Frontend, QA…"
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Start date</span>
          <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Due date</span>
          <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Estimated hours</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.estimated_hours}
            onChange={(e) => set("estimated_hours", e.target.value)}
          />
        </label>
      </div>

      {existingTasks.length > 0 && (
        <div className="field">
          <span className="field-label">Depends on</span>
          <div className="dependency-checklist">
            {existingTasks
              .filter((t) => t.id !== task?.id)
              .map((t) => (
                <label key={t.id} className="dependency-checkbox">
                  <input
                    type="checkbox"
                    checked={form.depends_on.includes(t.id)}
                    onChange={() => toggleDependency(t.id)}
                  />
                  {t.title}
                </label>
              ))}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
