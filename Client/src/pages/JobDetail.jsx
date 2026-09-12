import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./JobDetail.css";
import "./Admin.css";

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
  const [similarJobs, setSimilarJobs] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchJob();
    if (token) checkIfApplied();
    // Fetch similar jobs
    api.get(`/public/similar/${id}`).then((res) => setSimilarJobs(res.data)).catch(() => {});
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

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    setReporting(true);
    try {
      await api.post(`/reports/${id}`, { reason: reportReason, details: reportDetails });
      toast.success("Report submitted. Thank you!");
      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setReporting(false);
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
              {job.experienceLevel && <span className="badge secondary">{job.experienceLevel} Level</span>}
              <span className="badge secondary">📍 {job.location}</span>
              {job.salary && job.salary !== "Not disclosed" && (
                <span className="badge success">💰 {job.salary}</span>
              )}
              {job.deadline && new Date(job.deadline) < new Date() && (
                <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>⚠️ Expired</span>
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
              {token && (
                <button
                  className="glass-button small ghost"
                  onClick={() => setShowReportModal(true)}
                  style={{ color: "#ef4444" }}
                >
                  🚩 Report
                </button>
              )}
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
            {job.experienceLevel && (
              <div className="sidebar-item">
                <span className="sidebar-label">🎯 Experience</span>
                <span className="sidebar-value">{job.experienceLevel} Level</span>
              </div>
            )}
            {job.deadline && (
              <div className="sidebar-item">
                <span className="sidebar-label">⏰ Deadline</span>
                <span className="sidebar-value" style={new Date(job.deadline) < new Date() ? { color: '#ef4444' } : {}}>
                  {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
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
              ) : job.deadline && new Date(job.deadline) < new Date() ? (
                <button className="glass-button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  🚫 Applications Closed
                </button>
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

            {/* Contact Employer */}
            {token && job.postedBy && (
              <Link
                to={`/chat?user=${job.postedBy._id}`}
                className="glass-button secondary"
                style={{ display: "block", textAlign: "center", marginTop: "10px" }}
              >
                💬 Contact Employer
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Similar Jobs</h2>
          <div className="jobs-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {similarJobs.map((sj) => (
              <Link to={`/jobs/${sj._id}`} key={sj._id} className="job-card fade-in-up" style={{ textDecoration: "none" }}>
                <div className="job-card-header">
                  <div className="company-avatar">{sj.company.charAt(0).toUpperCase()}</div>
                  <div className="job-card-meta">
                    <h3 className="job-title">{sj.title}</h3>
                    <p className="job-company">{sj.company}</p>
                  </div>
                </div>
                <div className="job-card-tags">
                  <span className="badge primary">{sj.type || "Full-time"}</span>
                  <span className="job-location">📍 {sj.location}</span>
                </div>
                <div className="job-card-footer">
                  <span className="job-salary">{sj.salary || "Not disclosed"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚩 Report this Job</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <p className="modal-subtitle">{job.title} at {job.company}</p>

            <form onSubmit={handleReport}>
              <label className="form-label">Reason for reporting</label>
              <div className="report-reasons">
                {["spam", "misleading", "inappropriate", "other"].map((r) => (
                  <label key={r} className={`report-reason-option ${reportReason === r ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={() => setReportReason(r)}
                    />
                    <span style={{ textTransform: "capitalize" }}>
                      {r === "spam" && "🗑️ "}
                      {r === "misleading" && "⚠️ "}
                      {r === "inappropriate" && "🚫 "}
                      {r === "other" && "📝 "}
                      {r}
                    </span>
                  </label>
                ))}
              </div>

              <label className="form-label">Additional details (optional)</label>
              <textarea
                className="glass-textarea"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Add any additional context..."
                rows={3}
              />

              <div className="modal-actions">
                <button type="button" className="glass-button secondary" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="glass-button danger" disabled={reporting}>
                  {reporting ? "Submitting..." : "🚩 Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
