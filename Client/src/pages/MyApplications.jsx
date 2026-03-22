import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./MyApplications.css";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications/me");
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications");
    } finally {
      setLoading(false);
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
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track the status of your job applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No applications yet</h3>
          <p>Start applying to jobs to see them here</p>
          <Link to="/jobs" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Browse Jobs →
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app, index) => (
            <div
              key={app._id}
              className="application-card fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="app-card-left">
                <div className="company-avatar">
                  {app.job?.company?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="app-card-info">
                  <Link to={`/jobs/${app.job?._id}`} className="app-job-title">
                    {app.job?.title || "Job Removed"}
                  </Link>
                  <p className="app-company">
                    {app.job?.company || "Unknown"} • {app.job?.location || ""}
                  </p>
                  <p className="app-date">
                    Applied {new Date(app.appliedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="app-card-right">
                <span className={`status-badge ${statusConfig[app.status]?.className || ""}`}>
                  {statusConfig[app.status]?.label || app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
