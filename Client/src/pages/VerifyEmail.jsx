import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import { useAuth } from "../context/AuthContext";
import "../App.css";
import "./Auth.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [devCode, setDevCode] = useState(location.state?.devCode || "");
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const toast = useToast();
  const { setAuthSession } = useAuth();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // In dev mode (or when devCode not yet set), attempt to retrieve dev verification code
  useEffect(() => {
    if (!email || devCode) return;
    api.get(`/auth/dev-code?email=${encodeURIComponent(email)}`)
      .then((res) => {
        if (res.data?.devCode) {
          setDevCode(res.data.devCode);
        }
      })
      .catch(() => {
        // Dev endpoint silent fallback
      });
  }, [email, devCode]);

  const handleAutoFill = (codeToFill) => {
    const target = (codeToFill || devCode || "").toString();
    if (!target) return;
    const digits = target.slice(0, 6).split("");
    while (digits.length < 6) digits.push("");
    setCode(digits);
    inputRefs.current[5]?.focus();
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length > 0) {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit code" });
      return;
    }
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.post("/auth/verify-email", { email, code: fullCode });
      toast.success(res.data.message);
      setMessage({ type: "success", text: res.data.message });
      if (res.data?.token) {
        setAuthSession(res.data.token, res.data.user);
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      const res = await api.post("/auth/resend-verification", { email });
      toast.success("New verification code sent!");
      if (res.data?.devCode) {
        setDevCode(res.data.devCode);
      }
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend");
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ maxWidth: "480px" }}>
        <h2>Verify Your Email</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Enter the 6-digit code sent to your email
        </p>

        {/* ─── DEV MODE BANNER ─── */}
        {devCode && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(124, 58, 237, 0.12))",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "20px",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(245, 158, 11, 0.1)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f59e0b",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              <span>🛠️ Dev Mode Active</span>
              <span
                style={{
                  background: "rgba(245,158,11,0.2)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "0.7rem",
                }}
              >
                No Email Needed
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
              Your generated verification OTP is:
            </p>
            <div
              style={{
                display: "inline-block",
                fontSize: "1.8rem",
                fontWeight: 800,
                letterSpacing: "6px",
                color: "#00c6ff",
                background: "rgba(0, 198, 255, 0.08)",
                padding: "6px 18px",
                borderRadius: "10px",
                border: "1px dashed rgba(0, 198, 255, 0.4)",
                marginBottom: "10px",
                fontFamily: "monospace",
              }}
            >
              {devCode}
            </div>
            <div>
              <button
                type="button"
                onClick={() => handleAutoFill(devCode)}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                ⚡ Click to Auto-Fill Code
              </button>
            </div>
          </div>
        )}

        {message.text && (
          <div className={message.type === "error" ? "error-message" : "success-message"}>
            {message.text}
          </div>
        )}

        {!emailParam && (
          <input
            type="email"
            className="glass-input"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: "16px" }}
          />
        )}

        <form onSubmit={handleVerify}>
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "24px",
          }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={{
                  width: "50px",
                  height: "56px",
                  textAlign: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.04)",
                  border: digit ? "2px solid var(--primary-color)" : "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  color: "var(--text-color)",
                  outline: "none",
                  transition: "all 0.2s ease",
                  caretColor: "var(--primary-color)",
                }}
              />
            ))}
          </div>

          <button type="submit" className="glass-button" disabled={loading}>
            {loading ? "Verifying..." : "✉️ Verify Email"}
          </button>
        </form>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: resendCooldown > 0 ? "var(--text-muted)" : "var(--primary-color)",
              cursor: resendCooldown > 0 ? "default" : "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive the code? Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
