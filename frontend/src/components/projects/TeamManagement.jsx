import React, { useState } from "react";
import { TeamsAPI } from "../../api/client";
import TeamMemberList from "./TeamMemberList";

export default function TeamManagement({ projectId, teams, canManage, onChanged }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", team_lead_id: "" });
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };
      if (!payload.team_lead_id) delete payload.team_lead_id;
      await TeamsAPI.create(projectId, payload);
      setForm({ name: "", description: "", team_lead_id: "" });
      setCreating(false);
      onChanged();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create team.");
    }
  };

  const handleAssignLead = async (team, leadId) => {
    await TeamsAPI.update(team.id, { team_lead_id: leadId ? Number(leadId) : null });
    onChanged();
  };

  const handleRemoveTeam = async (team) => {
    if (!window.confirm(`Archive team "${team.name}"?`)) return;
    await TeamsAPI.remove(team.id);
    onChanged();
  };

  return (
    <div>
      {teams.length === 0 && <div className="tp-empty-state">No teams assigned to this project yet.</div>}

      {teams.map((team) => (
        <div className="tp-panel" key={team.id}>
          <div className="tp-panel__header">
            <div>
              <h3>{team.name}</h3>
              <div className="tp-project-card__meta">
                <span>{team.member_count} member{team.member_count === 1 ? "" : "s"}</span>
              </div>
            </div>
            {canManage && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tp-btn tp-btn--ghost tp-btn--sm" onClick={() => setExpanded((s) => ({ ...s, [team.id]: !s[team.id] }))}>
                  {expanded[team.id] ? "Hide members" : "Manage members"}
                </button>
                <button className="tp-btn tp-btn--danger tp-btn--sm" onClick={() => handleRemoveTeam(team)}>Archive</button>
              </div>
            )}
          </div>

          {team.description && <p style={{ color: "var(--tp-ink-soft)", fontSize: "var(--tp-text-sm)" }}>{team.description}</p>}

          {canManage ? (
            <div className="tp-form-field" style={{ maxWidth: 260 }}>
              <label>Team lead (user ID)</label>
              <input
                type="text"
                defaultValue={team.team_lead_id || ""}
                onBlur={(e) => handleAssignLead(team, e.target.value)}
                placeholder="Assign team lead by user ID"
              />
              {team.team_lead && (
                <span style={{ fontSize: "var(--tp-text-xs)", color: "var(--tp-ink-soft)" }}>
                  Currently: {team.team_lead.name}
                </span>
              )}
            </div>
          ) : (
            team.team_lead && (
              <div style={{ fontSize: "var(--tp-text-sm)" }}>Team lead: <strong>{team.team_lead.name}</strong></div>
            )
          )}

          {(expanded[team.id] || !canManage) && (
            <div style={{ marginTop: 10 }}>
              <TeamMemberList team={team} canManage={canManage} onChanged={onChanged} />
            </div>
          )}
        </div>
      ))}

      {canManage && (
        creating ? (
          <form className="tp-panel" onSubmit={handleCreate}>
            <div className="tp-form-field">
              <label>Team name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="tp-form-field">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="tp-form-field">
              <label>Team lead (user ID, optional)</label>
              <input value={form.team_lead_id} onChange={(e) => setForm({ ...form, team_lead_id: e.target.value })} />
            </div>
            {error && <div className="tp-error-text">{error}</div>}
            <div className="tp-form-actions">
              <button type="button" className="tp-btn tp-btn--ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="tp-btn tp-btn--primary">Create team</button>
            </div>
          </form>
        ) : (
          <button className="tp-btn tp-btn--primary" onClick={() => setCreating(true)}>+ New team</button>
        )
      )}
    </div>
  );
}
