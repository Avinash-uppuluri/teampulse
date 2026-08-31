import { useAuth } from "../hooks/useAuth";
import ProjectDashboard from "./ProjectDashboard";

export default function PMDashboardPage() {
  const { user } = useAuth();
  return <ProjectDashboard currentUser={user} />;
}
