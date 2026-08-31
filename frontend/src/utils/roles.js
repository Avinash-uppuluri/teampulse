export const ROLES = [
  "ADMIN",
  "PROJECT_MANAGER",
  "TEAM_LEAD",
  "DEVELOPER",
  "QA_TESTER",
  "CLIENT",
];

export const ROLE_LABELS = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEAD: "Team Lead",
  DEVELOPER: "Developer",
  QA_TESTER: "QA Tester",
  CLIENT: "Client",
};

export const ROLE_DASHBOARD_PATH = {
  ADMIN: "/admin/dashboard",
  PROJECT_MANAGER: "/pm/dashboard",
  TEAM_LEAD: "/team-lead/dashboard",
  DEVELOPER: "/developer/dashboard",
  QA_TESTER: "/qa/dashboard",
  CLIENT: "/client/dashboard",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
