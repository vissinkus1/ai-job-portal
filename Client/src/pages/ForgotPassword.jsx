import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=newPassword
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState("");
  const toast = useToast();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success("Reset code sent!");
      if (res.data.code) setDevCode(res.data.code); // Dev mode
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      toast.success("Password reset! You can now login.");
      setStep(4); // success
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "480px" }}>
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1>🔐 Reset Password</h1>
        <p>
          {step === 1 && "Enter your email to receive a reset code"}
          {step === 2 && "Enter the 6-digit code"}
          {step === 3 && "Choose a new password"}
          {step === 4 && "You're all set!"}
        </p>
      </div>

      <div className="profile-form-card">
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <label className="form-label">Email Address</label>
            <input type="email" className="glass-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCodeSubmit}>
            {devCode && (
              <div className="success-message" style={{ marginBottom: 16 }}>
                Dev mode — code: <strong>{devCode}</strong>
              </div>
            )}
            <label className="form-label">6-Digit Code</label>
            <input type="text" className="glass-input" value={code}
              onChange={(e) => setCode(e.target.value)} placeholder="123456"
              maxLength={6} required style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "8px" }} />
            <button type="submit" className="glass-button" disabled={!code || code.length !== 6}>
              Verify Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetSubmit}>
            <label className="form-label">New Password</label>
            <input type="password" className="glass-input" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" required />
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? "Resetting..." : "🔒 Reset Password"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
            <p style={{ marginBottom: 20 }}>Your password has been successfully reset.</p>
            <Link to="/login" className="glass-button" style={{ display: "inline-block" }}>
              Go to Login →
            </Link>
          </div>
        )}

        {step < 4 && (
          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem" }}>
            Remember your password?{" "}
            <Link to="/login" style={{ color: "var(--primary-color)", fontWeight: 600 }}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
