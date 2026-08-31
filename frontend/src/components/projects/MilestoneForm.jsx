import React, { useState } from "react";
import { MilestonesAPI } from "../../api/client";

const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED"];

export default function MilestoneForm({ projectId, milestone, onClose, onSaved }) {
  const isEdit = Boolean(milestone);
  const [form, setForm] = useState({
    name: milestone?.name || "",
    description: milestone?.description || "",
    due_date: milestone?.due_date || "",
    status: milestone?.status || "NOT_STARTED",
    progress: milestone?.progress ?? 0,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, progress: Number(form.progress) };
      if (isEdit) {
        await MilestonesAPI.update(milestone.id, payload);
      } else {
        await MilestonesAPI.create(projectId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save milestone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tp-modal-backdrop" onClick={onClose}>
      <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit milestone" : "New milestone"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="tp-form-field">
            <label>Milestone name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="tp-form-field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="tp-form-row">
            <div className="tp-form-field">
              <label>Due date</label>
              <input type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div className="tp-form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="tp-form-field">
            <label>Progress ({form.progress}%)</label>
            <input type="range" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)} />
          </div>

          {error && <div className="tp-error-text">{error}</div>}

          <div className="tp-form-actions">
            <button type="button" className="tp-btn tp-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="tp-btn tp-btn--primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
