import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Jobs.css";

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState(new Set());
  const token = localStorage.getItem("token");
  const toast = useToast();
  const LIMIT = 9;

  useEffect(() => {
    if (token) fetchSaved();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, search, locationFilter, typeFilter]);

  // Debounce search
  const [searchInput, setSearchInput] = useState(search);
  const [locInput, setLocInput] = useState(locationFilter);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLocationFilter(locInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [locInput]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", LIMIT);
      if (search) params.set("search", search);
      if (locationFilter) params.set("location", locationFilter);
      if (typeFilter) params.set("type", typeFilter);

      setSearchParams(params, { replace: true });

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch {
      console.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const res = await api.get("/saved-jobs");
      setSavedIds(new Set(res.data.map((j) => j._id)));
    } catch {/* ignore */}
  };

  const toggleSave = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    try {
      const res = await api.post(`/saved-jobs/${jobId}`);
      if (res.data.saved) {
        setSavedIds((prev) => new Set([...prev, jobId]));
        toast.success("Job saved!");
      } else {
        setSavedIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
        toast.info("Removed from saved");
      }
    } catch { toast.error("Failed to save"); }
  };

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${i === page ? "active" : ""}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p>Discover your next career opportunity</p>
      </div>

      {/* Search & Filters */}
      <div className="jobs-filters">
        <input
          type="text"
          className="glass-input search-input"
          placeholder="🔍 Search by title, company, or skill..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <input
          type="text"
          className="glass-input filter-input"
          placeholder="📍 Location..."
          value={locInput}
          onChange={(e) => setLocInput(e.target.value)}
        />
        <select
          className="glass-select filter-select"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Remote">Remote</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>
      </div>

      <p className="results-count">
        {total} job{total !== 1 ? "s" : ""} found
        {totalPages > 1 && ` • Page ${page} of ${totalPages}`}
      </p>

      {/* Jobs Grid */}
      {loading ? (
        <div className="jobs-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="job-card skeleton-card">
              <div className="skeleton-line wide" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="jobs-grid">
            {jobs.map((job, index) => (
              <Link
                to={`/jobs/${job._id}`}
                key={job._id}
                className="job-card fade-in-up"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                {token && (
                  <button
                    className={`bookmark-btn ${savedIds.has(job._id) ? "saved" : ""}`}
                    onClick={(e) => toggleSave(e, job._id)}
                    title={savedIds.has(job._id) ? "Unsave" : "Save"}
                  >
                    {savedIds.has(job._id) ? "★" : "☆"}
                  </button>
                )}

                <div className="job-card-header">
                  <div className="company-avatar">
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="job-card-meta">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company">{job.company}</p>
                  </div>
                </div>

                <div className="job-card-tags">
                  <span className="badge primary">{job.type || "Full-time"}</span>
                  <span className="job-location">📍 {job.location}</span>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="job-skills">
                    {job.skills.slice(0, 4).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="skill-tag more">+{job.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="job-card-footer">
                  <span className="job-salary">{job.salary || "Not disclosed"}</span>
                  <span className="job-time">{timeAgo(job.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {renderPageButtons()}
              <button
                className="page-btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
