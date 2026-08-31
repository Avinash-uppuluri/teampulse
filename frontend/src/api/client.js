import api from "./http";

// ---- Projects ---------------------------------------------------------
export const ProjectsAPI = {
  list: (params) => api.get("/projects", { params }),
  dashboard: () => api.get("/projects/dashboard"),
  get: (id) => api.get(`/projects/${id}`),
  create: (payload) => api.post("/projects", payload),
  update: (id, payload) => api.put(`/projects/${id}`, payload),
  archive: (id, archived = true) => api.patch(`/projects/${id}/archive`, { archived }),
  remove: (id) => api.delete(`/projects/${id}`),
  activity: (id) => api.get(`/projects/${id}/activity`),
};

// ---- Teams (project-scoped CRUD) --------------------------------------
export const TeamsAPI = {
  listForProject: (projectId) => api.get(`/projects/${projectId}/teams`),
  create: (projectId, payload) => api.post(`/projects/${projectId}/teams`, payload),
  get: (teamId) => api.get(`/teams/${teamId}`),
  update: (teamId, payload) => api.put(`/teams/${teamId}`, payload),
  remove: (teamId, hard = false) => api.delete(`/teams/${teamId}`, { params: { hard } }),
  addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { user_id: userId }),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

// ---- Milestones ---------------------------------------------------------
export const MilestonesAPI = {
  listForProject: (projectId) => api.get(`/projects/${projectId}/milestones`),
  create: (projectId, payload) => api.post(`/projects/${projectId}/milestones`, payload),
  update: (milestoneId, payload) => api.put(`/milestones/${milestoneId}`, payload),
  remove: (milestoneId) => api.delete(`/milestones/${milestoneId}`),
};
