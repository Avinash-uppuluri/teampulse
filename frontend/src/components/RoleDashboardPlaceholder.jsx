import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/**
 * These dashboards will be replaced by the real screens built in
 * Parts 2 (Projects/Teams), 3 (Tasks) and 4 (QA/Reports). They exist
 * here only so the login -> role-based redirect flow required by
 * Part 1 has somewhere valid to land for every role.
 */
export default function RoleDashboardPlaceholder({ title, description }) {
  const { user } = useAuth();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-subtitle">{description}</div>
        </div>
      </div>
      <div className="placeholder-page">
        <LayoutDashboard size={36} color="#9ca3af" style={{ marginBottom: 10 }} />
        <p>
          Logged in as <strong>{user?.name}</strong> ({user?.role}).
        </p>
        <p>This dashboard will be built out in the module that owns it.</p>
      </div>
    </div>
  );
}
