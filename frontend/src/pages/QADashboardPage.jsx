import { useAuth } from "../hooks/useAuth";
import ProjectDashboard from "./ProjectDashboard";

export default function QADashboardPage() {
  const { user } = useAuth();
  // QA testers work project-by-project; open a project's "QA & Bugs" tab
  // (added to ProjectDetails.jsx on merge) from here.
  return <ProjectDashboard currentUser={user} />;
}
