import { useState, useEffect } from "react";
import api from "../services/api";
import { SERVER_URL } from "../config/apiConfig";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resume, setResume] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
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
      setParsedResume(res.data.parsedResume || null);
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
      setParsedResume(res.data.parsedResume || null);
      if (res.data.skillsAdded > 0) {
        toast.success(`Resume uploaded! ${res.data.skillsAdded} skills auto-detected ✨`);
        fetchProfile(); // Refresh profile to show new skills
      } else {
        toast.success("Resume uploaded!");
      }
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
      setParsedResume(null);
      toast.info("Resume deleted");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);

    try {
      const res = await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, profilePicture: res.data.profilePicture }));
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await api.delete("/profile/avatar");
      setProfile((prev) => ({ ...prev, profilePicture: null }));
      toast.info("Profile picture removed");
    } catch {
      toast.error("Failed to remove picture");
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
            <div className="avatar-upload-wrapper">
              {profile?.profilePicture?.filename ? (
                <img
                  src={`${SERVER_URL}/uploads/${profile.profilePicture.filename}`}
                  alt="Profile"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-circle">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <label className="avatar-upload-btn" title="Change photo">
                {avatarUploading ? "..." : "📷"}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                  disabled={avatarUploading}
                />
              </label>
            </div>
            {profile?.profilePicture?.filename && (
              <button
                onClick={handleAvatarDelete}
                className="avatar-remove-btn"
              >
                Remove photo
              </button>
            )}
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
                  href={`${SERVER_URL}/uploads/${resume.filename}`}
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

          {/* AI Parsed Resume Insights */}
          {parsedResume && parsedResume.extractedSkills?.length > 0 && (
            <div className="resume-card" style={{ borderColor: "rgba(124, 58, 237, 0.2)" }}>
              <h4>✨ AI-Extracted Insights</h4>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>Detected Skills</label>
                <div className="skills-preview" style={{ marginTop: "6px" }}>
                  {parsedResume.extractedSkills.map((s, i) => (
                    <span key={i} className="badge secondary">{s}</span>
                  ))}
                </div>
              </div>
              {parsedResume.experienceYears && (
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>Experience</label>
                  <p style={{ margin: "4px 0", fontWeight: 600 }}>{parsedResume.experienceYears} year{parsedResume.experienceYears !== 1 ? "s" : ""}</p>
                </div>
              )}
              {parsedResume.education?.length > 0 && (
                <div>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>Education</label>
                  <div className="skills-preview" style={{ marginTop: "6px" }}>
                    {parsedResume.education.map((e, i) => (
                      <span key={i} className="badge primary">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "12px" }}>
                Parsed {parsedResume.parsedAt ? new Date(parsedResume.parsedAt).toLocaleDateString() : ""}
              </p>
            </div>
          )}
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
