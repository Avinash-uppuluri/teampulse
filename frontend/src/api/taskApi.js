import { apiClient } from "./taskClient";

export const taskApi = {
  // Tasks
  listTasks: (filters) => apiClient.get("/tasks", filters),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (payload) => apiClient.post("/tasks", payload),
  updateTask: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
  assignTask: (id, assigned_to) => apiClient.patch(`/tasks/${id}/assign`, { assigned_to }),
  updateStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
  updateProgress: (id, progress) => apiClient.patch(`/tasks/${id}/progress`, { progress }),

  // Comments
  listComments: (taskId) => apiClient.get(`/tasks/${taskId}/comments`),
  addComment: (taskId, comment) => apiClient.post(`/tasks/${taskId}/comments`, { comment }),

  // Submissions
  listSubmissions: (taskId) => apiClient.get(`/tasks/${taskId}/submissions`),
  submitWork: (taskId, payload) => apiClient.post(`/tasks/${taskId}/submissions`, payload),
  reviewSubmission: (submissionId, review_status, review_notes) =>
    apiClient.patch(`/tasks/submissions/${submissionId}/review`, {
      review_status,
      review_notes,
    }),

  // Developer
  developerTasks: (developerId, filters) =>
    apiClient.get(`/developers/${developerId}/tasks`, filters),
  developerDashboard: (developerId) => apiClient.get(`/developers/${developerId}/dashboard`),

  // Team
  teamTasks: (teamId, filters) => apiClient.get(`/teams/${teamId}/tasks`, filters),
  teamWorkload: (teamId) => apiClient.get(`/teams/${teamId}/workload`),
  teamDeadlines: (teamId) => apiClient.get(`/teams/${teamId}/deadlines`),
};
