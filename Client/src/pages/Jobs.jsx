import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import SEO from "../components/SEO";
import "../App.css";
import "./Jobs.css";

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [expFilter, setExpFilter] = useState(searchParams.get("experienceLevel") || "");
  const [salaryFilter, setSalaryFilter] = useState(searchParams.get("salary") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || (searchParams.get("search") ? "relevance" : "newest"));
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState(new Set());
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trending, setTrending] = useState([]);
  const token = localStorage.getItem("token");
  const toast = useToast();
  const LIMIT = 9;

  useEffect(() => {
    if (token) fetchSaved();
    fetchTrending();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, search, locationFilter, typeFilter, expFilter, salaryFilter, sort]);

  // Debounce search
  const [searchInput, setSearchInput] = useState(search);
  const [locInput, setLocInput] = useState(locationFilter);

  // Debounce search input for autocomplete
  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchInput.length >= 2 && searchInput !== search) {
        try {
          const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(searchInput)}`);
          setSuggestions(res.data);
          setShowSuggestions(res.data.length > 0);
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  // Handle actual search submission
  const handleSearchSubmit = (term) => {
    const newSearch = term || searchInput;
    setSearch(newSearch);
    setSearchInput(newSearch);
    setShowSuggestions(false);
    setPage(1);
    if (newSearch && sort === "newest") setSort("relevance");
  };

  const fetchTrending = async () => {
    try {
      const res = await api.get("/search/trending");
      setTrending(res.data);
    } catch {
      // ignore
    }
  };

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
      if (expFilter) params.set("experienceLevel", expFilter);

      // Salary range filter
      if (salaryFilter) {
        params.set("salary", salaryFilter);
        const ranges = {
          "0-500000": { min: 0, max: 500000 },
          "500000-1000000": { min: 500000, max: 1000000 },
          "1000000-2000000": { min: 1000000, max: 2000000 },
          "2000000+": { min: 2000000 },
        };
        const range = ranges[salaryFilter];
        if (range) {
          if (range.min !== undefined) params.set("salaryMin", range.min);
          if (range.max !== undefined) params.set("salaryMax", range.max);
        }
      }

      if (sort) params.set("sort", sort);

      setSearchParams(params, { replace: true });

      // Use the new search endpoint
      const res = await api.get(`/search/jobs?${params.toString()}`);
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
      <SEO title="Browse Jobs" description="Search and filter thousands of jobs. Find full-time, remote, contract, and internship opportunities." />
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p>Discover your next career opportunity</p>
      </div>

      {/* Search & Filters */}
      <div className="jobs-filters">
        <div className="search-container">
          <input
            type="text"
            className="glass-input search-input"
            placeholder="🔍 Search by title, company, or skill..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(searchInput);
            }}
          />
          
          {showSuggestions && (
            <div className="autocomplete-dropdown">
              {suggestions.map((s, i) => (
                <div 
                  key={i} 
                  className="autocomplete-item"
                  onClick={() => handleSearchSubmit(`${s.title} at ${s.company}`)}
                >
                  <span className="autocomplete-title">{s.title}</span>
                  <span className="autocomplete-company">{s.company}</span>
                </div>
              ))}
            </div>
          )}

          {!search && trending.length > 0 && (
            <div className="trending-chips">
              <span className="trending-label">Trending:</span>
              {trending.map(term => (
                <span 
                  key={term} 
                  className="trending-chip"
                  onClick={() => handleSearchSubmit(term)}
                >
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>

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
        <select
          className="glass-select filter-select"
          value={expFilter}
          onChange={(e) => { setExpFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Levels</option>
          <option value="Entry">Entry</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
        <select
          className="glass-select filter-select"
          value={salaryFilter}
          onChange={(e) => { setSalaryFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Salaries</option>
          <option value="0-500000">Under ₹5L</option>
          <option value="500000-1000000">₹5L – ₹10L</option>
          <option value="1000000-2000000">₹10L – ₹20L</option>
          <option value="2000000+">₹20L+</option>
        </select>
      </div>

      <div className="results-header">
        <p className="results-count">
          <strong>{total}</strong> job{total !== 1 ? "s" : ""} found
          {totalPages > 1 && ` • Page ${page} of ${totalPages}`}
        </p>

        <div className="sort-container">
          <span className="sort-label">Sort by:</span>
          <select 
            className="glass-select sort-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            {search && <option value="relevance">Most Relevant</option>}
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

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
                  {job.experienceLevel && (
                    <span className="badge secondary">{job.experienceLevel}</span>
                  )}
                  <span className="job-location">📍 {job.location}</span>
                </div>

                {job.deadline && new Date(job.deadline) > new Date() && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    ⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                )}

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
