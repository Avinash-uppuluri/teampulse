import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleLabel, initials } from "../utils/roles";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <header className="navbar">
      <div />
      <div className="navbar-user">
        <span className="role-badge">{roleLabel(user.role)}</span>
        <div className="avatar">{initials(user.name)}</div>
        <span>{user.name}</span>
        <button className="action-btn" title="Logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
