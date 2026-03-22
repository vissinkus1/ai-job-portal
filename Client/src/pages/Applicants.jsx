import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./Applicants.css";

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.get(`/applications/job/${jobId}`),
        api.get(`/jobs/${jobId}`),
      ]);
      setApplicants(appRes.data);
      setJobTitle(jobRes.data.title);
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
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
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
              href={`http://localhost:5000/api/applications/job/${jobId}/export`}
              className="glass-button small secondary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                const token = localStorage.getItem("token");
                fetch(`http://localhost:5000/api/applications/job/${jobId}/export`, {
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
          {applicants.map((app, index) => (
            <div
              key={app._id}
              className="applicant-card fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="applicant-header">
                <div className="applicant-avatar">
                  {app.applicant?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="applicant-info">
                  <h3>{app.applicant?.name || "Unknown"}</h3>
                  <p>{app.applicant?.email}</p>
                </div>
                <span className={`status-badge ${statusConfig[app.status]?.className || ""}`}>
                  {statusConfig[app.status]?.label || app.status}
                </span>
              </div>

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

              <div className="applicant-section">
                <label>Applied</label>
                <p>{new Date(app.appliedAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric"
                })}</p>
              </div>

              <div className="applicant-actions">
                <Link
                  to={`/chat?user=${app.applicant?._id}`}
                  className="glass-button small secondary"
                >
                  💬 Message
                </Link>
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
          ))}
        </div>
      )}
    </div>
  );
}
