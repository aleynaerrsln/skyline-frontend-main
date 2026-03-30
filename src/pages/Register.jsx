import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", workspaceName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await register(form);
      localStorage.setItem("token", data.token);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Skyline</h2>
        <p className="auth-subtitle">Create your workspace</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Workspace / Project Name</label>
            <input type="text" name="workspaceName" value={form.workspaceName} onChange={handleChange} placeholder="e.g. Skyline Project" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
            </div>
            <div className="form-group">
              <label>Surname</label>
              <input type="text" name="surname" value={form.surname} onChange={handleChange} placeholder="Surname" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" minLength={6} required />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating workspace..." : "Create Workspace & Register"}
          </button>
        </form>
        <div className="switch-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
