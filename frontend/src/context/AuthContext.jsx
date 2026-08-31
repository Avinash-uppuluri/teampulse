import { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("teampulse_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("teampulse_token");
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token / refresh user info on app load
    authService
      .me()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("teampulse_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("teampulse_token");
        localStorage.removeItem("teampulse_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user: loggedInUser } = await authService.login(
      email,
      password
    );
    localStorage.setItem("teampulse_token", token);
    localStorage.setItem("teampulse_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await authService.logout();
    localStorage.removeItem("teampulse_token");
    localStorage.removeItem("teampulse_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
