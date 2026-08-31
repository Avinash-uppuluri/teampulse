import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

export default function BugHistory({ bugId, refreshKey }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getBugHistory(bugId).then(setHistory).catch(console.error);
  }, [bugId, refreshKey]);

  if (history.length === 0) return <div className="p4-empty">No history yet.</div>;

  return (
    <div className="p4-card">
      {history.map((h, i) => (
        <div key={h.id} style={{ padding: "10px 0", borderBottom: i < history.length - 1 ? "1px solid var(--p4-border)" : "none" }}>
          <div style={{ fontSize: 13 }}>
            <strong>{h.changed_by_name}</strong>{" "}
            {h.old_status ? (
              <>changed status from <span className="p4-badge">{h.old_status}</span> to <span className="p4-badge">{h.new_status}</span></>
            ) : (
              <>set status to <span className="p4-badge">{h.new_status}</span></>
            )}
          </div>
          {h.comment && <div style={{ fontSize: 13, color: "var(--p4-text-muted)", marginTop: 4 }}>{h.comment}</div>}
          <div style={{ fontSize: 11, color: "var(--p4-text-muted)", marginTop: 4 }}>
            {new Date(h.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
