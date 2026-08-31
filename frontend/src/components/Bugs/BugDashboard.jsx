import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { api } from "../../api/api";
import { getSocket } from "../../api/socket";
import BugList from "./BugList";
import BugForm from "./BugForm";
import "../part4.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function BugDashboard({ projectId }) {
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = () => {
    api.getQaDashboard({ project_id: projectId }).then((d) => setStats(d.bugs)).catch(console.error);
  };

  useEffect(load, [projectId, refreshKey]);

  // Live updates via Socket.IO
  useEffect(() => {
    const s = getSocket();
    const refresh = () => setRefreshKey((k) => k + 1);
    s.on("bugCreated", refresh);
    s.on("bugUpdated", refresh);
    s.on("bugFixed", refresh);
    s.on("bugClosed", refresh);
    return () => {
      s.off("bugCreated", refresh);
      s.off("bugUpdated", refresh);
      s.off("bugFixed", refresh);
      s.off("bugClosed", refresh);
    };
  }, []);

  if (!stats) return <div className="p4-empty">Loading bug dashboard...</div>;

  const chartData = {
    labels: ["Open", "Fixed", "Closed"],
    datasets: [
      {
        data: [stats.open, stats.fixed, stats.closed],
        backgroundColor: ["#d9483a", "#d9a017", "#1e9e64"],
      },
    ],
  };

  return (
    <div className="p4-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Bug Tracking</h1>
        <button className="p4-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Report Bug"}
        </button>
      </div>

      <div className="p4-card-grid">
        <div className="p4-card accent-red">
          <div className="p4-card-label">Open</div>
          <div className="p4-card-value">{stats.open}</div>
        </div>
        <div className="p4-card accent-red">
          <div className="p4-card-label">Critical</div>
          <div className="p4-card-value">{stats.critical}</div>
        </div>
        <div className="p4-card accent-yellow">
          <div className="p4-card-label">High</div>
          <div className="p4-card-value">{stats.high}</div>
        </div>
        <div className="p4-card">
          <div className="p4-card-label">Fixed</div>
          <div className="p4-card-value">{stats.fixed}</div>
        </div>
        <div className="p4-card accent-green">
          <div className="p4-card-label">Closed</div>
          <div className="p4-card-value">{stats.closed}</div>
        </div>
      </div>

      <div className="p4-chart-wrap">
        <Doughnut data={chartData} />
      </div>

      {showForm && (
        <BugForm
          projectId={projectId}
          onCreated={() => {
            setShowForm(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <h2>All Bugs</h2>
      <BugList projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
