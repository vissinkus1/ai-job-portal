import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./JobDetail.css";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchJob();
    if (token) checkIfApplied();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error("Failed to fetch job");
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const res = await api.get(`/applications/check/${id}`);
      setApplied(res.data.applied);
    } catch (err) {
      // Not logged in or error, ignore
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post(`/applications/${id}`, { coverLetter });
      setApplied(true);
      setShowApplyModal(false);
      setMessage({ type: "success", text: "Application submitted successfully! 🎉" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to apply",
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h3>Job not found</h3>
          <Link to="/jobs" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate("/jobs")} className="back-link">
        ← Back to Jobs
      </button>

      {message.text && (
        <div className={message.type === "error" ? "error-message" : "success-message"} style={{ marginBottom: "20px" }}>
          {message.text}
        </div>
      )}

      <div className="job-detail-layout">
        {/* Main Content */}
        <div className="job-detail-main">
          <div className="job-detail-card">
            <div className="job-detail-header">
              <div className="company-avatar large">
                {job.company.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="job-detail-title">{job.title}</h1>
                <p className="job-detail-company">{job.company}</p>
              </div>
            </div>

            <div className="job-detail-tags">
              <span className="badge primary">{job.type || "Full-time"}</span>
              <span className="badge secondary">📍 {job.location}</span>
              {job.salary && job.salary !== "Not disclosed" && (
                <span className="badge success">💰 {job.salary}</span>
              )}
            </div>

            <div className="job-detail-section">
              <h3>Job Description</h3>
              <div 
                className="job-description-text default-html-content" 
                dangerouslySetInnerHTML={{ __html: job.description }} 
              />
            </div>

            <div className="job-share-section" style={{ marginTop: "32px", padding: "20px 0", borderTop: "1px solid var(--glass-border)", display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 500 }}>Share this job:</span>
              <button 
                className="glass-button small ghost" 
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                in LinkedIn
              </button>
              <button 
                className="glass-button small ghost" 
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out this role: ${job.title} at ${job.company}`, '_blank')}
              >
                𝕏 Twitter
              </button>
              <button 
                className="glass-button small ghost" 
                onClick={() => { 
                  navigator.clipboard.writeText(window.location.href); 
                  toast?.success ? toast.success("Link copied to clipboard!") : alert("Link copied!"); 
                }}
              >
                🔗 Copy Link
              </button>
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="job-detail-section">
                <h3>Required Skills</h3>
                <div className="job-skills-list">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="badge primary">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="job-detail-sidebar">
          <div className="job-sidebar-card">
            <h3>Job Overview</h3>
            <div className="sidebar-item">
              <span className="sidebar-label">📍 Location</span>
              <span className="sidebar-value">{job.location}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">💼 Type</span>
              <span className="sidebar-value">{job.type || "Full-time"}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">💰 Salary</span>
              <span className="sidebar-value">{job.salary || "Not disclosed"}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">📅 Posted</span>
              <span className="sidebar-value">
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </span>
            </div>
            {job.postedBy && (
              <div className="sidebar-item">
                <span className="sidebar-label">👤 Posted by</span>
                <span className="sidebar-value">{job.postedBy.name}</span>
              </div>
            )}

            {token ? (
              applied ? (
                <div className="applied-badge">
                  ✅ Already Applied
                </div>
              ) : (
                <button className="glass-button" onClick={() => setShowApplyModal(true)}>
                  🚀 Apply Now
                </button>
              )
            ) : (
              <Link to="/login" className="glass-button" style={{ display: "block", textAlign: "center", marginTop: "20px" }}>
                Login to Apply
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply to {job.title}</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>
            <p className="modal-subtitle">{job.company} • {job.location}</p>

            <form onSubmit={handleApply}>
              <label className="form-label">Cover Letter</label>
              <textarea
                className="glass-textarea"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit for this role..."
                rows={6}
              />

              {message.type === "error" && (
                <div className="error-message">{message.text}</div>
              )}

              <div className="modal-actions">
                <button type="button" className="glass-button secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="glass-button" disabled={applying}>
                  {applying ? "Submitting..." : "🚀 Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
