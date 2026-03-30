import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyResetCode, resetPassword } from "../services/api";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Reset code sent to your email");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code");
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await verifyResetCode(code);
      setSuccess("Code verified! Set your new password");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await resetPassword(code, password);
      setSuccess("Password reset successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Skyline</h2>
        <p className="auth-subtitle">
          {step === 1 && "Enter your email to reset password"}
          {step === 2 && "Enter the code sent to your email"}
          {step === 3 && "Set your new password"}
        </p>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="error-msg" style={{ background: "rgba(67,233,123,0.12)", border: "1px solid rgba(67,233,123,0.25)", color: "#43e97b" }}>{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required autoFocus />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                autoFocus
                maxLength={6}
                style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
              />
            </div>
            <button className="btn" type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button type="button" className="btn" style={{ marginTop: 8, background: "#2a2d3a" }} onClick={() => { setStep(1); setError(""); setSuccess(""); }}>
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required autoFocus />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="switch-link">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
