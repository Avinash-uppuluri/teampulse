import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function ClientFeedback({ projectId }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");

  const load = () => api.getFeedback().then(setFeedback).catch(console.error);

  useEffect(load, [projectId]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    try {
      await api.submitFeedback({ project_id: projectId, message, rating });
      setMessage("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const projectFeedback = feedback.filter((f) => f.project_id === projectId);

  return (
    <div>
      <h2>Feedback</h2>
      <form className="p4-form" onSubmit={submit}>
        {error && <p style={{ color: "var(--p4-red)", fontSize: 13 }}>{error}</p>}
        <label>Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        <label>Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} / 5</option>)}
        </select>
        <button className="p4-btn" type="submit">Submit Feedback</button>
      </form>

      {projectFeedback.length > 0 && (
        <table className="p4-table" style={{ marginTop: 16 }}>
          <thead><tr><th>Message</th><th>Rating</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {projectFeedback.map((f) => (
              <tr key={f.id}>
                <td>{f.message}</td>
                <td>{f.rating}/5</td>
                <td><span className="p4-badge">{f.status}</span></td>
                <td>{new Date(f.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
