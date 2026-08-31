import { useAuth } from "../hooks/useAuth";
import ProjectDashboard from "./ProjectDashboard";

export default function TeamLeadDashboardPage() {
  const { user } = useAuth();
  // Backend scopes the project list to teams this user leads (see
  // Part 2's utils/helpers.py::scope_projects_query).
  return <ProjectDashboard currentUser={user} />;
}
