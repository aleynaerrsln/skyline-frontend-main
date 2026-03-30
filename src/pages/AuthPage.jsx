import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, register } from "../services/api";
import { User, Lock, Mail, Monitor } from "lucide-react";
import "./AuthPage.css";

function AuthPage() {
  const location = useLocation();
  const [toggled, setToggled] = useState(location.pathname === "/register");
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

  const goToRegister = (e) => {
    e.preventDefault();
    setLoginError("");
    setToggled(true);
  };

  const goToLogin = (e) => {
    e.preventDefault();
    setRegError("");
    setToggled(false);
  };

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-wrapper ${toggled ? "toggled" : ""}`}>
        <div className="background-shape" />
        <div className="secondary-shape" />

        {/* ===== LOGIN PANEL (Left) ===== */}
        <div className="credentials-panel signin">
          <h2 className="slide-element">Login</h2>
          {loginError && <div className="auth-error-msg slide-element">{loginError}</div>}
          <form onSubmit={handleLoginSubmit}>
            <div className="field-wrapper slide-element">
              <input
                type="email"
                name="email"
                placeholder="Username"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <span className="field-icon"><User size={20} /></span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <span className="field-icon"><Lock size={20} /></span>
            </div>

            <div className="slide-element">
              <button className="submit-button" type="submit" disabled={loginLoading}>
                {loginLoading ? "Signing in..." : "Login"}
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>Don't have an account? <br /> <a href="#" onClick={goToRegister}>Sign Up</a></p>
            </div>
          </form>
        </div>

        {/* ===== WELCOME - Login side (Right) ===== */}
        <div className="welcome-section signin">
          <h2 className="slide-element">WELCOME<br />BACK!</h2>
        </div>

        {/* ===== REGISTER PANEL (Right) ===== */}
        <div className="credentials-panel signup">
          <h2 className="slide-element">Register</h2>
          {regError && <div className="auth-error-msg slide-element">{regError}</div>}
          <form onSubmit={handleRegSubmit} autoComplete="off">
            <div className="field-wrapper slide-element">
              <input
                type="text"
                name="reg-name"
                placeholder="Username"
                autoComplete="off"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                required
              />
              <span className="field-icon"><User size={20} /></span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="text"
                name="reg-workspace"
                placeholder="Workspace Name"
                autoComplete="off"
                value={regForm.workspaceName}
                onChange={(e) => setRegForm({ ...regForm, workspaceName: e.target.value })}
                required
              />
              <span className="field-icon"><Monitor size={20} /></span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="email"
                name="reg-email"
                placeholder="Email"
                autoComplete="off"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
              <span className="field-icon"><Mail size={20} /></span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="password"
                name="reg-password"
                placeholder="Password"
                autoComplete="new-password"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                minLength={6}
                required
              />
              <span className="field-icon"><Lock size={20} /></span>
            </div>

            <div className="slide-element">
              <button className="submit-button" type="submit" disabled={regLoading}>
                {regLoading ? "Creating..." : "Register"}
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>Already have an account? <br /> <a href="#" onClick={goToLogin}>Sign In</a></p>
            </div>
          </form>
        </div>

        {/* ===== WELCOME - Register side (Left) ===== */}
        <div className="welcome-section signup">
          <h2 className="slide-element">WELCOME!</h2>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
