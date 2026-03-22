import { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [role, setRole] = useState("seeker");

  useEffect(() => {
    fetchProfile();
    fetchResume();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      const user = res.data;
      setProfile(user);
      setName(user.name || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setSkills(user.skills?.join(", ") || "");
      setRole(user.role || "seeker");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const fetchResume = async () => {
    try {
      const res = await api.get("/resume/me");
      setResume(res.data.resume);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter((s) => s);
      const res = await api.put("/profile/me", { name, bio, phone, skills: skillsArray, role });
      setProfile(res.data);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);
    setUploading(true);

    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(res.data.resume);
      toast.success("Resume uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    try {
      await api.delete("/resume/me");
      setResume(null);
      toast.info("Resume deleted");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-sidebar">
          <div className="profile-avatar-card">
            <div className="avatar-circle">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3>{profile?.name}</h3>
            <p className="profile-email">{profile?.email}</p>
            <span className={`badge ${role === "employer" ? "secondary" : "primary"}`}>
              {role === "employer" ? "👔 Employer" : "🔍 Job Seeker"}
            </span>
            {profile?.createdAt && (
              <p className="profile-joined">
                Joined {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>

          {/* Resume Section */}
          <div className="resume-card">
            <h4>📄 Resume</h4>
            {resume ? (
              <div className="resume-info">
                <a
                  href={`http://localhost:5000/uploads/${resume.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-file-link"
                >
                  📎 {resume.originalName}
                </a>
                <p className="resume-date">
                  Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
                <div className="resume-actions">
                  <label className="glass-button small secondary" style={{ cursor: "pointer" }}>
                    Replace
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload}
                      style={{ display: "none" }} />
                  </label>
                  <button onClick={handleResumeDelete} className="glass-button small danger">
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="resume-upload-zone">
                <label className="upload-label">
                  {uploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <span className="upload-icon">📤</span>
                      <span>Click to upload resume</span>
                      <span className="upload-hint">PDF, DOC, DOCX • Max 5MB</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload}
                    style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="profile-form-card">
          <h3 className="form-section-title">Edit Profile</h3>

          {message.text && (
            <div className={message.type === "error" ? "error-message" : "success-message"}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            <label className="form-label">Full Name</label>
            <input type="text" className="glass-input" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />

            <label className="form-label">Role</label>
            <select className="glass-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="seeker">🔍 Job Seeker</option>
              <option value="employer">👔 Employer</option>
            </select>

            <label className="form-label">Bio</label>
            <textarea className="glass-textarea" value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..." rows={4} />

            <label className="form-label">Phone</label>
            <input type="tel" className="glass-input" value={phone}
              onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />

            <label className="form-label">Skills (comma separated)</label>
            <input type="text" className="glass-input" value={skills}
              onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Python..." />

            {skills && (
              <div className="skills-preview">
                {skills.split(",").map((s, i) =>
                  s.trim() ? (<span key={i} className="badge primary">{s.trim()}</span>) : null
                )}
              </div>
            )}

            <button type="submit" className="glass-button" disabled={saving}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
