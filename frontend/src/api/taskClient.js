import api from "./http";

// FIX (merge): originally a standalone fetch() wrapper pointed at a
// nonexistent :5003 server and reading the JWT from the wrong localStorage
// key ("tp_token" instead of "teampulse_token"). Rebuilt on the shared
// axios instance (../api/http) so it authenticates and routes correctly,
// while keeping the same get/post/put/patch/delete surface so taskApi.js
// and every component that calls it needed no further changes.
export const apiClient = {
  get: (path, params) => api.get(path, { params }).then((r) => r.data),
  post: (path, body) => api.post(path, body).then((r) => r.data),
  put: (path, body) => api.put(path, body).then((r) => r.data),
  patch: (path, body) => api.patch(path, body).then((r) => r.data),
  delete: (path) => api.delete(path).then((r) => r.data),
};
