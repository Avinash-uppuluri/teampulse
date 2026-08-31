import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "../utils/roles";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      // Backend verified the role — frontend only reads it to route.
      const target = ROLE_DASHBOARD_PATH[loggedInUser.role] || "/dashboard";
      navigate(target, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to log in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Activity size={24} />
          TeamPulse
        </div>
        <div className="auth-subtitle">
          Sign in to your project monitoring dashboard
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input-wrap">
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-toggle"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row-between">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                alert(
                  "Please contact your system administrator to reset your password."
                )
              }
            >
              Forgot password?
            </button>
          </div>

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? (
              <span className="spinner" />
            ) : (
              <>
                <LogIn size={16} /> Login
              </>
            )}
          </button>
        </form>

        <div className="test-creds">
          <strong>Test credentials (after running seed_admin.py):</strong>
          <br />
          Email: admin@teampulse.com
          <br />
          Password: Admin@12345
        </div>
      </div>
    </div>
  );
}
