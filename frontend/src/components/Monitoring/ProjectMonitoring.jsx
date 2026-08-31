import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import { getSocket } from "../../api/socket";
import AnalyticsCharts from "./AnalyticsCharts";
import "../part4.css";

export default function ProjectMonitoring() {
  const [dashboard, setDashboard] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getMainDashboard().then(setDashboard).catch(console.error);
  }, [refreshKey]);

  useEffect(() => {
    const s = getSocket();
    const refresh = () => setRefreshKey((k) => k + 1);
    s.on("projectHealthUpdated", refresh);
    s.on("bugCreated", refresh);
    return () => {
      s.off("projectHealthUpdated", refresh);
      s.off("bugCreated", refresh);
    };
  }, []);

  if (!dashboard) return <div className="p4-empty">Loading dashboard...</div>;

  return (
    <div className="p4-page">
      <h1>Project Monitoring</h1>

      <div className="p4-card-grid">
        <Card label="Total Projects" value={dashboard.total_projects} />
        <Card label="Active Projects" value={dashboard.active_projects} accent="green" />
        <Card label="Completed Projects" value={dashboard.completed_projects} />
        <Card label="Delayed Projects" value={dashboard.delayed_projects} accent="red" />
        <Card label="Total Tasks" value={dashboard.total_tasks} />
        <Card label="Completed Tasks" value={dashboard.completed_tasks} accent="green" />
        <Card label="Pending Tasks" value={dashboard.pending_tasks} />
        <Card label="Overdue Tasks" value={dashboard.overdue_tasks} accent="red" />
        <Card label="Open Bugs" value={dashboard.open_bugs} accent="red" />
        <Card label="Critical Bugs" value={dashboard.critical_bugs} accent="red" />
        <Card label="Team Members" value={dashboard.team_members} />
      </div>

      <AnalyticsCharts statusChart={dashboard.project_status_chart} />
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className={`p4-card${accent ? ` accent-${accent}` : ""}`}>
      <div className="p4-card-label">{label}</div>
      <div className="p4-card-value">{value}</div>
    </div>
  );
}
