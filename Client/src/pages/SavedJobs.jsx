import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./SavedJobs.css";

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await api.get("/saved-jobs");
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await api.post(`/saved-jobs/${jobId}`);
      setJobs(jobs.filter((j) => j._id !== jobId));
      toast.info("Job removed from saved");
    } catch (err) {
      toast.error("Failed to unsave job");
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
        <h1>🔖 Saved Jobs</h1>
        <p>Jobs you've bookmarked for later</p>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <h3>No saved jobs</h3>
          <p>Browse jobs and click the bookmark icon to save them</p>
          <Link to="/jobs" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Browse Jobs →
          </Link>
        </div>
      ) : (
        <div className="saved-jobs-grid">
          {jobs.map((job, index) => (
            <div
              key={job._id}
              className="saved-job-card fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                className="unsave-btn"
                onClick={() => handleUnsave(job._id)}
                title="Remove from saved"
              >
                ✕
              </button>

              <Link to={`/jobs/${job._id}`} className="saved-job-link">
                <div className="saved-job-header">
                  <div className="company-avatar">
                    {job.company?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company} • {job.location}</p>
                  </div>
                </div>

                <div className="saved-job-tags">
                  <span className="badge primary">{job.type || "Full-time"}</span>
                  {job.salary && (
                    <span className="badge success">💰 {job.salary}</span>
                  )}
                </div>

                {job.skills?.length > 0 && (
                  <div className="saved-job-skills">
                    {job.skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="skill-tag">{s}</span>
                    ))}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
