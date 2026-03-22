import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/auth/register", { name, email, password });
      setMessage({ type: "success", text: "Account created! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1200);
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
            required
          />
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <Link to="/login" className="link">Already have an account? Login</Link>
      </div>
    </div>
  );
}
