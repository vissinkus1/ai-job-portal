import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { SERVER_URL } from "../config/apiConfig";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Applicants.css";

// Compute AI match score between applicant skills and job skills
function computeMatchScore(applicantSkills = [], jobSkills = []) {
  if (jobSkills.length === 0 || applicantSkills.length === 0) return { score: 0, matched: [] };
  const normJob = jobSkills.map((s) => s.toLowerCase().trim());
  const normApp = applicantSkills.map((s) => s.toLowerCase().trim());
  const matched = normApp.filter((as) =>
    normJob.some((js) => js.includes(as) || as.includes(js))
  );
  const score = Math.round((matched.length / normJob.length) * 100);
  return {
    score: Math.min(score, 100),
    matched: matched.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
  };
}

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobSkills, setJobSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);

  // Interview modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    dateTime: "",
    meetingLink: "",
    notes: "",
  });
  const [scheduling, setScheduling] = useState(false);

  // Employer notes state
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      const [appRes, jobRes, intRes] = await Promise.all([
        api.get(`/applications/job/${jobId}`),
        api.get(`/jobs/${jobId}`),
        api.get(`/interviews/job/${jobId}`).catch(() => ({ data: [] })),
      ]);
      // Support both old format (array) and new format ({ applications, jobSkills })
      const appData = appRes.data;
      if (Array.isArray(appData)) {
        setApplicants(appData);
      } else {
        setApplicants(appData.applications || []);
        setJobSkills(appData.jobSkills || []);
      }
      setJobTitle(jobRes.data.title);
      // Also grab job skills from the job response as fallback
      if (jobRes.data.skills?.length > 0 && jobSkills.length === 0) {
        setJobSkills(jobRes.data.skills);
      }
      setInterviews(intRes.data);
    } catch (err) {
      console.error("Failed to fetch applicants");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplicants(
        applicants.map((a) =>
          a._id === appId ? { ...a, status } : a
        )
      );
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const openInterviewModal = (app) => {
    setSelectedApp(app);
    setInterviewForm({ dateTime: "", meetingLink: "", notes: "" });
    setShowModal(true);
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.dateTime) return toast.error("Please select a date and time");
    setScheduling(true);
    try {
      const res = await api.post("/interviews", {
        applicationId: selectedApp._id,
        ...interviewForm,
      });
      setInterviews([...interviews, res.data.interview]);
      toast.success("Interview scheduled!");
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule interview");
    } finally {
      setScheduling(false);
    }
  };

  const getInterviewForApp = (appId) => {
    return interviews.find((i) => i.application === appId && i.status === "scheduled");
  };

  const handleSaveNotes = async (appId) => {
    try {
      await api.put(`/applications/${appId}/notes`, { notes: notesDraft });
      setApplicants((prev) =>
        prev.map((a) => a._id === appId ? { ...a, employerNotes: notesDraft } : a)
      );
      setEditingNotes(null);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notes");
    }
  };

  const statusConfig = {
    pending: { label: "⏳ Pending", className: "status-pending" },
    reviewed: { label: "👀 Reviewed", className: "status-reviewed" },
    accepted: { label: "✅ Accepted", className: "status-accepted" },
    rejected: { label: "❌ Rejected", className: "status-rejected" },
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
      <button onClick={() => navigate("/manage-jobs")} className="back-link">
        ← Back to Manage Jobs
      </button>

      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Applicants</h1>
            <p>Reviewing candidates for <strong>{jobTitle}</strong></p>
          </div>
          {applicants.length > 0 && (
            <a
              href={`${SERVER_URL}/api/applications/job/${jobId}/export`}
              className="glass-button small secondary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                const token = localStorage.getItem("token");
                fetch(`${SERVER_URL}/api/applications/job/${jobId}/export`, {
                  headers: { "x-auth-token": token },
                })
                  .then(r => r.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `applicants-${jobId}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
              }}
            >
              📥 Export CSV
            </a>
          )}
        </div>
      </div>

      {applicants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No applicants yet</h3>
          <p>Share your job listing to attract candidates</p>
        </div>
      ) : (
        <div className="applicants-list">
          {applicants.map((app, index) => {
            const scheduledInterview = getInterviewForApp(app._id);
            const profilePic = app.applicant?.profilePicture?.filename;
            const matchData = computeMatchScore(app.applicant?.skills, jobSkills);
            return (
              <div
                key={app._id}
                className="applicant-card fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="applicant-header">
                  {profilePic ? (
                    <img
                      src={`${SERVER_URL}/uploads/${profilePic}`}
                      alt={app.applicant?.name}
                      className="applicant-avatar-img"
                    />
                  ) : (
                    <div className="applicant-avatar">
                      {app.applicant?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="applicant-info">
                    <h3>{app.applicant?.name || "Unknown"}</h3>
                    <p>{app.applicant?.email}</p>
                  </div>
                  <span className={`status-badge ${statusConfig[app.status]?.className || ""}`}>
                    {statusConfig[app.status]?.label || app.status}
                  </span>
                </div>

                {/* AI Match Score */}
                {jobSkills.length > 0 && app.applicant?.skills?.length > 0 && (
                  <div className="ai-match-section">
                    <div className="ai-match-ring-wrapper">
                      <svg viewBox="0 0 36 36" className="ai-match-ring-svg">
                        <path
                          className="ai-match-ring-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="ai-match-ring-fill"
                          strokeDasharray={`${matchData.score}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{
                            stroke: matchData.score >= 75 ? "#22c55e" : matchData.score >= 50 ? "#00c6ff" : matchData.score >= 25 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </svg>
                      <span className="ai-match-ring-text">{matchData.score}%</span>
                    </div>
                    <div className="ai-match-details">
                      <span className="ai-match-label">🤖 AI Match</span>
                      {matchData.matched.length > 0 && (
                        <div className="ai-match-skills">
                          {matchData.matched.map((s, i) => (
                            <span key={i} className="badge secondary">{s}</span>
                          ))}
                        </div>
                      )}
                      {matchData.score === 0 && (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No matching skills</span>
                      )}
                    </div>
                  </div>
                )}

                {app.applicant?.bio && (
                  <div className="applicant-section">
                    <label>Bio</label>
                    <p>{app.applicant.bio}</p>
                  </div>
                )}

                {app.applicant?.skills?.length > 0 && (
                  <div className="applicant-section">
                    <label>Skills</label>
                    <div className="applicant-skills">
                      {app.applicant.skills.map((s, i) => (
                        <span key={i} className="badge primary">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {app.applicant?.phone && (
                  <div className="applicant-section">
                    <label>Phone</label>
                    <p>{app.applicant.phone}</p>
                  </div>
                )}

                {app.coverLetter && (
                  <div className="applicant-section">
                    <label>Cover Letter</label>
                    <p className="cover-letter-text">{app.coverLetter}</p>
                  </div>
                )}

                {app.applicant?.resume && (
                  <div className="applicant-section">
                    <label>📄 Resume</label>
                    <a
                      href={`${SERVER_URL}/uploads/${app.applicant.resume.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button small secondary"
                      style={{ display: "inline-block", marginTop: "4px" }}
                    >
                      Download {app.applicant.resume.originalName || "Resume"}
                    </a>
                  </div>
                )}

                <div className="applicant-section">
                  <label>Applied</label>
                  <p>{new Date(app.appliedAt).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric"
                  })}</p>
                </div>

                {/* Employer Notes */}
                <div className="applicant-section">
                  <label>📝 Private Notes</label>
                  {editingNotes === app._id ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <textarea
                        className="glass-textarea"
                        rows={2}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Add private notes about this candidate..."
                        style={{ flex: 1, minHeight: "60px" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button className="glass-button small" onClick={() => handleSaveNotes(app._id)}>Save</button>
                        <button className="glass-button small secondary" onClick={() => setEditingNotes(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <p style={{ flex: 1, fontSize: "0.88rem", color: app.employerNotes ? "var(--text-color)" : "var(--text-muted)", fontStyle: app.employerNotes ? "normal" : "italic" }}>
                        {app.employerNotes || "No notes yet"}
                      </p>
                      <button className="glass-button small secondary" onClick={() => { setEditingNotes(app._id); setNotesDraft(app.employerNotes || ""); }}>
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Interview info */}
                {scheduledInterview && (
                  <div className="applicant-section" style={{ background: "rgba(124, 58, 237, 0.08)", padding: "12px", borderRadius: "8px" }}>
                    <label>📅 Interview Scheduled</label>
                    <p style={{ fontWeight: 500 }}>
                      {new Date(scheduledInterview.dateTime).toLocaleString("en-US", {
                        dateStyle: "medium", timeStyle: "short"
                      })}
                    </p>
                    {scheduledInterview.meetingLink && (
                      <p><a href={scheduledInterview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>🔗 Join Meeting</a></p>
                    )}
                    {scheduledInterview.notes && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{scheduledInterview.notes}</p>}
                  </div>
                )}

                <div className="applicant-actions">
                  <Link
                    to={`/chat?user=${app.applicant?._id}`}
                    className="glass-button small secondary"
                  >
                    💬 Message
                  </Link>
                  {app.status === "accepted" && !scheduledInterview && (
                    <button
                      onClick={() => openInterviewModal(app)}
                      className="glass-button small"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 15px rgba(124,58,237,0.25)" }}
                    >
                      📅 Schedule Interview
                    </button>
                  )}
                  {app.status !== "accepted" && (
                    <button
                      onClick={() => updateStatus(app._id, "accepted")}
                      className="glass-button small"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 15px rgba(34,197,94,0.25)" }}
                    >
                      ✅ Accept
                    </button>
                  )}
                  {app.status !== "reviewed" && app.status !== "accepted" && app.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(app._id, "reviewed")}
                      className="glass-button small secondary"
                    >
                      👀 Mark Reviewed
                    </button>
                  )}
                  {app.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(app._id, "rejected")}
                      className="glass-button small danger"
                    >
                      ❌ Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interview Scheduling Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "20px" }}>📅 Schedule Interview</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
              With <strong>{selectedApp?.applicant?.name}</strong> for <strong>{jobTitle}</strong>
            </p>
            <form onSubmit={handleScheduleInterview}>
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input
                  type="datetime-local"
                  className="glass-input"
                  value={interviewForm.dateTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, dateTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Link</label>
                <input
                  type="url"
                  className="glass-input"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="glass-input"
                  rows="3"
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  placeholder="Any instructions for the candidate..."
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="glass-button secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="glass-button" disabled={scheduling}>
                  {scheduling ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
