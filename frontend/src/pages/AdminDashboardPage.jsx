import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  FolderKanban,
  Briefcase,
  UsersRound,
  Code2,
  Bug,
  Building2,
} from "lucide-react";
import { userService } from "../services/userService";
import DashboardCard from "../components/DashboardCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { useAuth } from "../hooks/useAuth";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const data = await userService.getStats();
      setStats(data);
    } catch (err) {
      setError("Could not load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {user?.name?.split(" ")[0]}</div>
          <div className="page-subtitle">
            Here's what's happening across TeamPulse today.
          </div>
        </div>
      </div>

      {loading && <LoadingState label="Loading dashboard..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadStats} />}

      {!loading && !error && stats && (
        <div className="card-grid">
          <DashboardCard label="Total Users" value={stats.total_users} icon={Users} />
          <DashboardCard label="Active Users" value={stats.active_users} icon={UserCheck} />
          <DashboardCard label="Inactive Users" value={stats.inactive_users} icon={UserX} />
          <DashboardCard label="Total Projects" value={stats.total_projects} icon={FolderKanban} />
          <DashboardCard label="Project Managers" value={stats.project_managers} icon={Briefcase} />
          <DashboardCard label="Team Leads" value={stats.team_leads} icon={UsersRound} />
          <DashboardCard label="Developers" value={stats.developers} icon={Code2} />
          <DashboardCard label="QA Testers" value={stats.qa_testers} icon={Bug} />
          <DashboardCard label="Clients" value={stats.clients} icon={Building2} />
        </div>
      )}
    </div>
  );
}
