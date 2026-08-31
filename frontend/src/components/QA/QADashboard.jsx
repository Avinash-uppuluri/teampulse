import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import TestCaseList from "./TestCaseList";
import TestCaseForm from "./TestCaseForm";
import "../part4.css";

export default function QADashboard({ projectId }) {
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = () => {
    api.getQaDashboard({ project_id: projectId }).then(setStats).catch(console.error);
  };

  useEffect(load, [projectId, refreshKey]);

  if (!stats) return <div className="p4-empty">Loading QA dashboard...</div>;

  const { test_cases: tc, bugs } = stats;

  return (
    <div className="p4-page">
      <h1>QA Dashboard</h1>

      <h2>Test Cases: {tc.total}</h2>
      <div className="p4-card-grid">
        <div className="p4-card accent-green">
          <div className="p4-card-label">Passed</div>
          <div className="p4-card-value">{tc.passed}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Failed</div>
          <div className="p4-card-value">{tc.failed}</div>
        </div>
        <div className="p4-card accent-yellow">
          <div className="p4-card-label">Blocked</div>
          <div className="p4-card-value">{tc.blocked}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Not Run</div>
          <div className="p4-card-value">{tc.not_run}</div>
        </div>
      </div>

      <h2>Bugs: {bugs.total}</h2>
      <div className="p4-card-grid">
        <div className="p4-card accent-red">
          <div className="p4-card-label">Open</div>
          <div className="p4-card-value">{bugs.open}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Critical</div>
          <div className="p4-card-value">{bugs.critical}</div>
        </div>
        <div className="p4-card accent-yellow">
          <div className="p4-card-label">High</div>
          <div className="p4-card-value">{bugs.high}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Fixed</div>
          <div className="p4-card-value">{bugs.fixed}</div>
        </div>
        <div className="p4-card accent-green">
          <div className="p4-card-label">Closed</div>
          <div className="p4-card-value">{bugs.closed}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Test Cases</h2>
        <button className="p4-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Test Case"}
        </button>
      </div>

      {showForm && (
        <TestCaseForm
          projectId={projectId}
          onCreated={() => {
            setShowForm(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <TestCaseList projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
