import React, { useEffect, useState } from "react";
import { taskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";

export default function TaskComments({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () => taskApi.listComments(taskId).then(setComments);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await taskApi.addComment(taskId, draft.trim());
      setDraft("");
      await load();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="task-comments">
      <h4 className="section-heading">Comments</h4>

      {comments.length === 0 ? (
        <p className="empty-state small">No comments yet.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-item-head">
                <span className="comment-author">
                  {c.user_id === user?.id ? "You" : `User #${c.user_id}`}
                </span>
                <span className="comment-time">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="comment-body">{c.comment}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={submit}>
        <textarea
          placeholder="Add a comment or work note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
        />
        <button type="submit" className="btn btn-primary" disabled={posting || !draft.trim()}>
          Post
        </button>
      </form>
    </div>
  );
}
