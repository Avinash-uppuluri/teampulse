import { X } from "lucide-react";
import { roleLabel } from "../utils/roles";

export default function UserDetails({ user, onClose }) {
  if (!user) return null;

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">User Details</div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="details-grid">
          <div>
            <div className="details-label">Name</div>
            <div>{user.name}</div>
          </div>
          <div>
            <div className="details-label">Email</div>
            <div>{user.email}</div>
          </div>
          <div>
            <div className="details-label">Role</div>
            <div>
              <span className="badge-role">{roleLabel(user.role)}</span>
            </div>
          </div>
          <div>
            <div className="details-label">Status</div>
            <div>
              <span
                className={`status-pill ${
                  user.status === "ACTIVE" ? "active" : "inactive"
                }`}
              >
                {user.status}
              </span>
            </div>
          </div>
          <div>
            <div className="details-label">Department</div>
            <div>{user.department || "—"}</div>
          </div>
          <div>
            <div className="details-label">User ID</div>
            <div>#{user.id}</div>
          </div>
          <div className="full">
            <div className="details-label">Last Login</div>
            <div>{formatDate(user.last_login)}</div>
          </div>
          <div>
            <div className="details-label">Created</div>
            <div>{formatDate(user.created_at)}</div>
          </div>
          <div>
            <div className="details-label">Updated</div>
            <div>{formatDate(user.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
