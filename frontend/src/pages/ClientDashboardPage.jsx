import { useState } from "react";
import ClientDashboard from "../components/Client/ClientDashboard";
import ClientFeedback from "../components/Client/ClientFeedback";

export default function ClientDashboardPage() {
  const [tab, setTab] = useState("projects");
  return (
    <div>
      <nav className="p4-tabs" style={{ padding: "0 24px", background: "#fff" }}>
        <button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>
          My Projects
        </button>
        <button className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}>
          Feedback
        </button>
      </nav>
      {tab === "projects" ? <ClientDashboard /> : <ClientFeedback />}
    </div>
  );
}
