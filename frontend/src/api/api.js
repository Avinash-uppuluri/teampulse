import http from "./http";

// FIX (merge): originally its own fetch() wrapper pointed at a standalone
// :5001 server and read the JWT from localStorage key "token" (Part 1
// actually writes "teampulse_token" -- see ../services/api.js). Rebuilt on
// the shared axios instance so auth and routing both work post-merge; the
// exported `api.*` function names are unchanged so every component here
// needed no further edits.
async function unwrap(promise) {
  return (await promise).data;
}

export const api = {
  // QA
  getTestCases: (params) => unwrap(http.get("/qa/test-cases", { params })),
  getTestCase: (id) => unwrap(http.get(`/qa/test-cases/${id}`)),
  createTestCase: (body) => unwrap(http.post("/qa/test-cases", body)),
  updateTestCase: (id, body) => unwrap(http.put(`/qa/test-cases/${id}`, body)),
  getQaDashboard: (params) => unwrap(http.get("/qa/dashboard", { params })),

  // Bugs
  getBugs: (params) => unwrap(http.get("/bugs", { params })),
  getBug: (id) => unwrap(http.get(`/bugs/${id}`)),
  createBug: (body) => unwrap(http.post("/bugs", body)),
  updateBug: (id, body) => unwrap(http.put(`/bugs/${id}`, body)),
  updateBugStatus: (id, body) => unwrap(http.patch(`/bugs/${id}/status`, body)),
  getBugHistory: (id) => unwrap(http.get(`/bugs/${id}/history`)),

  // Monitoring
  getMainDashboard: () => unwrap(http.get("/monitoring/dashboard")),
  getProjectDetail: (id) => unwrap(http.get(`/monitoring/projects/${id}`)),
  getTeamDetail: (id) => unwrap(http.get(`/monitoring/teams/${id}`)),
  getDeveloperDetail: (id) => unwrap(http.get(`/monitoring/developers/${id}`)),
  getCalendar: (params) => unwrap(http.get("/monitoring/calendar", { params })),

  // Reports
  getReport: (type, params) => unwrap(http.get(`/reports/${type}`, { params })),
  exportReportCsv: (type, params) =>
    http
      .get(`/reports/${type}`, { params: { ...params, export: "csv" }, responseType: "blob" })
      .then((r) => r.data),

  // Client
  getClientProjects: () => unwrap(http.get("/client/projects")),
  submitFeedback: (body) => unwrap(http.post("/client/feedback", body)),
  getFeedback: (params) => unwrap(http.get("/client/feedback", { params })),
  updateFeedbackStatus: (id, body) => unwrap(http.patch(`/client/feedback/${id}/status`, body)),
};

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
