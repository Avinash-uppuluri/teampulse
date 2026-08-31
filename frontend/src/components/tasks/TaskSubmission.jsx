import React, { useEffect, useState } from "react";
import { taskApi } from "../../api/taskApi";

export default function TaskSubmission({ taskId, canSubmit, canReview, onChanged }) {
  const [submissions, setSubmissions] = useState([]);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => taskApi.listSubmissions(taskId).then(setSubmissions);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!description.trim() && !url.trim()) return;
    await taskApi.submitWork(taskId, { description, submission_url: url });
    setDescription("");
    setUrl("");
    await load();
    onChanged && onChanged();
  };

  const review = async (submissionId, review_status) => {
    setBusyId(submissionId);
    try {
      await taskApi.reviewSubmission(submissionId, review_status);
      await load();
      onChanged && onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="task-submission">
      <h4 className="section-heading">Work submissions</h4>

      {submissions.length === 0 ? (
        <p className="empty-state small">No work submitted yet.</p>
      ) : (
        <ul className="submission-list">
          {submissions.map((s) => (
            <li key={s.id} className={`submission-item review-${s.review_status.toLowerCase()}`}>
              <div className="submission-item-head">
                <span>{new Date(s.submitted_at).toLocaleString()}</span>
                <span className="submission-status">{s.review_status.replace("_", " ")}</span>
              </div>
              {s.description && <p>{s.description}</p>}
              {s.submission_url && (
                <a href={s.submission_url} target="_blank" rel="noreferrer">
                  {s.submission_url}
                </a>
              )}

              {canReview && s.review_status === "PENDING" && (
                <div className="submission-actions">
                  <button
                    className="btn btn-success btn-sm"
                    disabled={busyId === s.id}
                    onClick={() => review(s.id, "APPROVED")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    disabled={busyId === s.id}
                    onClick={() => review(s.id, "CHANGES_REQUESTED")}
                  >
                    Request changes
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canSubmit && (
        <form className="submission-form" onSubmit={submit}>
          <textarea
            placeholder="Describe the work you're submitting…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <input
            type="url"
            placeholder="Link to PR, doc, or file (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Submit for review
          </button>
        </form>
      )}
    </div>
  );
}
