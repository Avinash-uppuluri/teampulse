import React, { useState } from "react";
import { TeamsAPI } from "../../api/client";

export default function TeamMemberList({ team, canManage, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!newUserId) return;
    try {
      await TeamsAPI.addMember(team.id, Number(newUserId));
      setNewUserId("");
      setAdding(false);
      onChanged();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not add member.");
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this developer from the team?")) return;
    await TeamsAPI.removeMember(team.id, userId);
    onChanged();
  };

  return (
    <div>
      {team.members?.length ? (
        team.members.map((m) => (
          <div className="tp-member-row" key={m.id}>
            <span>{m.user?.name || `User #${m.user_id}`}</span>
            {canManage && (
              <button className="tp-btn tp-btn--ghost tp-btn--sm" onClick={() => handleRemove(m.user_id)}>
                Remove
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="tp-empty-state">No developers on this team yet.</div>
      )}

      {canManage && (
        adding ? (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              type="text"
              placeholder="Developer user ID"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              style={{ flex: 1, border: "1px solid var(--tp-border-strong)", borderRadius: 4, padding: "6px 8px" }}
            />
            <button type="submit" className="tp-btn tp-btn--primary tp-btn--sm">Add</button>
            <button type="button" className="tp-btn tp-btn--ghost tp-btn--sm" onClick={() => setAdding(false)}>Cancel</button>
          </form>
        ) : (
          <button className="tp-btn tp-btn--ghost tp-btn--sm" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
            + Add developer
          </button>
        )
      )}
      {error && <div className="tp-error-text">{error}</div>}
    </div>
  );
}
