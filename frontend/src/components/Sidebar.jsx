import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Activity, BarChart3, FileBarChart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "../utils/roles";

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isPM = user.role === "PROJECT_MANAGER";
  const linkClass = ({ isActive }) => `sidebar-link${isActive ? " active" : ""}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
        TeamPulse
      </div>
      <nav className="sidebar-nav">
        {isAdmin && (
          <>
            <NavLink to="/admin/dashboard" className={linkClass}>
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users size={17} />
              User Management
            </NavLink>
            <NavLink to="/admin/monitoring" className={linkClass}>
              <BarChart3 size={17} />
              Monitoring
            </NavLink>
            <NavLink to="/admin/reports" className={linkClass}>
              <FileBarChart size={17} />
              Reports
            </NavLink>
          </>
        )}

        {!isAdmin && (
          <NavLink to={ROLE_DASHBOARD_PATH[user.role] || "/"} className={linkClass}>
            <LayoutDashboard size={17} />
            Dashboard
          </NavLink>
        )}

        {isPM && (
          <>
            <NavLink to="/pm/monitoring" className={linkClass}>
              <BarChart3 size={17} />
              Monitoring
            </NavLink>
            <NavLink to="/pm/reports" className={linkClass}>
              <FileBarChart size={17} />
              Reports
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
