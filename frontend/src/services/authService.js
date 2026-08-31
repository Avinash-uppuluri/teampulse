import api from "./api";

export const authService = {
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data.data; // { token, user }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // ignore network errors on logout
    }
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data.data;
  },
};
