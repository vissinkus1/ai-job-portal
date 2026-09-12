import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import "./ManageJobs.css";

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appCounts, setAppCounts] = useState({});

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const [profileRes, jobsRes, countsRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/jobs?includeExpired=true"),
        api.get("/dashboard/job-app-counts"),
      ]);
      const myJobs = jobsRes.data.filter(
        (j) => j.postedBy?._id === profileRes.data._id
      );
      setJobs(myJobs);
      setAppCounts(countsRes.data);
    } catch (err) {
      console.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
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
        <div className="page-header-row">
          <div>
            <h1>Manage Jobs</h1>
            <p>View and manage your posted job listings</p>
          </div>
          <Link to="/post-job" className="glass-button small">
            + Post New Job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No jobs posted yet</h3>
          <p>Start posting jobs to find the right talent</p>
          <Link to="/post-job" className="glass-button small" style={{ marginTop: "16px", display: "inline-block" }}>
            Post a Job →
          </Link>
        </div>
      ) : (
        <div className="manage-jobs-list">
          {jobs.map((job, index) => (
            <div
              key={job._id}
              className="manage-job-card fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="manage-job-left">
                <div className="company-avatar">
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className="manage-job-info">
                  <h3>{job.title}</h3>
                  <p>{job.company} • {job.location}</p>
                  <p className="manage-job-date">
                    Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="manage-job-right">
                <Link
                  to={`/manage-jobs/${job._id}/applicants`}
                  className="applicant-count"
                >
                  👥 {appCounts[job._id] || 0} Applicant{appCounts[job._id] !== 1 ? "s" : ""}
                </Link>
                <div className="manage-job-actions">
                  <Link to={`/jobs/${job._id}`} className="glass-button small secondary">
                    View
                  </Link>
                  <Link to={`/edit-job/${job._id}`} className="glass-button small secondary">
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="glass-button small danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
