import React, { useState } from "react";
import { ProjectsAPI } from "../../api/client";

const STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"];
const HEALTHS = ["GREEN", "YELLOW", "RED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function ProjectForm({ project, onClose, onSaved }) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState({
    name: project?.name || "",
    project_code: project?.project_code || "",
    description: project?.description || "",
    category: project?.category || "",
    client_id: project?.client_id || "",
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
    priority: project?.priority || "MEDIUM",
    status: project?.status || "PLANNING",
    health: project?.health || "GREEN",
    budget: project?.budget || "",
    department: project?.department || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.client_id === "") payload.client_id = null;
      if (payload.budget === "") payload.budget = null;

      if (isEdit) {
        await ProjectsAPI.update(project.id, payload);
      } else {
        await ProjectsAPI.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong saving the project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tp-modal-backdrop" onClick={onClose}>
      <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit project" : "Create project"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="tp-form-field">
            <label>Project name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>

          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Project code</label>
              <input
                value={form.project_code}
                onChange={(e) => set("project_code", e.target.value)}
                required
                disabled={isEdit}
              />
            </div>
            <div className="tp-form-field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
          </div>

          <div className="tp-form-field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Start date</label>
              <input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="tp-form-field">
              <label>Deadline</label>
              <input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>

          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="tp-form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Health</label>
              <select value={form.health} onChange={(e) => set("health", e.target.value)}>
                {HEALTHS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="tp-form-field">
              <label>Department</label>
              <input value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>

          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Client user ID (optional)</label>
              <input value={form.client_id} onChange={(e) => set("client_id", e.target.value)} placeholder="e.g. 11" />
            </div>
            <div className="tp-form-field">
              <label>Budget</label>
              <input value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. 250000" />
            </div>
          </div>

          {error && <div className="tp-error-text">{error}</div>}

          <div className="tp-form-actions">
            <button type="button" className="tp-btn tp-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="tp-btn tp-btn--primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
