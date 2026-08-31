import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../part4.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AnalyticsCharts({ statusChart, healthChart }) {
  const statusData = {
    labels: Object.keys(statusChart || {}),
    datasets: [
      {
        label: "Projects",
        data: Object.values(statusChart || {}),
        backgroundColor: "#2f6fed",
        borderRadius: 4,
      },
    ],
  };

  const healthData = healthChart && {
    labels: ["Green", "Yellow", "Red"],
    datasets: [
      {
        data: [healthChart.GREEN || 0, healthChart.YELLOW || 0, healthChart.RED || 0],
        backgroundColor: ["#1e9e64", "#d9a017", "#d9483a"],
      },
    ],
  };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div className="p4-chart-wrap">
        <h2 style={{ marginTop: 0 }}>Project Status</h2>
        <Bar data={statusData} options={{ plugins: { legend: { display: false } } }} />
      </div>
      {healthData && (
        <div className="p4-chart-wrap">
          <h2 style={{ marginTop: 0 }}>Project Health</h2>
          <Pie data={healthData} />
        </div>
      )}
    </div>
  );
}
