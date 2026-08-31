import api from "./api";

export const userService = {
  async getStats() {
    const res = await api.get("/admin/stats");
    return res.data.data;
  },

  async listUsers({ search, role, status, page = 1, per_page = 10 } = {}) {
    const res = await api.get("/admin/users", {
      params: { search, role, status, page, per_page },
    });
    return res.data.data; // { users, pagination }
  },

  async getUser(id) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  },

  async createUser(payload) {
    const res = await api.post("/admin/users", payload);
    return res.data.data;
  },

  async updateUser(id, payload) {
    const res = await api.put(`/admin/users/${id}`, payload);
    return res.data.data;
  },

  async setStatus(id, status) {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data.data;
  },

  async resetPassword(id, password) {
    const res = await api.patch(`/admin/users/${id}/reset-password`, {
      password,
    });
    return res.data;
  },

  async deleteUser(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
};
