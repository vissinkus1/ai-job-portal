import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import EmptyState from "../components/EmptyState";
import "../App.css";
import "./MyApplications.css";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTimeline, setExpandedTimeline] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, intRes] = await Promise.all([
        api.get("/applications/me"),
        api.get("/interviews/me").catch(() => ({ data: [] })),
      ]);
      setApplications(appRes.data);
      setInterviews(intRes.data);
    } catch (err) {
      console.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await api.delete(`/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a._id !== appId));
      toast.success("Application withdrawn");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw");
    }
  };

  const getInterviewForApp = (appId) => {
    return interviews.find((i) => i.application === appId && i.status === "scheduled");
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

  // Filter and paginate
  const filtered = statusFilter === "all"
    ? applications
    : applications.filter((a) => a.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Upcoming interviews
  const upcomingInterviews = interviews.filter(
    (i) => i.status === "scheduled" && new Date(i.dateTime) > new Date()
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track the status of your job applications</p>
      </div>

      {/* Upcoming Interviews Section */}
      {upcomingInterviews.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>📅 Upcoming Interviews</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {upcomingInterviews.map((interview) => (
              <div
                key={interview._id}
                className="profile-form-card"
                style={{ padding: "16px", background: "rgba(124, 58, 237, 0.06)", border: "1px solid rgba(124, 58, 237, 0.15)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>
                      {interview.job?.title || "Job"} — {interview.job?.company || ""}
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      🕐 {new Date(interview.dateTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {interview.notes && (
                      <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        📝 {interview.notes}
                      </p>
                    )}
                  </div>
                  {interview.meetingLink && (
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button small"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                      🔗 Join Meeting
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select
          className="glass-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ maxWidth: "200px" }}
        >
          <option value="all">All Status ({applications.length})</option>
          <option value="pending">⏳ Pending ({applications.filter(a => a.status === "pending").length})</option>
          <option value="reviewed">👀 Reviewed ({applications.filter(a => a.status === "reviewed").length})</option>
          <option value="accepted">✅ Accepted ({applications.filter(a => a.status === "accepted").length})</option>
          <option value="rejected">❌ Rejected ({applications.filter(a => a.status === "rejected").length})</option>
        </select>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Showing {paginated.length} of {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="applications"
          title={statusFilter === "all" ? "No applications yet" : `No ${statusFilter} applications`}
          description="Start applying to jobs to track your applications here"
          actionLabel="Browse Jobs"
          actionTo="/jobs"
        />
      ) : (
        <>
          <div className="applications-list">
            {paginated.map((app, index) => {
              const scheduledInterview = getInterviewForApp(app._id);
              return (
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
                      {scheduledInterview && (
                        <p style={{ color: "var(--primary)", fontSize: "0.85rem", marginTop: "4px", fontWeight: 500 }}>
                          📅 Interview: {new Date(scheduledInterview.dateTime).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="app-card-right">
                    <span className={`status-badge ${statusConfig[app.status]?.className || ""}`}>
                      {statusConfig[app.status]?.label || app.status}
                    </span>
                    <button
                      className="glass-button ghost small"
                      style={{ fontSize: "0.78rem", marginTop: "6px" }}
                      onClick={() => setExpandedTimeline(expandedTimeline === app._id ? null : app._id)}
                    >
                      {expandedTimeline === app._id ? "Hide Timeline" : "View Timeline"}
                    </button>
                    {app.status === "pending" && (
                      <button
                        className="glass-button ghost small"
                        style={{ color: "#ff4d4d", fontSize: "0.8rem", marginTop: "4px" }}
                        onClick={() => handleWithdraw(app._id)}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>

                  {/* Timeline */}
                  {expandedTimeline === app._id && app.statusHistory?.length > 0 && (
                    <div className="app-timeline">
                      <div className="app-timeline__line" />
                      {app.statusHistory.map((entry, i) => (
                        <div key={i} className={`app-timeline__item ${i === app.statusHistory.length - 1 ? "app-timeline__item--current" : ""}`}>
                          <div className={`app-timeline__dot app-timeline__dot--${entry.status}`} />
                          <div className="app-timeline__content">
                            <span className="app-timeline__status">
                              {statusConfig[entry.status]?.label || entry.status}
                            </span>
                            <span className="app-timeline__date">
                              {new Date(entry.changedAt).toLocaleString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                                hour: "numeric", minute: "2-digit"
                              })}
                            </span>
                            {entry.note && <span className="app-timeline__note">{entry.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: "20px" }}>
              <button
                className="page-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
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
