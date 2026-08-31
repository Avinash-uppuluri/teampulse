import { Eye, Pencil, Power, KeyRound, Trash2 } from "lucide-react";
import { roleLabel } from "../utils/roles";

export default function UserTable({
  users,
  onView,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete,
}) {
  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  }

  if (!users.length) {
    return (
      <div className="table-wrap">
        <table>
          <tbody>
            <tr>
              <td className="empty-row">No users match your filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>#{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className="badge-role">{roleLabel(u.role)}</span>
              </td>
              <td>{u.department || "—"}</td>
              <td>
                <span
                  className={`status-pill ${
                    u.status === "ACTIVE" ? "active" : "inactive"
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td>{formatDate(u.created_at)}</td>
              <td>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="action-btn"
                    title="View details"
                    onClick={() => onView(u)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn"
                    title="Edit user"
                    onClick={() => onEdit(u)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="action-btn"
                    title={u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    onClick={() => onToggleStatus(u)}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    className="action-btn"
                    title="Reset password"
                    onClick={() => onResetPassword(u)}
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    className="action-btn"
                    title="Delete user"
                    onClick={() => onDelete(u)}
                    style={{ color: "#dc2626" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
