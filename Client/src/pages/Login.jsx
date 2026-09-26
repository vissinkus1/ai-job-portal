import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import "../App.css";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // If already logged in, redirect to dashboard or intended route
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setMessage({ type: "error", text: "Session expired. Please log in again." });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await login(email.trim(), password);
      setMessage({ type: "success", text: "Login successful! Redirecting..." });

      const destination = location.state?.from?.pathname || "/dashboard";
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Login failed. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <SEO title="Sign In" description="Sign in to your AI Job Portal account to access your dashboard, applications, and AI-powered career tools." />
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
            autoComplete="email"
            required
          />
          <input
            type="password"
            className="glass-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
