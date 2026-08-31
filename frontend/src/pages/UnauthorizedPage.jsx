import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="placeholder-page">
      <ShieldAlert size={40} color="#dc2626" style={{ marginBottom: 12 }} />
      <h2>Access denied</h2>
      <p>You don't have permission to view this page.</p>
      <button className="btn-secondary" onClick={() => navigate(-1)}>
        Go back
      </button>
    </div>
  );
}
