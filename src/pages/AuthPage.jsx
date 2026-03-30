import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, register } from "../services/api";
import "./AuthPage.css";

function AuthPage() {
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(location.pathname === "/register");
  const navigate = useNavigate();

  // Login state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    workspaceName: "",
  });
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const { data } = await login(loginForm);
      localStorage.setItem("token", data.token);
      navigate("/app");
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const { data } = await register(regForm);
      localStorage.setItem("token", data.token);
      navigate("/app");
    } catch (err) {
      setRegError(err.response?.data?.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setLoginError("");
    setRegError("");
    setIsRegister(!isRegister);
  };

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-card ${isRegister ? "register-mode" : ""}`}>
        {/* ===== FORM PANELS ===== */}
        <div className="auth-panels">
          {/* Login Form - Left */}
          <div className="auth-form-panel login-panel">
            <h1 className="auth-form-title">Login</h1>
            {loginError && <div className="auth-error-msg">{loginError}</div>}
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
              <div className="auth-input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              </div>
              <div className="auth-forgot-link">
                <a href="/forgot-password">Forgot password?</a>
              </div>
              <button className="auth-submit-btn" type="submit" disabled={loginLoading}>
                {loginLoading ? "Signing in..." : "Login"}
              </button>
            </form>
            <div className="auth-switch-text">
              Don't have an account?
              <a onClick={toggleMode} href="#">Sign Up</a>
            </div>
          </div>

          {/* Register Form - Right */}
          <div className="auth-form-panel register-panel">
            <h1 className="auth-form-title">Register</h1>
            {regError && <div className="auth-error-msg">{regError}</div>}
            <form onSubmit={handleRegSubmit}>
              <div className="auth-input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={regForm.name}
                  onChange={handleRegChange}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
              <div className="auth-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                </span>
              </div>
              <div className="auth-input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  minLength={6}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              </div>
              <div className="auth-input-group">
                <input
                  type="text"
                  name="workspaceName"
                  placeholder="Workspace Name"
                  value={regForm.workspaceName}
                  onChange={handleRegChange}
                  required
                />
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </span>
              </div>
              <button className="auth-submit-btn" type="submit" disabled={regLoading}>
                {regLoading ? "Creating..." : "Register"}
              </button>
            </form>
            <div className="auth-switch-text">
              Already have an account?
              <a onClick={toggleMode} href="#">Sign In</a>
            </div>
          </div>
        </div>

        {/* ===== DIAGONAL OVERLAYS ===== */}
        <div className="auth-overlay">
          <div className="auth-overlay-shape shape-login" />
          <div className="auth-overlay-shape shape-register" />
        </div>

        {/* ===== WELCOME TEXTS ===== */}
        <div className="auth-welcome welcome-login">
          <h2>WELCOME<br />BACK!</h2>
        </div>
        <div className="auth-welcome welcome-register">
          <h2>WELCOME!</h2>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
