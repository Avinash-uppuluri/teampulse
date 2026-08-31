export default function DashboardCard({ label, value, icon: Icon }) {
  return (
    <div className="dashboard-card">
      {Icon && (
        <div className="dashboard-card-icon">
          <Icon size={18} />
        </div>
      )}
      <div className="dashboard-card-label">{label}</div>
      <div className="dashboard-card-value">{value ?? 0}</div>
    </div>
  );
}
