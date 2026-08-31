import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { userService } from "../services/userService";
import { useToast } from "../hooks/useToast";
import SearchBar from "../components/SearchBar.jsx";
import FilterDropdown from "../components/FilterDropdown.jsx";
import UserTable from "../components/UserTable.jsx";
import UserForm from "../components/UserForm.jsx";
import UserDetails from "../components/UserDetails.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { ROLES, roleLabel } from "../utils/roles";

const ROLE_OPTIONS = ROLES.filter((r) => r !== "ADMIN").map((r) => ({
  value: r,
  label: roleLabel(r),
}));

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export default function UserManagementPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userService.listUsers({ search, role, status, per_page: 50 });
      setUsers(data.users);
    } catch (err) {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300); // debounce search
    return () => clearTimeout(t);
  }, [loadUsers]);

  async function handleCreate(payload) {
    await userService.createUser(payload);
    showToast("User created successfully.");
    loadUsers();
  }

  async function handleEditSave(payload) {
    await userService.updateUser(editingUser.id, payload);
    showToast("User updated successfully.");
    loadUsers();
  }

  async function handleToggleStatus(u) {
    const newStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await userService.setStatus(u.id, newStatus);
      showToast(`${u.name} is now ${newStatus.toLowerCase()}.`);
      loadUsers();
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not update status.", "error");
    }
  }

  async function handleResetPassword(u) {
    const newPassword = window.prompt(
      `Enter a new password for ${u.name} (min 8 characters):`
    );
    if (!newPassword) return;
    try {
      await userService.resetPassword(u.id, newPassword);
      showToast("Password reset successfully.");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not reset password.", "error");
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await userService.deleteUser(u.id);
      showToast("User deleted.");
      loadUsers();
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not delete user.", "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">
            Create, update, and manage every account on TeamPulse.
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "10px 16px" }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> Create User
        </button>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
        <FilterDropdown value={role} onChange={setRole} options={ROLE_OPTIONS} allLabel="All Roles" />
        <FilterDropdown value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      {loading && <LoadingState label="Loading users..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadUsers} />}

      {!loading && !error && (
        <UserTable
          users={users}
          onView={setViewingUser}
          onEdit={setEditingUser}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      )}

      {showCreate && (
        <UserForm
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingUser && (
        <UserForm
          mode="edit"
          initialData={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditSave}
        />
      )}

      {viewingUser && (
        <UserDetails user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
}
