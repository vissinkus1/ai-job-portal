import { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./Admin.css";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  // Reports tab state
  const [reports, setReports] = useState([]);
  const [reportsFilter, setReportsFilter] = useState("");
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab, usersSearch, usersPage]);

  useEffect(() => {
    if (activeTab === "reports") fetchReports();
  }, [activeTab, reportsFilter, reportsPage]);

  const fetchData = async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/charts"),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setAccessDenied(true);
      }
      console.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", usersPage);
      params.set("limit", 15);
      if (usersSearch) params.set("search", usersSearch);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setUsersTotalPages(res.data.totalPages);
      setUsersTotal(res.data.total);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", reportsPage);
      params.set("limit", 15);
      if (reportsFilter) params.set("status", reportsFilter);
      const res = await api.get(`/reports/admin/all?${params}`);
      setReports(res.data.reports);
      setReportsTotalPages(res.data.totalPages);
      setReportsTotal(res.data.total);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`);
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isAdmin: res.data.user.isAdmin } : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isBanned: res.data.user.isBanned } : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update ban status");
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await api.put(`/reports/admin/${reportId}`, { status: "dismissed" });
      toast.success("Report dismissed");
      fetchReports();
    } catch {
      toast.error("Failed to dismiss report");
    }
  };

  const handleRemoveJob = async (reportId) => {
    if (!window.confirm("Are you sure you want to remove this job? This cannot be undone.")) return;
    try {
      await api.delete(`/reports/admin/${reportId}/remove-job`);
      toast.success("Job removed and reports resolved");
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove job");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>You don't have admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const maxApps = charts?.appsPerDay?.length
    ? Math.max(...charts.appsPerDay.map((d) => d.count))
    : 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Platform analytics, user management, and moderation</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📈 Overview
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={`admin-tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          🚩 Reports
        </button>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <>
          {/* Stats Cards */}
          <div className="admin-stats fade-in-up">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: "rgba(0, 198, 255, 0.12)" }}>👥</div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalUsers || 0}</span>
                <span className="admin-stat-label">Total Users</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: "rgba(139, 92, 246, 0.12)" }}>💼</div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalJobs || 0}</span>
                <span className="admin-stat-label">Total Jobs</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: "rgba(34, 197, 94, 0.12)" }}>📨</div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.totalApps || 0}</span>
                <span className="admin-stat-label">Applications</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: "rgba(245, 158, 11, 0.12)" }}>👔</div>
              <div className="admin-stat-info">
                <span className="admin-stat-number">{stats?.employers || 0}</span>
                <span className="admin-stat-label">Employers</span>
              </div>
            </div>
          </div>

          <div className="admin-grid">
            {/* Bar Chart */}
            <div className="admin-panel fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h3>📈 Applications (Last 7 Days)</h3>
              {charts?.appsPerDay?.length > 0 ? (
                <div className="bar-chart">
                  {charts.appsPerDay.map((day) => (
                    <div key={day._id} className="bar-col">
                      <span className="bar-value">{day.count}</span>
                      <div
                        className="bar-fill"
                        style={{ height: `${(day.count / maxApps) * 100}%` }}
                      />
                      <span className="bar-label">
                        {new Date(day._id).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">No application data for the last 7 days</p>
              )}
            </div>

            {/* Status Breakdown */}
            <div className="admin-panel fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h3>📋 Application Status</h3>
              <div className="status-chart">
                {charts?.statusBreakdown?.map((s) => {
                  const colors = {
                    pending: "#f59e0b", reviewed: "#00c6ff",
                    accepted: "#22c55e", rejected: "#ef4444",
                  };
                  return (
                    <div key={s._id} className="status-row">
                      <span className="status-dot" style={{ background: colors[s._id] || "#888" }} />
                      <span className="status-name">{s._id}</span>
                      <span className="status-count">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Companies */}
            <div className="admin-panel fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h3>🏢 Top Companies</h3>
              <div className="top-list">
                {charts?.topCompanies?.map((c, i) => (
                  <div key={c._id} className="top-item">
                    <span className="top-rank">#{i + 1}</span>
                    <span className="top-name">{c._id}</span>
                    <span className="badge primary">{c.count} job{c.count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="admin-panel fade-in-up" style={{ animationDelay: "0.25s" }}>
              <h3>🆕 Recent Users</h3>
              <div className="recent-users-list">
                {stats?.recentUsers?.map((u) => (
                  <div key={u._id} className="recent-user-item">
                    <div className="contact-avatar small">
                      {u.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="recent-user-info">
                      <h4>{u.name}</h4>
                      <p>{u.email}</p>
                    </div>
                    <span className={`badge ${u.role === "employer" ? "secondary" : "primary"}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== USERS TAB ==================== */}
      {activeTab === "users" && (
        <div className="admin-tab-content fade-in-up">
          <div className="admin-toolbar">
            <input
              type="text"
              className="glass-input"
              placeholder="🔍 Search users by name or email..."
              value={usersSearch}
              onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
            />
            <span className="toolbar-count">{usersTotal} user{usersTotal !== 1 ? "s" : ""}</span>
          </div>

          {usersLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="admin-empty">No users found</div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className={u.isBanned ? "banned-row" : ""}>
                      <td>
                        <div className="user-cell">
                          <div className="contact-avatar small">{u.name?.charAt(0).toUpperCase()}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "employer" ? "secondary" : "primary"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.isBanned ? (
                          <span className="badge danger">🚫 Banned</span>
                        ) : u.isAdmin ? (
                          <span className="badge admin">⭐ Admin</span>
                        ) : (
                          <span className="badge success-subtle">Active</span>
                        )}
                      </td>
                      <td className="date-cell">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className={`glass-button small ${u.isAdmin ? "danger" : "ghost"}`}
                            onClick={() => handleToggleAdmin(u._id)}
                            title={u.isAdmin ? "Remove admin" : "Make admin"}
                          >
                            {u.isAdmin ? "Remove Admin" : "Make Admin"}
                          </button>
                          <button
                            className={`glass-button small ${u.isBanned ? "secondary" : "danger"}`}
                            onClick={() => handleToggleBan(u._id)}
                            title={u.isBanned ? "Unban user" : "Ban user"}
                          >
                            {u.isBanned ? "Unban" : "Ban"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Pagination */}
          {usersTotalPages > 1 && (
            <div className="pagination" style={{ marginTop: "20px" }}>
              <button
                className="page-btn"
                onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                disabled={usersPage === 1}
              >
                ← Prev
              </button>
              <span className="page-info">Page {usersPage} of {usersTotalPages}</span>
              <button
                className="page-btn"
                onClick={() => setUsersPage(Math.min(usersTotalPages, usersPage + 1))}
                disabled={usersPage === usersTotalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== REPORTS TAB ==================== */}
      {activeTab === "reports" && (
        <div className="admin-tab-content fade-in-up">
          <div className="admin-toolbar">
            <select
              className="glass-select"
              value={reportsFilter}
              onChange={(e) => { setReportsFilter(e.target.value); setReportsPage(1); }}
            >
              <option value="">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <span className="toolbar-count">{reportsTotal} report{reportsTotal !== 1 ? "s" : ""}</span>
          </div>

          {reportsLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : reports.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <div className="empty-icon">✅</div>
              <h3>No reports</h3>
              <p>No flagged content to review</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((r) => (
                <div key={r._id} className={`report-card ${r.status}`}>
                  <div className="report-header">
                    <div className="report-meta">
                      <span className={`badge ${r.reason === "spam" ? "secondary" : r.reason === "inappropriate" ? "danger" : "primary"}`}>
                        {r.reason}
                      </span>
                      <span className={`badge ${r.status === "pending" ? "warning" : r.status === "dismissed" ? "ghost" : "success-subtle"}`}>
                        {r.status}
                      </span>
                    </div>
                    <span className="report-date">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="report-body">
                    <h4>
                      🏢 {r.job?.title || "Deleted Job"} — {r.job?.company || "N/A"}
                    </h4>
                    {r.details && <p className="report-details">"{r.details}"</p>}
                    <div className="report-info-row">
                      <span>Reported by: <strong>{r.reporter?.name || "Unknown"}</strong> ({r.reporter?.email})</span>
                      {r.job?.postedBy && (
                        <span>Posted by: <strong>{r.job.postedBy.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="report-actions">
                      <button
                        className="glass-button small ghost"
                        onClick={() => handleDismissReport(r._id)}
                      >
                        ✅ Dismiss
                      </button>
                      <button
                        className="glass-button small danger"
                        onClick={() => handleRemoveJob(r._id)}
                      >
                        🗑️ Remove Job
                      </button>
                    </div>
                  )}

                  {r.adminNote && (
                    <p className="report-admin-note">Admin note: {r.adminNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reports Pagination */}
          {reportsTotalPages > 1 && (
            <div className="pagination" style={{ marginTop: "20px" }}>
              <button
                className="page-btn"
                onClick={() => setReportsPage(Math.max(1, reportsPage - 1))}
                disabled={reportsPage === 1}
              >
                ← Prev
              </button>
              <span className="page-info">Page {reportsPage} of {reportsTotalPages}</span>
              <button
                className="page-btn"
                onClick={() => setReportsPage(Math.min(reportsTotalPages, reportsPage + 1))}
                disabled={reportsPage === reportsTotalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
