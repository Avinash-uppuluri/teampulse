import React, { useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function BugForm({ projectId, taskId, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    priority: "MEDIUM",
    environment: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createBug({ project_id: projectId, task_id: taskId, ...form });
      onCreated && onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="p4-form" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>Report Bug</h2>
      {error && <p style={{ color: "var(--p4-red)", fontSize: 13 }}>{error}</p>}

      <label>Title</label>
      <input value={form.title} onChange={set("title")} placeholder="Short summary" />

      <label>Description</label>
      <textarea value={form.description} onChange={set("description")} placeholder="Steps to reproduce, expected vs actual" />

      <label>Severity</label>
      <select value={form.severity} onChange={set("severity")}>
        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Priority</label>
      <select value={form.priority} onChange={set("priority")}>
        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Environment</label>
      <input value={form.environment} onChange={set("environment")} placeholder="e.g. staging, production" />

      <button className="p4-btn" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Create Bug"}
      </button>
    </form>
  );
}
