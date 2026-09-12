import { useState, useEffect } from "react";
import api from "../services/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setMessage({ type: "error", text: "Session expired. Please log in again." });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);

      if (res.data.emailVerified === false) {
        setMessage({ type: "success", text: "Login successful! Please verify your email." });
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}`), 800);
      } else {
        setMessage({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2>Welcome Back</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Sign in to your account
        </p>

        {message.text && (
          <div className={message.type === "error" ? "error-message" : "success-message"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="glass-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="glass-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="glass-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <Link to="/forgot-password" className="link" style={{ marginBottom: 4 }}>Forgot password?</Link>
        <Link to="/register" className="link">Don't have an account? Register</Link>
      </div>
    </div>
  );
}
