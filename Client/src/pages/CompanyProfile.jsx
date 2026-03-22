import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./CompanyProfile.css";

export default function CompanyProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const res = await api.get(`/company/${id}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>Company not found</h3>
          <Link to="/jobs" className="glass-button small" style={{ marginTop: 16, display: "inline-block" }}>
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  const { employer, jobs, totalJobs } = data;

  return (
    <div className="page-container">
      <div className="company-header fade-in-up">
        <div className="company-avatar-lg">
          {employer.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="company-header-info">
          <h1>{employer.name}</h1>
          <p className="company-email">{employer.email}</p>
          {employer.bio && <p className="company-bio">{employer.bio}</p>}
          <div className="company-stat-row">
            <span className="badge primary">👔 Employer</span>
            <span className="badge secondary">{totalJobs} Job{totalJobs !== 1 ? "s" : ""} Posted</span>
            {employer.createdAt && (
              <span className="badge" style={{ background: "rgba(255,255,255,0.06)" }}>
                Joined {new Date(employer.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 className="company-section-title">Posted Jobs</h2>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <p>No jobs posted yet</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job, i) => (
            <Link
              to={`/jobs/${job._id}`}
              key={job._id}
              className="job-card fade-in-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="job-card-header">
                <div className="company-avatar">{job.company.charAt(0).toUpperCase()}</div>
                <div className="job-card-meta">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                </div>
              </div>
              <div className="job-card-tags">
                <span className="badge primary">{job.type || "Full-time"}</span>
                <span className="job-location">📍 {job.location}</span>
              </div>
              {job.skills?.length > 0 && (
                <div className="job-skills">
                  {job.skills.slice(0, 4).map((s, j) => (
                    <span key={j} className="skill-tag">{s}</span>
                  ))}
                </div>
              )}
              <div className="job-card-footer">
                <span className="job-salary">{job.salary || "Not disclosed"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
