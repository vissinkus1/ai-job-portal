import { useState, useEffect } from "react";
import api from "../services/api";
import "../App.css";
import "./Admin.css";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/charts"),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data");
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

  const maxApps = charts?.appsPerDay?.length
    ? Math.max(...charts.appsPerDay.map((d) => d.count))
    : 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Platform analytics and overview</p>
      </div>

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
    </div>
  );
}
