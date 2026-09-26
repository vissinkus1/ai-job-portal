import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Forms.css";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    
    setLoading(true);
    try {
      await api.put("/auth/update-password", { currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete("/auth/delete-account");
      localStorage.removeItem("token");
      toast.success("Account deleted permanently");
      navigate("/");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "600px" }}>
      <div className="page-header">
        <h1>⚙️ Account Settings</h1>
        <p>Manage your security and account preferences</p>
      </div>

      <div className="profile-form-card" style={{ marginBottom: "32px" }}>
        <h2>Update Password</h2>
        <form onSubmit={handleUpdatePassword} style={{ marginTop: "20px" }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="glass-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="glass-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="glass-button" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="profile-form-card" style={{ border: "1px solid rgba(255, 60, 60, 0.3)" }}>
        <h2 style={{ color: "#ff4d4d" }}>Danger Zone</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "10px", marginBottom: "20px" }}>
          Once you delete your account, there is no going back. All your data (jobs, applications, messages) will be permanently removed.
        </p>

        {!showConfirm ? (
          <button 
            type="button" 
            className="glass-button ghost" 
            style={{ color: "#ff4d4d", borderColor: "rgba(255, 60, 60, 0.3)" }}
            onClick={() => setShowConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div style={{ background: "rgba(255, 60, 60, 0.1)", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ color: "#ff4d4d", marginBottom: "10px" }}>Are you absolutely sure?</h3>
            <p style={{ marginBottom: "20px", fontSize: "0.9rem" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button" 
                className="glass-button secondary" 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="glass-button" 
                style={{ background: "#ff4d4d", color: "white", borderColor: "transparent" }}
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
