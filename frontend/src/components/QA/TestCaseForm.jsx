import React, { useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function TestCaseForm({ projectId, taskId, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    steps: "",
    expected_result: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.steps || !form.expected_result) {
      setError("Title, steps, and expected result are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createTestCase({ project_id: projectId, task_id: taskId, ...form });
      onCreated && onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="p4-form" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>New Test Case</h2>
      {error && <p style={{ color: "var(--p4-red)", fontSize: 13 }}>{error}</p>}

      <label>Title</label>
      <input value={form.title} onChange={set("title")} placeholder="e.g. Login form validation" />

      <label>Description</label>
      <textarea value={form.description} onChange={set("description")} />

      <label>Steps</label>
      <textarea value={form.steps} onChange={set("steps")} placeholder="1. ...&#10;2. ..." />

      <label>Expected Result</label>
      <textarea value={form.expected_result} onChange={set("expected_result")} />

      <button className="p4-btn" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Create Test Case"}
      </button>
    </form>
  );
}
