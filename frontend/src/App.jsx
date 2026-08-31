import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import PMDashboardPage from "./pages/PMDashboardPage.jsx";
import TeamLeadDashboardPage from "./pages/TeamLeadDashboardPage.jsx";
import DeveloperDashboardPage from "./pages/DeveloperDashboardPage.jsx";
import QADashboardPage from "./pages/QADashboardPage.jsx";
import ClientDashboardPage from "./pages/ClientDashboardPage.jsx";
import ProjectDetails from "./pages/ProjectDetails.jsx";
import MonitoringPage from "./pages/MonitoringPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import { useAuth } from "./hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "./utils/roles";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DASHBOARD_PATH[user.role] || "/login"} replace />;
}

function ProjectDetailsRoute() {
  const { user } = useAuth();
  return <ProjectDetails currentUser={user} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* All routes below require a valid, backend-verified JWT */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />

          {/* ADMIN only */}
          <Route element={<RoleRoute allowed={["ADMIN"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/monitoring" element={<MonitoringPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* One dashboard route per role, guarded independently. */}
          <Route element={<RoleRoute allowed={["PROJECT_MANAGER"]} />}>
            <Route path="/pm/dashboard" element={<PMDashboardPage />} />
            <Route path="/pm/monitoring" element={<MonitoringPage />} />
            <Route path="/pm/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleRoute allowed={["TEAM_LEAD"]} />}>
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowed={["DEVELOPER"]} />}>
            <Route path="/developer/dashboard" element={<DeveloperDashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowed={["QA_TESTER"]} />}>
            <Route path="/qa/dashboard" element={<QADashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowed={["CLIENT"]} />}>
            <Route path="/client/dashboard" element={<ClientDashboardPage />} />
          </Route>

          {/* Project detail: shared by every role except CLIENT (who gets
              the restricted /client/projects view via ClientDashboard).
              Server-side scoping (Part 2's utils/helpers.py) still applies
              per request -- this route just makes the page reachable. */}
          <Route
            element={
              <RoleRoute allowed={["ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA_TESTER"]} />
            }
          >
            <Route path="/projects/:id" element={<ProjectDetailsRoute />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
