import { useState } from "react";
import { X } from "lucide-react";
import { ROLES, roleLabel } from "../utils/roles";

/**
 * mode: "create" | "edit"
 * initialData: user object (edit mode only)
 */
export default function UserForm({ mode, initialData, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || "DEVELOPER",
    department: initialData?.department || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Name is required.");
    if (!isEdit && !form.email.trim()) return setError("Email is required.");
    if (!isEdit && form.password.length < 8)
      return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      if (isEdit) {
        await onSubmit({
          name: form.name,
          role: form.role,
          department: form.department,
        });
      } else {
        await onSubmit({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department,
        });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {isEdit ? "Edit User" : "Create New User"}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              disabled={isEdit}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="filter-dropdown" style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department (optional)</label>
            <input
              className="form-input"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "10px 18px" }}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
