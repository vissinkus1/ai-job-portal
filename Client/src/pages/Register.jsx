import { useState, useMemo } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import "../App.css";
import "./Auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Validation helpers
  const validations = useMemo(() => {
    const nameValid = name.trim().length >= 2 && name.trim().length <= 50;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passLength = password.length >= 6;
    const passHasUpper = /[A-Z]/.test(password);
    const passHasNumber = /[0-9]/.test(password);

    let passStrength = 0;
    if (passLength) passStrength++;
    if (passHasUpper) passStrength++;
    if (passHasNumber) passStrength++;
    if (password.length >= 10) passStrength++;

    const passLabel =
      passStrength <= 1 ? "Weak" : passStrength === 2 ? "Fair" : passStrength === 3 ? "Good" : "Strong";
    const passColor =
      passStrength <= 1 ? "#ef4444" : passStrength === 2 ? "#f59e0b" : passStrength === 3 ? "#00c6ff" : "#22c55e";

    return { nameValid, emailValid, passLength, passStrength, passLabel, passColor };
  }, [name, email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validations.nameValid || !validations.emailValid || !validations.passLength) {
      setMessage({ type: "error", text: "Please fix the validation errors below" });
      setTouched({ name: true, email: true, password: true });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.post("/auth/register", { name: name.trim(), email, password });
      setMessage({ type: "success", text: "Account created! Check your email for verification code..." });
      const devCode = res.data?.devCode;
      setTimeout(
        () => navigate(`/verify-email?email=${encodeURIComponent(email)}`, { state: { devCode } }),
        1200
      );
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <SEO title="Create Account" description="Join the AI Job Portal. Create your free account to get AI-powered job recommendations, resume scoring, and skill gap analysis." />
      <div className="glass-card">
        <h2>Create Account</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Join the AI Job Portal
        </p>

        {message.text && (
          <div className={message.type === "error" ? "error-message" : "success-message"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="glass-input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched({ ...touched, name: true })}
            required
          />
          {touched.name && !validations.nameValid && name.length > 0 && (
            <p style={{ color: "#ef4444", fontSize: "0.78rem", textAlign: "left", margin: "2px 0 6px" }}>
              Name must be between 2 and 50 characters
            </p>
          )}

          <input
            type="email"
            className="glass-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched({ ...touched, email: true })}
            required
          />
          {touched.email && !validations.emailValid && email.length > 0 && (
            <p style={{ color: "#ef4444", fontSize: "0.78rem", textAlign: "left", margin: "2px 0 6px" }}>
              Please enter a valid email address
            </p>
          )}

          <input
            type="password"
            className="glass-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, password: true })}
            required
          />
          {touched.password && !validations.passLength && password.length > 0 && (
            <p style={{ color: "#ef4444", fontSize: "0.78rem", textAlign: "left", margin: "2px 0 6px" }}>
              Password must be at least 6 characters
            </p>
          )}

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div style={{ marginTop: "4px", marginBottom: "8px" }}>
              <div style={{
                display: "flex", gap: "4px", marginBottom: "4px",
              }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: "4px",
                      borderRadius: "2px",
                      background: i <= validations.passStrength ? validations.passColor : "rgba(255,255,255,0.1)",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>
              <p style={{
                fontSize: "0.75rem",
                color: validations.passColor,
                textAlign: "left",
                fontWeight: 600,
              }}>
                {validations.passLabel}
              </p>
            </div>
          )}

          <button type="submit" className="glass-button" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <Link to="/login" className="link">Already have an account? Login</Link>
      </div>
    </div>
  );
}
